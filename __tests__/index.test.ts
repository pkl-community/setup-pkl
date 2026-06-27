/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { describe, it, expect, vi } from 'vitest'
import * as main from '../src/main'

describe('index', () => {
  it('calls run when imported', async () => {
    const runMock = vi.spyOn(main, 'run').mockResolvedValue()

    await import('../src/index')

    expect(runMock).toHaveBeenCalled()
  })
})
