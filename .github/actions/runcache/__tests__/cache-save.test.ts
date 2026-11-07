/**
 * Unit tests for src/cache-save.ts
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { cachePackages } from '../src/cache-save'
import { State } from '../src/constants'

jest.mock('@actions/cache', () => ({
  saveCache: jest.fn()
}))
jest.mock('@actions/core', () => ({
  getState: jest.fn(),
  info: jest.fn()
}))
jest.mock('@actions/github', () => ({
  context: { repo: { owner: 'owner', repo: 'repo' } },
  getOctokit: jest.fn()
}))

const deleteActionsCacheByKey = jest.fn<(params: unknown) => Promise<unknown>>()

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
    deleteActionsCacheByKey.mockResolvedValue({})
    jest.mocked(github.getOctokit).mockReturnValue({
      rest: { actions: { deleteActionsCacheByKey } }
    } as unknown as ReturnType<typeof github.getOctokit>)
  })

  it('saves without deleting when the key missed', async () => {
    state('primary', '')
    jest.mocked(cache.saveCache).mockResolvedValue(1)

    await cachePackages('/cache', 'token')

    expect(github.getOctokit).toHaveBeenCalledWith('token')
    expect(deleteActionsCacheByKey).not.toHaveBeenCalled()
    expect(cache.saveCache).toHaveBeenCalledWith(['/cache'], 'primary')
    expect(core.info).toHaveBeenCalledWith('Cache saved with the key: primary')
  })

  it('deletes the old entry and saves again on a hit', async () => {
    state('primary', 'primary')
    jest.mocked(cache.saveCache).mockResolvedValue(1)

    await cachePackages('/cache', 'token')

    expect(deleteActionsCacheByKey).toHaveBeenCalledWith({
      key: 'primary',
      owner: 'owner',
      repo: 'repo'
    })
    expect(cache.saveCache).toHaveBeenCalledWith(['/cache'], 'primary')
    expect(deleteActionsCacheByKey.mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(cache.saveCache).mock.invocationCallOrder[0]
    )
  })

  it('does not save without a primary key', async () => {
    state('', '')

    await cachePackages('/cache', 'token')

    expect(cache.saveCache).not.toHaveBeenCalled()
  })

  it('does not report success when saving was skipped', async () => {
    state('primary', '')
    jest.mocked(cache.saveCache).mockResolvedValue(-1)

    await cachePackages('/cache', 'token')

    expect(core.info).not.toHaveBeenCalledWith(
      'Cache saved with the key: primary'
    )
  })
})
