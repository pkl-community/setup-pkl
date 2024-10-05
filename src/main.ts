import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import { chmod } from 'fs/promises'
import { determinePlatformInfo } from './platform'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const pklVersion = core.getInput('pkl-version', { required: true })
    core.debug(`Installing Pkl version ${pklVersion}`)

    // Try to retrieve from cache first
    let cachedPath = tc.find('pkl', pklVersion)
    if (cachedPath) {
      core.debug(`Found cached Pkl version at ${cachedPath}`)
    } else {
      const platformInfo = determinePlatformInfo()
      const downloadUrl = `https://github.com/apple/pkl/releases/download/${pklVersion}/${platformInfo.githubSourceAssetName}`

      core.debug(`Download URL: ${downloadUrl}`)

      // Download the PKL binary
      const pklBinaryPath = await tc.downloadTool(downloadUrl)
      core.debug(`Downloaded PKL binary to: ${pklBinaryPath}`)

      // Set executable permissions
      const permissionsMode = 0o711
      await chmod(pklBinaryPath, permissionsMode)
      core.debug(`Set executable permissions on: ${pklBinaryPath}`)

      // Cache the downloaded file
      cachedPath = await tc.cacheFile(
        pklBinaryPath,
        platformInfo.targetFileName,
        'pkl',
        pklVersion
      )
      core.debug(`Cached PKL binary to: ${cachedPath}`)
    }

    core.addPath(cachedPath)
    core.debug(`Added PKL binary to path: ${cachedPath}`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
