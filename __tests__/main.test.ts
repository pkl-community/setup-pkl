/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import * as tc from '@actions/tool-cache'
import { chmod } from 'fs/promises'

jest.mock('fs/promises', () => ({
  chmod: jest.fn().mockResolvedValue(undefined)
}))

const runMock = jest.spyOn(main, 'run')

let getInputMock: jest.SpiedFunction<typeof core.getInput>
let findCacheMock: jest.SpiedFunction<typeof tc.find>
let downloadToolMock: jest.SpiedFunction<typeof tc.downloadTool>
let cacheFileMock: jest.SpiedFunction<typeof tc.cacheFile>
let addPathMock: jest.SpiedFunction<typeof core.addPath>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    getInputMock = jest.spyOn(core, 'getInput').mockImplementation(name => name === 'pkl-version' ? return '0.26.3' : return '')

    findCacheMock = jest.spyOn(tc, 'find').mockImplementation(() => '')
    downloadToolMock = jest
      .spyOn(tc, 'downloadTool')
      .mockImplementation(() => Promise.resolve('/tmp/pkl'))
    cacheFileMock = jest
      .spyOn(tc, 'cacheFile')
      .mockImplementation(() => Promise.resolve('/cached/path'))
    addPathMock = jest.spyOn(core, 'addPath').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
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
    downloadToolMock.mockImplementation(() =>
      Promise.reject(new Error('Download failed'))
    )

    await main.run()

    expect(findCacheMock).toHaveBeenCalled()
    expect(downloadToolMock).toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalled()
  })
})
