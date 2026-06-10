import { describe, expect, it } from 'vitest'
import { ResultError } from '../../src/operations/result-error'
import { ResultErrorFrom } from '../../src/operations/result-error-from'
import { ResultErrorFromUnlessOk } from '../../src/operations/result-error-from-unless-ok'
import { ResultIs } from '../../src/operations/result-is'
import { ResultIsError } from '../../src/operations/result-is-error'
import { ResultIsOk } from '../../src/operations/result-is-ok'
import { ResultOk } from '../../src/operations/result-ok'
import { ResultOkFrom } from '../../src/operations/result-ok-from'
import { ResultOkFromUnlessError } from '../../src/operations/result-ok-from-unless-error'
import { expectErrorResult, expectOkResult } from './helpers/result-assertions'

describe('result constructors', () => {
	it('creates ok and error results with optional payload', () => {
		expectOkResult(ResultOk(), { tag: null, data: null })
		expectErrorResult(ResultError({ tag: 'Failure', data: 42 }), 'Failure')
		expect(ResultError({ tag: 'Failure', data: 42 }).data).toBe(42)
	})
})

describe('result from value helpers', () => {
	it('creates a new ok result from a plain value', () => {
		expectOkResult(ResultOkFrom('ready'), { tag: null, data: 'ready' })
		expectOkResult(ResultOkFrom('ready', 'State'), { tag: 'State', data: 'ready' })
	})

	it('creates a new result from an existing result and preserves payload', () => {
		const source = ResultError({ tag: 'Failure', data: new Error('boom') })
		const next = ResultOkFrom(source)

		expect(next).not.toBe(source)
		expectOkResult(next, { tag: 'Failure', data: source.data })
	})

	it('overrides the tag when creating a result from another result', () => {
		const source = ResultOk({ tag: 'Old', data: 5 })
		expectErrorResult(ResultErrorFrom(source, 'New'), 'New')
		expect(ResultErrorFrom(source, 'New').data).toBe(5)
	})
})

describe('result from unless helpers', () => {
	it('keeps the opposite status and tag unchanged', () => {
		const failure = ResultError({ tag: 'Failure', data: 'broken' })
		const success = ResultOk({ tag: 'Success', data: 7 })

		const okFromFailure = ResultOkFromUnlessError(failure, 'Ignored')
		const errorFromSuccess = ResultErrorFromUnlessOk(success, 'Ignored')

		expect(okFromFailure).not.toBe(failure)
		expect(errorFromSuccess).not.toBe(success)
		expectErrorResult(okFromFailure, 'Failure')
		expect(okFromFailure.data).toBe('broken')
		expectOkResult(errorFromSuccess, { tag: 'Success', data: 7 })
	})

	it('creates a result with the requested status when the input status matches or is not a result', () => {
		expectOkResult(ResultOkFromUnlessError('value', 'Tag'), { tag: 'Tag', data: 'value' })

		const source = ResultOk({ tag: 'Source', data: 1 })
		const next = ResultOkFromUnlessError(source, 'Next')
		expectOkResult(next, { tag: 'Next', data: 1 })
		expect(next).not.toBe(source)
	})
})

describe('result guards', () => {
	it('detects result instances and narrows by status', () => {
		const success = ResultOk({ tag: 'Ready', data: 1 })
		const failure = ResultError({ tag: 'Failure', data: 2 })
		const lookalike = { status: 'ok', tag: 'Ready', data: 1 }

		expect(ResultIs(success)).toBe(true)
		expect(ResultIs(failure)).toBe(true)
		expect(ResultIs(lookalike)).toBe(false)
		expect(ResultIsOk(success)).toBe(true)
		expect(ResultIsOk(failure)).toBe(false)
		expect(ResultIsError(success)).toBe(false)
		expect(ResultIsError(failure)).toBe(true)
	})
})
