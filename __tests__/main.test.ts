/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'

import * as gh from '@actions/github'

const runMock = jest.spyOn(main, 'run')

let errorMock: jest.SpiedFunction<typeof core.error>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>

// Mock the `getOctokit` method
jest.mock('@actions/github', () => ({
  getOctokit: jest.fn().mockReturnValue({
    rest: {
      repos: {
        getReleaseByTag: jest.fn()
      }
    }
  })
}))

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
  })

  it('calls octokit `getReleaseByTag`', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'pkl-version':
          return '0.25.1'
        case 'github-token':
          return '${GITHUB_TOKEN}'
        default:
          return ''
      }
    })

    const spy = jest.spyOn(
      gh.getOctokit('fake-token').rest.repos,
      'getReleaseByTag'
    )
    await main.run()
    expect(runMock).toHaveReturned()
    expect(setOutputMock).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('sets a failed status', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'github-token':
          return ''
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(setFailedMock).toHaveBeenNthCalledWith(
      1,
      'Input "github-token" is required'
    )
    expect(errorMock).not.toHaveBeenCalled()
  })
})
