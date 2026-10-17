import { expect, vi } from 'vitest'
import { ResultIs } from '../../../src/operations/result-is'
import { ResultIsError } from '../../../src/operations/result-is-error'
import { ResultIsOk } from '../../../src/operations/result-is-ok'
import type { ResultAny } from '../../../src/operations/result-any'
import type { ResultAnyError } from '../../../src/operations/result-any-error'
import type { ResultAnyOk } from '../../../src/operations/result-any-ok'

export const expectResult = vi.defineHelper((
	result: unknown,
	expected: { status: 'ok' | 'error', tag: string | null, data: unknown },
): ResultAny => {
	expect(ResultIs(result), 'expected a Result instance').toBe(true)
	const actual = result as ResultAny
	expect({ status: actual.status, tag: actual.tag, data: actual.data }).toEqual(expected)
	return result as ResultAny
})

export const expectOkResult = vi.defineHelper((
	result: unknown,
	expected: { tag: string | null, data: unknown },
): ResultAnyOk => {
	expect(ResultIsOk(result), 'expected an ok Result').toBe(true)
	const actual = result as ResultAnyOk
	expect({ status: actual.status, tag: actual.tag, data: actual.data }).toEqual({ status: 'ok', ...expected })
	return result as ResultAnyOk
})

export const expectErrorResult = vi.defineHelper((
	result: unknown,
	expectedTag: string | null,
): ResultAnyError => {
	expect(ResultIsError(result), 'expected an error Result').toBe(true)
	expect(result).toMatchObject({ status: 'error', tag: expectedTag })
	return result as ResultAnyError
})
