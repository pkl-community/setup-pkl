// Manual mock for the ESM-only @actions/github so the CommonJS Jest setup can
// resolve and stub it (see moduleNameMapper in package.json).
export const getOctokit = jest.fn()
