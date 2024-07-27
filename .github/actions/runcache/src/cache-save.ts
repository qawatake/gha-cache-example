// // some modifications were made to https://github.com/actions/setup-go/tree/v5.0.2/src
import * as core from '@actions/core'
import * as cache from '@actions/cache'
import * as github from '@actions/github'
import { State } from './constants'
import crypto from 'crypto'

export const cachePackages = async (cachePath: string) => {
  const state = core.getState(State.CacheMatchedKey)
  const primaryKey = core.getState(State.CachePrimaryKey)

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
  console.log(crypto.createHash('sha256').update('string').digest('hex'))
  console.log(crypto.createHash('md5').update(cachePath).digest())
  console.log(crypto.createHash('md5').update(cachePath).digest('hex'))

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
