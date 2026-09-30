import { describe, expect, it } from 'vitest'
import { FlowFunctionAsync } from '../../src/operations/flow-function-async'
import { FlowFunctionSync } from '../../src/operations/flow-function-sync'
import { ResultError } from '../../src/operations/result-error'
import { expectErrorResult, expectOkResult } from './helpers/result-assertions'

describe('FlowFunctionSync', () => {
	it('preserves arguments and wraps the return value into ResultOk', () => {
		const wrapped = FlowFunctionSync((left: number, right: number) => left + right)
		expectOkResult(wrapped(2, 3), { tag: null, data: 5 })
	})

	it('converts thrown exceptions to RuntimeError results', () => {
		const error = new Error('boom')
		const wrapped = FlowFunctionSync(() => { throw error })

		expect(expectErrorResult(wrapped(), 'RuntimeError').data).toBe(error)
	})

	it('clones a returned result instance', () => {
		const source = ResultError({ tag: 'Failure', data: 'broken' })
		const wrapped = FlowFunctionSync(() => source)
		const result = wrapped()

		expect(result).not.toBe(source)
		expectErrorResult(result, 'Failure')
		expect(result.data).toBe('broken')
	})
})

describe('FlowFunctionAsync', () => {
	it('wraps sync and async functions and always returns Promise<Result>', async () => {
		const fromSync = FlowFunctionAsync((value: number) => value + 1)
		const fromAsync = FlowFunctionAsync(async (value: number) => value + 2)

		expect(fromSync(1)).toBeInstanceOf(Promise)
		expect(fromAsync(1)).toBeInstanceOf(Promise)
		expectOkResult(await fromSync(1), { tag: null, data: 2 })
		expectOkResult(await fromAsync(1), { tag: null, data: 3 })
	})

	it('converts thrown and rejected errors to RuntimeError results', async () => {
		const thrown = new Error('thrown')
		const rejected = new Error('rejected')

		const throwsSync = FlowFunctionAsync(() => { throw thrown })
		const rejectsAsync = FlowFunctionAsync(async () => Promise.reject(rejected))

		expect(expectErrorResult(await throwsSync(), 'RuntimeError').data).toBe(thrown)
		expect(expectErrorResult(await rejectsAsync(), 'RuntimeError').data).toBe(rejected)
	})
})
