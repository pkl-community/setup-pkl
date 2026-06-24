import * as core from '@actions/core'
import * as github from '@actions/github'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

/**
 * Verify a downloaded asset against the SHA-256 digest reported by the GitHub
 * release API.
 *
 * Best-effort by design: Apple does not publish standalone checksum files, so
 * the only machine-readable source is the release asset's `digest` field. If
 * that digest is unavailable (older release, missing asset, or the metadata
 * request fails) a warning is logged and verification is skipped rather than
 * failing the action. A genuine mismatch throws.
 *
 * @param filePath Path to the downloaded file on disk.
 * @param pklVersion The Pkl release tag, e.g. `0.31.1`.
 * @param assetName The release asset name, e.g. `pkl-linux-amd64`.
 * @param token Token used to read release metadata (defaults to the runner's
 *   GITHUB_TOKEN via the action input).
 */
export async function verifyChecksum(
  filePath: string,
  pklVersion: string,
  assetName: string,
  token: string
): Promise<void> {
  const expected = await fetchExpectedSha256(pklVersion, assetName, token)
  if (!expected) {
    core.warning(
      `Skipping checksum verification: no SHA-256 digest available for ${assetName} in release ${pklVersion}.`
    )
    return
  }

  const fileBuffer = await readFile(filePath)
  const actual = createHash('sha256').update(fileBuffer).digest('hex')

  if (actual !== expected) {
    throw new Error(
      `Checksum mismatch for ${assetName}: expected ${expected}, got ${actual}. ` +
        `The downloaded file may be corrupted or tampered with.`
    )
  }

  core.debug(`Checksum verified for ${assetName}: sha256:${actual}`)
}

async function fetchExpectedSha256(
  pklVersion: string,
  assetName: string,
  token: string
): Promise<string | undefined> {
  if (!token) {
    core.warning(
      'Could not fetch release metadata for checksum verification: no token available.'
    )
    return undefined
  }

  let assets: { name: string; digest?: string | null }[]
  try {
    const octokit = github.getOctokit(token)
    const release = await octokit.rest.repos.getReleaseByTag({
      owner: 'apple',
      repo: 'pkl',
      tag: pklVersion
    })
    // The `digest` field is not yet present in the bundled Octokit types.
    assets = release.data.assets as { name: string; digest?: string | null }[]
  } catch (error) {
    core.warning(
      `Could not fetch release metadata for checksum verification: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return undefined
  }

  const digest = assets.find(asset => asset.name === assetName)?.digest

  if (!digest || !digest.startsWith('sha256:')) {
    return undefined
  }

  return digest.slice('sha256:'.length)
}
