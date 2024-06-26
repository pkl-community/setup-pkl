import * as core from '@actions/core'
import * as gh from '@actions/github'
import * as tc from '@actions/tool-cache'
import os from 'node:os'
import { chmod } from 'fs/promises'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const pklVersion = core.getInput('pkl-version')
    const githubToken = core.getInput('github-token')

    if (!githubToken) {
      throw new Error('Input "github-token" is required')
    }

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Installing Pkl version ${pklVersion}`)

    const octokit = gh.getOctokit(githubToken)
    const release = await octokit.rest.repos.getReleaseByTag({
      owner: 'apple',
      repo: 'pkl',
      tag: pklVersion
    })
    core.debug(`Found release ID: ${release.data.id}`)

    const assetId = release.data.assets.find(
      a => a.name === findAssetName()
    )?.id
    if (!assetId) {
      throw new Error(`Unable to locate release for Pkl version: ${pklVersion}`)
    }
    core.debug(`Found asset ID: ${assetId}`)

    const asset = await octokit.rest.repos.getReleaseAsset({
      owner: 'apple',
      repo: 'pkl',
      asset_id: assetId
    })

    const pklBinaryPath = await tc.downloadTool(asset.data.browser_download_url)
    const permissionsMode = 0o711
    await chmod(pklBinaryPath, permissionsMode)
    const cachedPath = await tc.cacheFile(
      pklBinaryPath,
      'pkl',
      'pkl',
      pklVersion
    )
    core.debug(
      `Wrote pkl to cached path: ${cachedPath} with permission mode ${permissionsMode}`
    )
    core.addPath(cachedPath)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function findAssetName(): string {
  const op = os.platform()
  const arch = os.arch()

  core.info(`Try to find asset name for: ${op}-${arch}`)
  switch (op) {
    case 'linux':
      return 'pkl-linux-amd64'
    case 'darwin':
      switch (arch) {
        case 'x64':
          return 'pkl-macos-amd64'
        case 'arm64':
          return 'pkl-macos-aarch64'
      }
      break
    case 'win32':
      return 'pkl-windows-amd64.exe'
  }

  throw new Error(`Couldn't find asset name for ${op}-${arch}`)
}
