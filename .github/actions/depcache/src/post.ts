import * as core from '@actions/core'
import { postRun } from './main'

// Catch and log any unhandled exceptions.  These exceptions can leak out of the uploadChunk method in
// @actions/toolkit when a failed upload closes the file descriptor causing any in-process reads to
// throw an uncaught exception.  Instead of failing this action, just warn.
process.on('uncaughtException', e => {
  const warningPrefix = '[warning]'
  core.info(`${warningPrefix}${e.message}`)
})

postRun(true)
