// some modifications were made to https://github.com/actions/setup-go/tree/v5.0.2/src
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as glob from '@actions/glob'

import { State, Outputs } from './constants'

export const restoreCache = async (
  workflowId: string,
  jobId: string,
  dependencyPath: string,
  cachePath: string
) => {
  const platform = process.env.RUNNER_OS
  const fileHash = await glob.hashFiles(dependencyPath)

  if (!fileHash) {
    throw new Error(
      'Some specified paths were not resolved, unable to cache dependencies.'
    )
  }

  const linuxVersion =
    process.env.RUNNER_OS === 'Linux' ? `${process.env.ImageOS}-` : ''
  const cacheKeyPrefix = `depcache-${workflowId}-${jobId}-${platform}-${linuxVersion}`
  const primaryKey = `${cacheKeyPrefix}${fileHash}`
  const secondaryKey = `${cacheKeyPrefix}`
  core.debug(`primary key is ${primaryKey}`)

  core.saveState(State.CachePrimaryKey, primaryKey)

  const cacheKey = await cache.restoreCache([cachePath], primaryKey, [
    secondaryKey
  ])
  core.setOutput(Outputs.CacheHit, Boolean(cacheKey))

  if (!cacheKey) {
    core.info(`Cache is not found`)
    core.setOutput(Outputs.CacheHit, false)
    return
  }

  core.saveState(State.CacheMatchedKey, cacheKey)
  core.info(`Cache restored from key: ${cacheKey}`)
}
