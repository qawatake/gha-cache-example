/**
 * Unit tests for src/cache-save.ts
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import { cachePackages } from '../src/cache-save'
import { State } from '../src/constants'

jest.mock('@actions/cache', () => ({
  saveCache: jest.fn()
}))
jest.mock('@actions/core', () => ({
  getState: jest.fn(),
  info: jest.fn()
}))

const state = (primary: string, matched: string): void => {
  jest.mocked(core.getState).mockImplementation(name => {
    if (name === State.CachePrimaryKey) return primary
    if (name === State.CacheMatchedKey) return matched
    return ''
  })
}

describe('cachePackages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('saves when the primary key missed', async () => {
    state('primary', 'fallback')
    jest.mocked(cache.saveCache).mockResolvedValue(1)

    await cachePackages('/cache')

    expect(cache.saveCache).toHaveBeenCalledWith(['/cache'], 'primary')
    expect(core.info).toHaveBeenCalledWith('Cache saved with the key: primary')
  })

  it('does not save on a primary key hit', async () => {
    state('primary', 'primary')

    await cachePackages('/cache')

    expect(cache.saveCache).not.toHaveBeenCalled()
  })

  it('does not save without a primary key', async () => {
    state('', '')

    await cachePackages('/cache')

    expect(cache.saveCache).not.toHaveBeenCalled()
  })

  it('does not report success when saving was skipped', async () => {
    state('primary', '')
    jest.mocked(cache.saveCache).mockResolvedValue(-1)

    await cachePackages('/cache')

    expect(core.info).not.toHaveBeenCalledWith(
      'Cache saved with the key: primary'
    )
  })
})
