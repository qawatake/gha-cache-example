import * as core from '@actions/core'
import * as cache from '@actions/cache'
import fs from 'fs'
import { State } from './constants'
// import { getCacheDirectoryPath, getPackageManagerInfo } from './cache-utils'

export const cachePackages = async (cachePath: string) => {
  // const packageManager = 'default'

  const state = core.getState(State.CacheMatchedKey)
  const primaryKey = core.getState(State.CachePrimaryKey)

  // const packageManagerInfo = await getPackageManagerInfo(packageManager);

  // const cachePaths = await getCacheDirectoryPath(packageManagerInfo);

  // const nonExistingPaths = [cachePath].filter(
  //   cachePath => !fs.existsSync(cachePath)
  // )

  // if (nonExistingPaths.length === cachePaths.length) {
  //   core.warning('There are no cache folders on the disk')
  //   return
  // }

  // if (nonExistingPaths.length) {
  //   logWarning(
  //     `Cache folder path is retrieved but doesn't exist on disk: ${nonExistingPaths.join(
  //       ', '
  //     )}`
  //   )
  // }

  // if (!primaryKey) {
  //   core.info(
  //     'Primary key was not generated. Please check the log messages above for more errors or information'
  //   )
  //   return
  // }
  core.debug(`save-if: ${core.getBooleanInput('save-if')}`)
  core.debug(`cache-hit: ${state}`)
  core.debug(`cache paths: ${[cachePath]}`)

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
