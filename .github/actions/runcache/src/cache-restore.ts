// some modifications were made to https://github.com/actions/setup-go/tree/v5.0.2/src
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as github from '@actions/github'

import { State, Outputs } from './constants'

export const restoreCache = async (
  jobId: string,
  cachePath: string,
  token: string
) => {
  const platform = process.env.RUNNER_OS

  const linuxVersion =
    process.env.RUNNER_OS === 'Linux' ? `${process.env.ImageOS}-` : ''

  const oktokit = github.getOctokit(token)
  const { data: workflowRun } = await oktokit.rest.actions.getWorkflowRun({
    repo: github.context.repo.repo,
    owner: github.context.repo.owner,
    run_id: github.context.runId
  })
  const { data: workflow } = await oktokit.rest.actions.getWorkflow({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    workflow_id: workflowRun.workflow_id
  })
  const workflowPath = workflow.path
    .replace(/^\.github\/workflows\//, '')
    .replaceAll(',', '-')
  const primaryKey = `runcache-${workflowPath}-${jobId}-${platform}-${linuxVersion}`
  core.debug(`primary key is ${primaryKey}`)

  core.saveState(State.CachePrimaryKey, primaryKey)

  const cacheKey = await cache.restoreCache([cachePath], primaryKey)
  core.setOutput(Outputs.CacheHit, Boolean(cacheKey))

  if (!cacheKey) {
    core.info(`Cache is not found`)
    core.setOutput(Outputs.CacheHit, false)
    return
  }

  core.saveState(State.CacheMatchedKey, cacheKey)
  core.info(`Cache restored from key: ${cacheKey}`)
}
