import { expectError, expectType } from 'tsd'
import { FlowFunctionSync } from '../../src/operations/flow-function-sync'
import { FlowFunctionAsync } from '../../src/operations/flow-function-async'
import { ResultErrorFrom } from '../../src/operations/result-error-from'
import { ResultOkFrom } from '../../src/operations/result-ok-from'
import type { FlowTrySync } from '../../src/operations/flow-try-sync'
import type { FlowTryAsync } from '../../src/operations/flow-try-async'

type TextInput = string
type CountInput = number
type SuccessValue = number
type FailureText = string

type SyncTextCounter = (input: TextInput, count: CountInput) => FlowTrySync<SuccessValue>
type AsyncTextReader = (input: TextInput) => FlowTryAsync<SuccessValue>
type SyncSuccessFunction = () => FlowTrySync<SuccessValue>
type AsyncSuccessFunction = () => FlowTryAsync<SuccessValue>
type SyncFailureFunction = () => FlowTrySync<ResultErrorFrom<FailureText>>
type AsyncFailureFunction = () => FlowTryAsync<ResultErrorFrom<FailureText>>

// Basic inference
{
	const syncWrapped = FlowFunctionSync((input: TextInput, count: CountInput): SuccessValue => input.length + count)
	const asyncWrapped = FlowFunctionAsync(async (input: TextInput): Promise<SuccessValue> => input.length)
	const asyncFromSyncWrapped = FlowFunctionAsync((input: TextInput): SuccessValue => input.length)

	expectType<SyncTextCounter>(syncWrapped)
	expectType<AsyncTextReader>(asyncWrapped)
	expectType<AsyncTextReader>(asyncFromSyncWrapped)
}

// Raw values are wrapped as ok results
{
	const syncRaw = FlowFunctionSync((): SuccessValue => 32)
	const asyncRaw = FlowFunctionAsync(async (): Promise<SuccessValue> => 32)

	expectType<SyncSuccessFunction>(syncRaw)
	expectType<AsyncSuccessFunction>(asyncRaw)
}

// Existing ResultOk values stay flat
{
	const syncOk = FlowFunctionSync(() => ResultOkFrom(32 as SuccessValue))
	const asyncOk = FlowFunctionAsync(async () => ResultOkFrom(32 as SuccessValue))

	expectType<SyncSuccessFunction>(syncOk)
	expectType<AsyncSuccessFunction>(asyncOk)
}

// Existing ResultError values stay on the error branch
{
	const syncError = FlowFunctionSync(() => ResultErrorFrom('str' as FailureText))
	const asyncError = FlowFunctionAsync(async () => ResultErrorFrom('str' as FailureText))

	expectType<SyncFailureFunction>(syncError)
	expectType<AsyncFailureFunction>(asyncError)
	expectError(FlowFunctionSync<ResultErrorFrom<FailureText>, []>(() => 'str' as FailureText))
	expectError(FlowFunctionAsync<ResultErrorFrom<FailureText>, []>(async () => 'str' as FailureText))
}

// Undefined returns are rejected
{
	expectError(FlowFunctionSync(() => undefined))
	expectError(FlowFunctionAsync(async () => undefined))
}
