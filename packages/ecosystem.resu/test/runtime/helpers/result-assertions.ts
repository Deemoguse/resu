import { afterEach, expect, vi } from 'vitest'
import { ResultIsError } from '../../../src/operations/result-is-error'
import { ResultIsOk } from '../../../src/operations/result-is-ok'
import type { ResultAnyError } from '../../../src/operations/result-any-error'
import type { ResultAnyOk } from '../../../src/operations/result-any-ok'

const testContext = globalThis as typeof globalThis & {
	window?: typeof globalThis
	__RESU_EMITTERS__?: Set<unknown>
}

// @ts-expect-error
testContext.window ??= globalThis
afterEach(() => testContext.__RESU_EMITTERS__?.clear())

export const expectOkResult = vi.defineHelper(<T>(
	result: unknown,
	expected: { tag: null | string, data: T },
):
	ResultAnyOk =>
{
	expect(ResultIsOk(result)).toBe(true)
	if (!ResultIsOk(result)) throw new Error('Expected an ok result.')

	expect(result.status).toBe('ok')
	expect(result.tag).toBe(expected.tag)
	expect(result.data).toEqual(expected.data)
	return result
})

export const expectErrorResult = vi.defineHelper((
	result: unknown,
	expectedTag: null | string,
):
	ResultAnyError =>
{
	expect(ResultIsError(result)).toBe(true)
	if (!ResultIsError(result)) throw new Error('Expected an error result.')

	expect(result.status).toBe('error')
	expect(result.tag).toBe(expectedTag)
	return result
})
