import { expectError, expectType } from 'tsd'
import { ResultErrorFrom } from '../../src/operations/result-error-from'
import { ResultOkFrom } from '../../src/operations/result-ok-from'
import { FlowTrySync } from '../../src/operations/flow-try-sync'
import { FlowTryAsync } from '../../src/operations/flow-try-async'
import type { UtilsErrorAbort } from '../../src/utils/utils-error-abort'
import type { UtilsErrorRuntime } from '../../src/utils/utils-error-runtime'
import type { FailureResult, OkResult } from './_shared'

const signal = new AbortController().signal
const failureTag = 'Failure' as const

type SuccessValue = number
type FailureText = string
type CatchFailure = ResultErrorFrom<FailureText>
type TaggedFailure = FailureResult<SuccessValue>

type SyncSuccess = FlowTrySync<SuccessValue>
type AsyncSuccess = FlowTryAsync<SuccessValue>
type SyncWithCatch = FlowTrySync<SuccessValue, CatchFailure>
type AsyncWithCatch = FlowTryAsync<SuccessValue, CatchFailure>
type TaggedFailureResult = UtilsErrorRuntime | TaggedFailure
type AbortableAsyncSuccess = Promise<UtilsErrorRuntime | UtilsErrorAbort | OkResult<SuccessValue>>

const catchFailure = (): CatchFailure => ResultErrorFrom('str' as FailureText)

// Basic inference
{
	const syncRaw = FlowTrySync((): SuccessValue => 1)
	const syncError = FlowTrySync(() => ResultErrorFrom(1 as SuccessValue, failureTag))
	const asyncWithoutPromise = FlowTryAsync((): SuccessValue => 1)
	const asyncWithPromise = FlowTryAsync(async (): Promise<SuccessValue> => 1)
	const abortableAsync = FlowTryAsync({
		signal,
		try: (currentSignal): SuccessValue => currentSignal.aborted ? 0 : 1,
	})

	expectType<SyncSuccess>(syncRaw)
	expectType<TaggedFailureResult>(syncError)
	expectType<AsyncSuccess>(asyncWithoutPromise)
	expectType<AsyncSuccess>(asyncWithPromise)
	expectType<AbortableAsyncSuccess>(abortableAsync)
}

// Raw try values and wrapped ResultOk values share the same public result
{
	const syncRaw = FlowTrySync<SuccessValue, CatchFailure>({
		try: (): SuccessValue => 32,
		catch: catchFailure,
	})
	const asyncRaw = FlowTryAsync<SuccessValue, CatchFailure>({
		try: async (): Promise<SuccessValue> => 32,
		catch: async (): Promise<CatchFailure> => catchFailure(),
	})
	const syncOk = FlowTrySync<SuccessValue, CatchFailure>({
		try: () => ResultOkFrom(32 as SuccessValue),
		catch: catchFailure,
	})
	const asyncOk = FlowTryAsync<SuccessValue, CatchFailure>({
		try: async () => ResultOkFrom(32 as SuccessValue),
		catch: async (): Promise<CatchFailure> => catchFailure(),
	})

	expectType<SyncWithCatch>(syncRaw)
	expectType<AsyncWithCatch>(asyncRaw)
	expectType<SyncWithCatch>(syncOk)
	expectType<AsyncWithCatch>(asyncOk)
}

// ResultOk sources stay flat when declared as the try value
{
	const syncRawSource = FlowTrySync<ResultOkFrom<SuccessValue>, CatchFailure>({
		try: (): SuccessValue => 32,
		catch: catchFailure,
	})
	const asyncRawSource = FlowTryAsync<ResultOkFrom<SuccessValue>, CatchFailure>({
		try: async (): Promise<SuccessValue> => 32,
		catch: async (): Promise<CatchFailure> => catchFailure(),
	})
	const syncOkSource = FlowTrySync<ResultOkFrom<SuccessValue>, CatchFailure>({
		try: () => ResultOkFrom(32 as SuccessValue),
		catch: catchFailure,
	})
	const asyncOkSource = FlowTryAsync<ResultOkFrom<SuccessValue>, CatchFailure>({
		try: async () => ResultOkFrom(32 as SuccessValue),
		catch: async (): Promise<CatchFailure> => catchFailure(),
	})

	expectType<SyncWithCatch>(syncRawSource)
	expectType<AsyncWithCatch>(asyncRawSource)
	expectType<SyncWithCatch>(syncOkSource)
	expectType<AsyncWithCatch>(asyncOkSource)
}

// Catch values must already be ResultError values
{
	const syncCaught = FlowTrySync<SuccessValue, CatchFailure>({
		try: (): SuccessValue => 32,
		catch: catchFailure,
	})
	const asyncCaught = FlowTryAsync<SuccessValue, CatchFailure>({
		try: async (): Promise<SuccessValue> => 32,
		catch: async (): Promise<CatchFailure> => catchFailure(),
	})

	expectType<SyncWithCatch>(syncCaught)
	expectType<AsyncWithCatch>(asyncCaught)
	expectError(FlowTrySync<SuccessValue, CatchFailure>({
		try: (): SuccessValue => 32,
		catch: (): FailureText => 'str',
	}))
	expectError(FlowTryAsync<SuccessValue, CatchFailure>({
		try: async (): Promise<SuccessValue> => 32,
		catch: async (): Promise<FailureText> => 'str',
	}))
}

// Undefined returns are rejected
{
	expectError(FlowTrySync(() => undefined))
	expectError(FlowTryAsync(async () => undefined))
}
