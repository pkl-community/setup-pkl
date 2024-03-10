import * as core from '@actions/core'
import * as gh from '@actions/github'
import * as tc from '@actions/tool-cache'

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
      tag: `v${pklVersion}`
    })
    const assetId = release.data.assets.find(
      a => a.name === 'pkl-linux-amd64'
    )?.id
    if (!assetId) {
      throw new Error(`Unable to locate release for Pkl version: ${pklVersion}`)
    }
    const asset = await octokit.rest.repos.getReleaseAsset({
      owner: 'apple',
      repo: 'pkl',
      asset_id: assetId
    })

    const pklBinaryPath = await tc.downloadTool(asset.data.url)
    const pklBinaryExtractedFolder = await tc.extractTar(pklBinaryPath)
    const cachedPath = await tc.cacheDir(
      pklBinaryExtractedFolder,
      'pkl',
      pklVersion
    )
    core.addPath(cachedPath)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
