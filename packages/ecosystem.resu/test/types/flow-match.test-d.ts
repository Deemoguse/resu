import { expectError, expectType } from 'tsd'
import { ResultOk } from '../../src/operations/result-ok'
import { ResultError } from '../../src/operations/result-error'
import { ResultErrorFrom } from '../../src/operations/result-error-from'
import { ResultOkFrom } from '../../src/operations/result-ok-from'
import { FlowMatchStrict } from '../../src/operations/flow-match-strict'
import { FlowMatchLoose } from '../../src/operations/flow-match-loose'
import type { FlowTrySync } from '../../src/operations/flow-try-sync'
import type { FailureResult, OkResult, ReadyResult } from './_shared'

type ReadyValue = number
type FailureText = string
type ReadyInput = ReadyResult<ReadyValue>
type FailureInput = FailureResult<FailureText>
type Input = ReadyInput | FailureInput

type ReadyTextResult = ResultOkFrom<string>
type FailureLengthResult = ResultOkFrom<number>
type StatusResult = OkResult<'ok'> | OkResult<'error'>
type NumberResult = ResultOkFrom<number>
type HandlerFailure = ResultErrorFrom<FailureText>

type ReadyHandledMatch = FlowMatchLoose<ReadyTextResult, FailureInput>
type ReadyHandledTry = FlowTrySync<ReadyTextResult | FailureInput>
type FullyHandledMatch = FlowMatchLoose<ReadyTextResult | FailureLengthResult, never>
type FullyHandledTry = FlowTrySync<ReadyTextResult | FailureLengthResult>
type StrictStatusMatch = FlowMatchStrict<StatusResult, never>
type StrictStatusTry = FlowTrySync<StatusResult>
type LooseNumberMatch = FlowMatchLoose<NumberResult, FailureInput>
type LooseNumberTry = FlowTrySync<NumberResult | FailureInput>
type StrictNumberMatch = FlowMatchStrict<NumberResult, never>
type StrictNumberTry = FlowTrySync<NumberResult>
type LooseFailureMatch = FlowMatchLoose<HandlerFailure, ReadyInput>
type StrictFailureMatch = FlowMatchStrict<HandlerFailure, ReadyInput>
type FailureHandlerTry = FlowTrySync<HandlerFailure | ReadyInput>

const input = Math.random() > 0.5
	? ResultOk({ tag: 'Ready', data: 1 as ReadyValue })
	: ResultError({ tag: 'Failure', data: 'broken' as FailureText })

const readyTags: ['Ready'] = ['Ready']
const failureTags: ['Failure'] = ['Failure']

// Basic inference
{
	const handledReady = FlowMatchLoose<never, Input>(input).ok(readyTags, (result) => {
		expectType<ReadyInput>(result)
		return result.data.toString()
	})
	const fullyHandled = handledReady.error(failureTags, (result) => {
		expectType<FailureInput>(result)
		return result.data.length
	})
	const handledAny = FlowMatchStrict<never, Input>(input).any((result) => result.status)

	expectType<ReadyHandledMatch>(handledReady)
	expectType<ReadyHandledTry>(handledReady.result())
	expectError(handledReady.ok(readyTags, () => 'again'))
	expectError(FlowMatchLoose<never, Input>(input).ok(readyTags, () => undefined))

	expectType<FullyHandledMatch>(fullyHandled)
	expectType<FullyHandledTry>(fullyHandled.result())
	expectError(fullyHandled.error(failureTags, () => 1))

	expectType<StrictStatusMatch>(handledAny)
	expectType<StrictStatusTry>(handledAny.result())
	expectError(handledAny.any(() => 'again'))
	expectError(FlowMatchStrict<never, Input>(input).any(() => undefined))
}

// Loose handlers wrap raw values and keep ResultOk values flat
{
	const rawValue = FlowMatchLoose<never, Input>(input).ok<'Ready', ReadyValue>(readyTags,(): ReadyValue => 32)
	const rawResultSource = FlowMatchLoose<never, Input>(input).ok<'Ready', ResultOkFrom<ReadyValue>>(readyTags,(): ReadyValue => 32)
	const okResultSource = FlowMatchLoose<never, Input>(input).ok<'Ready', ResultOkFrom<ReadyValue>>(readyTags,() => ResultOkFrom(32 as ReadyValue))

	expectType<LooseNumberMatch>(rawValue)
	expectType<LooseNumberTry>(rawValue.result())
	expectType<LooseNumberMatch>(rawResultSource)
	expectType<LooseNumberTry>(rawResultSource.result())
	expectType<LooseNumberMatch>(okResultSource)
	expectType<LooseNumberTry>(okResultSource.result())
}

// Strict handlers wrap raw values and keep ResultOk values flat
{
	const rawValue = FlowMatchStrict<never, Input>(input).any<ReadyValue>((): ReadyValue => 32)
	const rawResultSource = FlowMatchStrict<never, Input>(input).any<ResultOkFrom<ReadyValue>>((): ReadyValue => 32)
	const okResultSource = FlowMatchStrict<never, Input>(input).any<ResultOkFrom<ReadyValue>>(() => ResultOkFrom(32 as ReadyValue))

	expectType<StrictNumberMatch>(rawValue)
	expectType<StrictNumberTry>(rawValue.result())
	expectType<StrictNumberMatch>(rawResultSource)
	expectType<StrictNumberTry>(rawResultSource.result())
	expectType<StrictNumberMatch>(okResultSource)
	expectType<StrictNumberTry>(okResultSource.result())
}

// Existing ResultError values stay on the error branch
{
	const looseError = FlowMatchLoose<never, Input>(input).error<'Failure', HandlerFailure>(failureTags, () => ResultErrorFrom('str' as FailureText))
	const strictError = FlowMatchStrict<never, Input>(input).error<'Failure', HandlerFailure>(failureTags, () => ResultErrorFrom('str' as FailureText))

	expectType<LooseFailureMatch>(looseError)
	expectType<StrictFailureMatch>(strictError)
	expectType<FailureHandlerTry>(looseError.result())
	expectType<FailureHandlerTry>(strictError.result())
	expectError(FlowMatchLoose<never, Input>(input).error<'Failure', HandlerFailure>(failureTags, () => 'str'))
	expectError(FlowMatchStrict<never, Input>(input).error<'Failure', HandlerFailure>(failureTags, () => 'str'))
}
