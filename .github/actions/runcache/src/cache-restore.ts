// some modifications were made to https://github.com/actions/setup-go/tree/v5.0.2/src
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import crypto from 'crypto'

import { State, Outputs } from './constants'

export const restoreCache = async (
  workflowId: string,
  jobId: string,
  cachePath: string
) => {
  const platform = process.env.RUNNER_OS

  const linuxVersion =
    process.env.RUNNER_OS === 'Linux' ? `${process.env.ImageOS}-` : ''
  const hash = crypto.createHash('md5').update(cachePath).digest()
  const primaryKey = `runcache-${workflowId}-${jobId}-${platform}-${linuxVersion}${hash}`
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
