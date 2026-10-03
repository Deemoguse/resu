import { expectError, expectType } from 'tsd'
import { Flow, Result, Runtime } from '../../src/namespaces/index'

type Ready = Result.Ok<'Ready', number>
type Failure = Result.Error<'Failure', string>
declare const input: Ready | Failure
const ready = Result.Ok({ tag: 'Ready', data: 1 as number })

// Unwrap yields a flow result, while yield* returns only successful payloads.
{
	expectType<Generator<Flow.Try.Sync<Ready>, number>>(Runtime.Unwrap.Sync(ready))
	expectType<Generator<Flow.Try.Sync<Ready | Failure>, number>>(Runtime.Unwrap.Sync(input))
	expectType<Generator<Flow.Try.Sync<Ready>, { tag: 'Ready', data: number }>>(Runtime.UnwrapTagged.Sync(ready))
	expectType<AsyncGenerator<Flow.Try.Async<Ready>, number>>(Runtime.Unwrap.Async(ready))
	expectType<AsyncGenerator<Flow.Try.Async<Ready>, number>>(Runtime.Unwrap.Async(Promise.resolve(ready)))
	expectType<AsyncGenerator<Flow.Try.Async<Ready>, { tag: 'Ready', data: number }>>(Runtime.UnwrapTagged.Async(ready))
	expectType<Generator<Flow.Try.Sync<Result.Ok<null, number>>, { tag: null, data: number }>>(Runtime.UnwrapTagged.Sync(Result.OkFrom(1 as number)))
}

// Mappers infer the input and result; async unwrap permits async mapping.
{
	const sync = Runtime.Unwrap.Sync('text' as string, (value) => {
		expectType<string>(value)
		return Result.OkFrom(value.length)
	})
	expectType<Generator<Flow.Try.Sync<number>, number>>(sync)
	const async = Runtime.Unwrap.Async(Promise.resolve('text' as string), async (value) => {
		expectType<string>(value)
		return Result.OkFrom(value.length)
	})
	expectType<AsyncGenerator<Flow.Try.Async<number>, number>>(async)
}

// Generator runtimes combine early errors with the final return value.
{
	expectType<Flow.Try.Sync<number>>(Runtime.Gen.Sync(function* () { return 1 as number }))
	expectType<Flow.Try.Async<number>>(Runtime.Gen.Async(async function* () { return 1 as number }))
	expectType<Flow.Try.Sync<null>>(Runtime.Gen.Sync(function* () {}))
	expectType<Flow.Try.Async<null>>(Runtime.Gen.Async(async function* () {}))
	expectType<Flow.Try.Sync<Failure | Result.OkFrom<string>>>(Runtime.Gen.Sync(function* () {
		const value = yield* Runtime.Unwrap.Sync(input)
		expectType<number>(value)
		return value.toString()
	}))
	expectType<Flow.Try.Async<Failure | Result.OkFrom<string>>>(Runtime.Gen.Async(async function* () {
		const value = yield* Runtime.Unwrap.Async(Promise.resolve(input))
		expectType<number>(value)
		return value.toString()
	}))
	expectType<Flow.Try.Sync<Failure>>(Runtime.Gen.Sync(function* () { return Result.Error({ tag: 'Failure', data: 'broken' as string }) }))
}

// Invalid sources and incompatible generator modes fail at compile time.
{
	expectError(Runtime.Unwrap.Sync('text'))
	expectError(Runtime.Unwrap.Async(Promise.resolve('text')))
	expectError(Runtime.Unwrap.Sync(undefined))
	expectError(Runtime.Unwrap.Sync(Promise.resolve(ready)))
	expectError(Runtime.Unwrap.Sync('text', () => 1))
	expectError(Runtime.Unwrap.Async('text', async () => 1))
	expectError(Runtime.Unwrap.Sync('text', async () => ready))
	expectError(Runtime.Gen.Sync(async function* () { return 1 }))
	expectError(Runtime.Gen.Async(function* () { return 1 }))
	expectError(Runtime.Gen.Sync(() => 1))
}
