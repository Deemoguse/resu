import { describe, expect, it } from 'vitest'
import { FlowMatchLoose } from '../../src/operations/flow-match-loose'
import { FlowMatchStrict } from '../../src/operations/flow-match-strict'
import { ResultError } from '../../src/operations/result-error'
import { ResultOk } from '../../src/operations/result-ok'
import { expectErrorResult, expectOkResult } from './helpers/result-assertions'

describe('FlowMatchLoose', () => {
	it('matches ok handlers by tag, including null tags', () => {
		const input = ResultOk({ data: 2 })
		const result = FlowMatchLoose(input)
			.ok([null], (current) => current.data * 2)
			.result()

		expectOkResult(result, { tag: null, data: 4 })
	})

	it('returns the original result when no handler matches', () => {
		const input = ResultError({ tag: 'Failure', data: 'broken' })
		const result = FlowMatchLoose(input)
			// @ts-expect-error
			.ok(['Success'], () => 'handled')
			.result()

		expect(result).toStrictEqual(input)
		expectErrorResult(result, 'Failure')
		expect(result.data).toBe('broken')
	})

	it('supports status-wide and any handlers', () => {
		const okInput = ResultOk({ tag: 'Ready', data: 3 })
		const errorInput = ResultError({ tag: 'Failure', data: 'broken' })

		expectOkResult(
			FlowMatchLoose(okInput).okAny((result) => result.data + 1).result(),
			{ tag: null, data: 4 },
		)
		expectOkResult(
			FlowMatchLoose(errorInput).errorAny((result) => result.data.toUpperCase()).result(),
			{ tag: null, data: 'BROKEN' },
		)
		expectOkResult(
			FlowMatchLoose(errorInput).any((result) => result.tag).result(),
			{ tag: null, data: 'Failure' },
		)
	})

	it('converts handler exceptions to RuntimeError results', () => {
		const error = new Error('handler failed')
		const result = FlowMatchLoose(ResultOk({ tag: 'Ready', data: 1 }))
			.ok(['Ready'], () => { throw error })
			.result()

		expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
	})
})

describe('FlowMatchStrict', () => {
	it('returns RuntimeError when no handler matches', () => {
		const result = FlowMatchStrict(ResultOk({ tag: 'Ready', data: 1 })).result()
		expectErrorResult(result, 'RuntimeError')
	})

	it('uses matching error handlers and returns a new immutable chain instance', () => {
		const input = ResultError({ tag: 'Failure', data: 5 })
		const base = FlowMatchStrict(input)
		const extended = base.error(['Failure'], (result) => result.data + 1)

		expect(base).not.toBe(extended)
		expectErrorResult(base.result(), 'RuntimeError')
		expectOkResult(extended.result(), { tag: null, data: 6 })
	})
})
