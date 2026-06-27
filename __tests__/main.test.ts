/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
import * as main from '../src/main'
import * as tc from '@actions/tool-cache'
import { chmod } from 'fs/promises'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { determinePlatformInfo } from '../src/platform'

jest.mock('fs/promises', () => ({
  chmod: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn()
}))

// @actions/github is ESM-only; it is resolved to a manual CommonJS mock via
// moduleNameMapper (see package.json) so the dynamic import in checksum.ts can
// be stubbed under the CommonJS Jest setup.
const readFileMock = readFile as jest.MockedFunction<typeof readFile>
const getOctokitMock = getOctokit as jest.MockedFunction<typeof getOctokit>

// The asset name the action resolves for the host running these tests.
const assetName = determinePlatformInfo().githubSourceAssetName

/** Stub getOctokit so the release lookup resolves with the given assets. */
function mockReleaseResponse(
  assets: { name: string; digest?: string }[]
): void {
  getOctokitMock.mockReturnValue({
    rest: {
      repos: {
        getReleaseByTag: jest.fn().mockResolvedValue({ data: { assets } })
      }
    }
  } as unknown as ReturnType<typeof getOctokit>)
}

/** Stub getOctokit so the release lookup rejects. */
function mockReleaseError(error: Error): void {
  getOctokitMock.mockReturnValue({
    rest: {
      repos: {
        getReleaseByTag: jest.fn().mockRejectedValue(error)
      }
    }
  } as unknown as ReturnType<typeof getOctokit>)
}

const runMock = jest.spyOn(main, 'run')

let getInputMock: jest.SpiedFunction<typeof core.getInput>
let findCacheMock: jest.SpiedFunction<typeof tc.find>
let downloadToolMock: jest.SpiedFunction<typeof tc.downloadTool>
let cacheFileMock: jest.SpiedFunction<typeof tc.cacheFile>
let addPathMock: jest.SpiedFunction<typeof core.addPath>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let warningMock: jest.SpiedFunction<typeof core.warning>

describe('action without pkl-version', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    getInputMock = jest.spyOn(core, 'getInput')
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
  })

  it('fails if pkl-version is not provided', async () => {
    await main.run()

    expect(getInputMock).toHaveBeenCalledWith('pkl-version', { required: true })
    expect(setFailedMock).toHaveBeenCalledWith(
      'Input required and not supplied: pkl-version'
    )
  })
})

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    getInputMock = jest.spyOn(core, 'getInput').mockImplementation(name => {
      if (name === 'pkl-version') return '0.26.3'
      if (name === 'token') return 'test-token'
      return ''
    })

    findCacheMock = jest.spyOn(tc, 'find').mockImplementation(() => '')
    downloadToolMock = jest
      .spyOn(tc, 'downloadTool')
      .mockImplementation(async () => Promise.resolve('/tmp/pkl'))
    cacheFileMock = jest
      .spyOn(tc, 'cacheFile')
      .mockImplementation(async () => Promise.resolve('/cached/path'))
    addPathMock = jest.spyOn(core, 'addPath').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    warningMock = jest.spyOn(core, 'warning').mockImplementation()

    // Default: release metadata with no matching digest, so checksum
    // verification is skipped and the download path proceeds.
    readFileMock.mockResolvedValue(Buffer.from('pkl-binary'))
    mockReleaseResponse([])
  })

  it('uses cached PKL if available', async () => {
    findCacheMock.mockImplementation(() => '/cached/pkl')

    await main.run()

    expect(findCacheMock).toHaveBeenCalled()
    expect(downloadToolMock).not.toHaveBeenCalled()
    expect(addPathMock).toHaveBeenCalledWith('/cached/pkl')
    expect(runMock).toHaveReturned()
  })

  it('downloads and caches PKL if not in cache', async () => {
    findCacheMock.mockImplementation(() => '')

    await main.run()

    expect(findCacheMock).toHaveBeenCalled()
    expect(downloadToolMock).toHaveBeenCalled()
    expect(chmod).toHaveBeenCalledWith('/tmp/pkl', 0o711)
    expect(cacheFileMock).toHaveBeenCalled()
    expect(addPathMock).toHaveBeenCalledWith('/cached/path')
    expect(runMock).toHaveReturned()
  })

  it('sets a failed status if neither cached nor downloadable', async () => {
    findCacheMock.mockImplementation(() => '')
    downloadToolMock.mockImplementation(async () =>
      Promise.reject(new Error('Download failed'))
    )

    await main.run()

    expect(findCacheMock).toHaveBeenCalled()
    expect(downloadToolMock).toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalled()
  })

  describe('checksum verification', () => {
    const fileContent = Buffer.from('pkl-binary-content')
    const sha256 = createHash('sha256').update(fileContent).digest('hex')

    beforeEach(() => {
      readFileMock.mockResolvedValue(fileContent)
    })

    it('passes when the downloaded file matches the release digest', async () => {
      mockReleaseResponse([{ name: assetName, digest: `sha256:${sha256}` }])

      await main.run()

      expect(addPathMock).toHaveBeenCalledWith('/cached/path')
      expect(setFailedMock).not.toHaveBeenCalled()
    })

    it('fails when the downloaded file does not match the digest', async () => {
      mockReleaseResponse([{ name: assetName, digest: 'sha256:deadbeef' }])

      await main.run()

      expect(setFailedMock).toHaveBeenCalledWith(
        expect.stringContaining('Checksum mismatch')
      )
      expect(cacheFileMock).not.toHaveBeenCalled()
      expect(addPathMock).not.toHaveBeenCalled()
    })

    it('warns and proceeds when no digest is available', async () => {
      mockReleaseResponse([{ name: 'some-other-asset' }])

      await main.run()

      expect(warningMock).toHaveBeenCalledWith(
        expect.stringContaining('Skipping checksum verification')
      )
      expect(addPathMock).toHaveBeenCalledWith('/cached/path')
      expect(setFailedMock).not.toHaveBeenCalled()
    })

    it('warns and proceeds when release metadata cannot be fetched', async () => {
      mockReleaseError(new Error('Not Found'))

      await main.run()

      expect(warningMock).toHaveBeenCalledWith(
        expect.stringContaining('Could not fetch release metadata')
      )
      expect(addPathMock).toHaveBeenCalledWith('/cached/path')
      expect(setFailedMock).not.toHaveBeenCalled()
    })
  })
})
