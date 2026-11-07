/**
 * Unit tests for src/cache-restore.ts
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
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
jest.mock('@actions/glob', () => ({
  hashFiles: jest.fn()
}))
jest.mock('@actions/github', () => ({
  context: { repo: { owner: 'owner', repo: 'repo' }, runId: 42 },
  getOctokit: jest.fn()
}))

const getWorkflowRun = jest.fn<() => Promise<unknown>>()
const getWorkflow = jest.fn<() => Promise<unknown>>()

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
    jest.mocked(glob.hashFiles).mockResolvedValue('filehash')
  })

  it('builds the key from workflow, job, runner and dependency hash', async () => {
    jest.mocked(cache.restoreCache).mockResolvedValue(undefined)

    await restoreCache('test', 'go.mod', '/cache', 'token')

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
    expect(glob.hashFiles).toHaveBeenCalledWith('go.mod')
    const prefix = 'depcache-test.action.yaml-test-Linux-ubuntu24-'
    expect(core.saveState).toHaveBeenCalledWith(
      State.CachePrimaryKey,
      `${prefix}filehash`
    )
    expect(cache.restoreCache).toHaveBeenCalledWith(
      ['/cache'],
      `${prefix}filehash`,
      [prefix]
    )
  })

  it('reports a miss when no cache is found', async () => {
    jest.mocked(cache.restoreCache).mockResolvedValue(undefined)

    await restoreCache('test', 'go.mod', '/cache', 'token')

    expect(core.setOutput).toHaveBeenCalledWith(Outputs.CacheHit, false)
    expect(core.saveState).not.toHaveBeenCalledWith(
      State.CacheMatchedKey,
      expect.anything()
    )
  })

  it('records the matched key on a hit', async () => {
    jest.mocked(cache.restoreCache).mockResolvedValue('matched-key')

    await restoreCache('test', 'go.mod', '/cache', 'token')

    expect(core.setOutput).toHaveBeenCalledWith(Outputs.CacheHit, true)
    expect(core.saveState).toHaveBeenCalledWith(
      State.CacheMatchedKey,
      'matched-key'
    )
  })

  it('omits the image name outside Linux', async () => {
    process.env.RUNNER_OS = 'macOS'
    jest.mocked(cache.restoreCache).mockResolvedValue(undefined)

    await restoreCache('test', 'go.mod', '/cache', 'token')

    expect(cache.restoreCache).toHaveBeenCalledWith(
      ['/cache'],
      'depcache-test.action.yaml-test-macOS-filehash',
      ['depcache-test.action.yaml-test-macOS-']
    )
  })

  it('fails when the dependency files do not resolve', async () => {
    jest.mocked(glob.hashFiles).mockResolvedValue('')

    await expect(
      restoreCache('test', 'missing', '/cache', 'token')
    ).rejects.toThrow('Some specified paths were not resolved')
    expect(cache.restoreCache).not.toHaveBeenCalled()
  })
})
