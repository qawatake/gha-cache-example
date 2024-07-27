import * as core from '@actions/core'
import * as github from '@actions/github'
import { wait } from './wait'
import { restoreCache } from './cache-restore'
import { cachePackages } from './cache-save'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    restoreCache(
      github.context.workflow,
      github.context.job,
      core.getInput('dependency-path'),
      core.getInput('path')
    )
    // Set outputs for other workflow steps to use
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

// Added early exit to resolve issue with slow post action step:
// - https://github.com/actions/setup-node/issues/878
// https://github.com/actions/cache/pull/1217
export async function postRun(earlyExit?: boolean) {
  core.debug('😈')
  try {
    // const cacheInput = core.getBooleanInput('cache')
    // if (cacheInput) {
    await cachePackages(core.getInput('path'))

    if (earlyExit) {
      process.exit(0)
    }
    // }
  } catch (error) {
    let message = 'Unknown error!'
    if (error instanceof Error) {
      message = error.message
    }
    if (typeof error === 'string') {
      message = error
    }
    core.warning(message)
  }
}
