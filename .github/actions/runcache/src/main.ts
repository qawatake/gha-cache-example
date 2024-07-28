// some modifications were made to https://github.com/actions/setup-go/tree/v5.0.2/src
import * as core from '@actions/core'
import * as github from '@actions/github'
import { restoreCache } from './cache-restore'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run(): Promise<void> {
  try {
    restoreCache(
      github.context.job,
      core.getInput('path'),
      core.getInput('github-token')
    )
    // Set outputs for other workflow steps to use
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
