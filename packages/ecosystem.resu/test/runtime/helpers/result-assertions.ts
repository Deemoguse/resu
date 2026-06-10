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

function assertErrorString(expected: string, received: unknown): string {
	const prefix = `Expected an ${expected}. Received: `
	const suffix = typeof received === 'string'? `"${received}"`: JSON.stringify(received)
	return prefix + suffix
}

export const expectOkResult = vi.defineHelper(<T>(
	result: unknown,
	expected: { tag: null | string, data: T },
):
	ResultAnyOk =>
{
	const isOkResult = ResultIsOk(result)
	if (!isOkResult) throw new Error(assertErrorString('ok result', result))

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
	const isErrorResult = ResultIsError(result)
	if (!isErrorResult) throw new Error(assertErrorString('error result', result))

	expect(result.status).toBe('error')
	expect(result.tag).toBe(expectedTag)
	return result
})
