import * as core from '@actions/core'
import * as cache from '@actions/cache'
import { State } from './constants'

export const cachePackages = async (cachePath: string) => {
  const state = core.getState(State.CacheMatchedKey)
  const primaryKey = core.getState(State.CachePrimaryKey)

  if (!primaryKey) {
    core.info(
      'Primary key was not generated. Please check the log messages above for more errors or information'
    )
    return
  }

  if (!core.getBooleanInput('save-if')) {
    core.info('`save-if` is false, not saving cache.')
    return
  }

  if (primaryKey === state) {
    core.info(
      `Cache hit occurred on the primary key ${primaryKey}, not saving cache.`
    )
    return
  }

  const cacheId = await cache.saveCache([cachePath], primaryKey)
  if (cacheId === -1) {
    return
  }
  core.info(`Cache saved with the key: ${primaryKey}`)
}

function logWarning(message: string): void {
  const warningPrefix = '[warning]'
  core.info(`${warningPrefix}${message}`)
}
