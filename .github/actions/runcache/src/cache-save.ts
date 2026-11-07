// // some modifications were made to https://github.com/actions/setup-go/tree/v5.0.2/src
import * as core from '@actions/core'
import * as cache from '@actions/cache'
import * as github from '@actions/github'
import { State } from './constants'

export const cachePackages = async (
  cachePath: string,
  token: string
): Promise<void> => {
  const state = core.getState(State.CacheMatchedKey)
  const primaryKey = core.getState(State.CachePrimaryKey)
  const oktokit = github.getOctokit(token)

  if (!primaryKey) {
    core.info(
      'Primary key was not generated. Please check the log messages above for more errors or information'
    )
    return
  }

  const cacheHit = primaryKey === state
  if (cacheHit) {
    core.info(
      `Cache hit occurred on the primary key ${primaryKey}, deleting cache.`
    )
    await oktokit.rest.actions.deleteActionsCacheByKey({
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
