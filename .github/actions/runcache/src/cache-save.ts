// // some modifications were made to https://github.com/actions/setup-go/tree/v5.0.2/src
import * as core from '@actions/core'
import * as cache from '@actions/cache'
import * as github from '@actions/github'
import { State } from './constants'

export const cachePackages = async (cachePath: string) => {
  const state = core.getState(State.CacheMatchedKey)
  const primaryKey = core.getState(State.CachePrimaryKey)
  const oktokit = github.getOctokit(core.getInput('github-token'))

  github.context.runId
  github.getOctokit(core.getInput('github-token')).rest.actions.getWorkflow()
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
  core.info(`workflow path: ${workflow.path}`)
  const path = workflow.path + ','
  core.info(path.replace(/^\.github\/workflows\//, '').replaceAll(',', '-'))
  console.log(workflow)

  if (!primaryKey) {
    core.info(
      'Primary key was not generated. Please check the log messages above for more errors or information'
    )
    return
  }

  if (core.getBooleanInput('skip-cache-save')) {
    core.info('skip saving cache.')
    return
  }

  if (primaryKey === state) {
    core.info(
      `Cache hit occurred on the primary key ${primaryKey}, deleting cache.`
    )
    await github
      .getOctokit(core.getInput('github-token'))
      .rest.actions.deleteActionsCacheByKey({
        key: primaryKey,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
      })
  }

  const cacheId = await cache.saveCache([cachePath], primaryKey)
  if (cacheId === -1) {
    return
  }
  core.info(`Cache saved with the key: ${primaryKey}`)
}
