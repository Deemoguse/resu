import { describe, expect, it } from 'vitest'
import { Flow, Result, Runtime, Utils } from '../../src/namespaces/index'
import { ResultOk } from '../../src/operations/result-ok'
import { ResultError } from '../../src/operations/result-error'
import { ResultOkFrom } from '../../src/operations/result-ok-from'
import { ResultErrorFrom } from '../../src/operations/result-error-from'
import { ResultOkFromUnlessError } from '../../src/operations/result-ok-from-unless-error'
import { ResultErrorFromUnlessOk } from '../../src/operations/result-error-from-unless-ok'
import { ResultIs } from '../../src/operations/result-is'
import { ResultIsOk } from '../../src/operations/result-is-ok'
import { ResultIsError } from '../../src/operations/result-is-error'
import { ResultEmitterSubscribe } from '../../src/operations/result-emitter-subscribe'
import { ResultEmitterUnsubscribe } from '../../src/operations/result-emitter-unsubscribe'
import { FlowTrySync } from '../../src/operations/flow-try-sync'
import { FlowTryAsync } from '../../src/operations/flow-try-async'
import { FlowFunctionSync } from '../../src/operations/flow-function-sync'
import { FlowFunctionAsync } from '../../src/operations/flow-function-async'
import { FlowMatchLoose } from '../../src/operations/flow-match-loose'
import { FlowMatchStrict } from '../../src/operations/flow-match-strict'
import { RuntimeGenSync } from '../../src/operations/runtime-gen-sync'
import { RuntimeGenAsync } from '../../src/operations/runtime-gen-async'
import { RuntimeUnwrapSync } from '../../src/operations/runtime-unwrap-sync'
import { RuntimeUnwrapAsync } from '../../src/operations/runtime-unwrap-async'
import { RuntimeUnwrapTaggedSync } from '../../src/operations/runtime-unwrap-tagged-sync'
import { RuntimeUnwrapTaggedAsync } from '../../src/operations/runtime-unwrap-tagged-async'
import { UtilsErrorRuntime } from '../../src/utils/utils-error-runtime'
import { UtilsErrorAbort } from '../../src/utils/utils-error-abort'

describe('public namespaces', () => {
	it.each([
		{ name: 'Result.Ok', alias: Result.Ok, direct: ResultOk },
		{ name: 'Result.Error', alias: Result.Error, direct: ResultError },
		{ name: 'Result.OkFrom', alias: Result.OkFrom, direct: ResultOkFrom },
		{ name: 'Result.ErrorFrom', alias: Result.ErrorFrom, direct: ResultErrorFrom },
		{ name: 'Result.OkFromUnlessError', alias: Result.OkFromUnlessError, direct: ResultOkFromUnlessError },
		{ name: 'Result.ErrorFromUnlessOk', alias: Result.ErrorFromUnlessOk, direct: ResultErrorFromUnlessOk },
		{ name: 'Result.Is', alias: Result.Is, direct: ResultIs },
		{ name: 'Result.IsOk', alias: Result.IsOk, direct: ResultIsOk },
		{ name: 'Result.IsError', alias: Result.IsError, direct: ResultIsError },
		{ name: 'Result.Emitter.Subscribe', alias: Result.Emitter.Subscribe, direct: ResultEmitterSubscribe },
		{ name: 'Result.Emitter.Unsubscribe', alias: Result.Emitter.Unsubscribe, direct: ResultEmitterUnsubscribe },
		{ name: 'Flow.Try.Sync', alias: Flow.Try.Sync, direct: FlowTrySync },
		{ name: 'Flow.Try.Async', alias: Flow.Try.Async, direct: FlowTryAsync },
		{ name: 'Flow.Function.Sync', alias: Flow.Function.Sync, direct: FlowFunctionSync },
		{ name: 'Flow.Function.Async', alias: Flow.Function.Async, direct: FlowFunctionAsync },
		{ name: 'Flow.Match.Loose', alias: Flow.Match.Loose, direct: FlowMatchLoose },
		{ name: 'Flow.Match.Strict', alias: Flow.Match.Strict, direct: FlowMatchStrict },
		{ name: 'Runtime.Gen.Sync', alias: Runtime.Gen.Sync, direct: RuntimeGenSync },
		{ name: 'Runtime.Gen.Async', alias: Runtime.Gen.Async, direct: RuntimeGenAsync },
		{ name: 'Runtime.Unwrap.Sync', alias: Runtime.Unwrap.Sync, direct: RuntimeUnwrapSync },
		{ name: 'Runtime.Unwrap.Async', alias: Runtime.Unwrap.Async, direct: RuntimeUnwrapAsync },
		{ name: 'Runtime.UnwrapTagged.Sync', alias: Runtime.UnwrapTagged.Sync, direct: RuntimeUnwrapTaggedSync },
		{ name: 'Runtime.UnwrapTagged.Async', alias: Runtime.UnwrapTagged.Async, direct: RuntimeUnwrapTaggedAsync },
		{ name: 'Utils.RuntimeError', alias: Utils.RuntimeError, direct: UtilsErrorRuntime },
		{ name: 'Utils.AbortError', alias: Utils.AbortError, direct: UtilsErrorAbort },
	])('$name points to the direct export', ({ alias, direct }) => {
		expect(alias).toBe(direct)
	})

	it('exposes only runtime utilities in the Utils namespace', () => {
		expect(Object.keys(Utils).sort()).toEqual(['AbortError', 'RuntimeError'])
	})

	it('groups flow operations by mode', () => {
		expect(Object.keys(Flow).sort()).toEqual(['Function', 'Match', 'Try'])
		expect(Object.keys(Flow.Try).sort()).toEqual(['Async', 'Sync'])
		expect(Object.keys(Flow.Function).sort()).toEqual(['Async', 'Sync'])
		expect(Object.keys(Flow.Match).sort()).toEqual(['Loose', 'Strict'])
	})

	it('exposes subscription operations in the Result.Emitter namespace', () => {
		expect(Object.keys(Result.Emitter).sort()).toEqual(['Subscribe', 'Unsubscribe'])
	})
})
