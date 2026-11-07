/**
 * Unit tests for src/cache-restore.ts
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import crypto from 'crypto'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { restoreCache } from '../src/cache-restore'
import { State, Outputs } from '../src/constants'

jest.mock('@actions/cache', () => ({
  restoreCache: jest.fn()
}))
jest.mock('@actions/core', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  saveState: jest.fn(),
  setOutput: jest.fn()
}))
jest.mock('@actions/github', () => ({
  context: { repo: { owner: 'owner', repo: 'repo' }, runId: 42 },
  getOctokit: jest.fn()
}))

const getWorkflowRun = jest.fn<() => Promise<unknown>>()
const getWorkflow = jest.fn<() => Promise<unknown>>()
const pathHash = crypto.createHash('md5').update('/cache').digest('hex')

describe('restoreCache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RUNNER_OS = 'Linux'
    process.env.ImageOS = 'ubuntu24'
    getWorkflowRun.mockResolvedValue({ data: { workflow_id: 7 } })
    getWorkflow.mockResolvedValue({
      data: { path: '.github/workflows/test.action.yaml' }
    })
    jest.mocked(github.getOctokit).mockReturnValue({
      rest: { actions: { getWorkflowRun, getWorkflow } }
    } as unknown as ReturnType<typeof github.getOctokit>)
  })

  it('builds the key from workflow, job, runner and cache path', async () => {
    jest.mocked(cache.restoreCache).mockResolvedValue(undefined)

    await restoreCache('test', '/cache', 'token')

    expect(github.getOctokit).toHaveBeenCalledWith('token')
    expect(getWorkflowRun).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      run_id: 42
    })
    expect(getWorkflow).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      workflow_id: 7
    })
    const key = `runcache-test.action.yaml-test-Linux-ubuntu24-${pathHash}`
    expect(core.saveState).toHaveBeenCalledWith(State.CachePrimaryKey, key)
    expect(cache.restoreCache).toHaveBeenCalledWith(['/cache'], key)
  })

  it('distinguishes calls by cache path', async () => {
    jest.mocked(cache.restoreCache).mockResolvedValue(undefined)

    await restoreCache('test', '/cache', 'token')
    await restoreCache('test', '/other', 'token')

    const keys = jest.mocked(cache.restoreCache).mock.calls.map(c => c[1])
    expect(keys[0]).not.toEqual(keys[1])
  })

  it('reports a miss when no cache is found', async () => {
    jest.mocked(cache.restoreCache).mockResolvedValue(undefined)

    await restoreCache('test', '/cache', 'token')

    expect(core.setOutput).toHaveBeenCalledWith(Outputs.CacheHit, false)
    expect(core.saveState).not.toHaveBeenCalledWith(
      State.CacheMatchedKey,
      expect.anything()
    )
  })

  it('records the matched key on a hit', async () => {
    jest.mocked(cache.restoreCache).mockResolvedValue('matched-key')

    await restoreCache('test', '/cache', 'token')

    expect(core.setOutput).toHaveBeenCalledWith(Outputs.CacheHit, true)
    expect(core.saveState).toHaveBeenCalledWith(
      State.CacheMatchedKey,
      'matched-key'
    )
  })
})
