import { expectError, expectType } from 'tsd'
import { Flow, Result, Utils } from '../../src/namespaces/index'

// Callback and object forms infer the same result in both execution modes.
{
	expectType<Flow.Try.Sync<number>>(Flow.Try.Sync((): number => 1))
	expectType<Flow.Try.Sync<number>>(Flow.Try.Sync({ try: (): number => 1 }))
	expectType<Flow.Try.Async<number>>(Flow.Try.Async((): number => 1))
	expectType<Flow.Try.Async<number>>(Flow.Try.Async(async (): Promise<number> => 1))
	expectType<Flow.Try.Sync<Result.Error<'Failure', number>>>(Flow.Try.Sync(() => Result.Error({ tag: 'Failure', data: 1 as number })))
	expectType<Flow.Try.Async<Result.Error<'Failure', number>>>(Flow.Try.Async(async () => Result.Error({ tag: 'Failure', data: 1 as number })))
}

// Sources may be raw values or untagged successes; explicit errors stay errors.
{
	type Failure = Result.ErrorFrom<string>
	const recover = (): Failure => Result.ErrorFrom('broken' as string)
	expectType<Flow.Try.Sync<number, Failure>>(Flow.Try.Sync<number, Failure>({ try: () => 32, catch: recover }))
	expectType<Flow.Try.Sync<number, Failure>>(Flow.Try.Sync<number, Failure>({ try: () => Result.OkFrom(32), catch: recover }))
	expectType<Flow.Try.Sync<number, Failure>>(Flow.Try.Sync<Result.OkFrom<number>, Failure>({ try: () => 32, catch: recover }))
	expectType<Flow.Try.Async<number, Failure>>(Flow.Try.Async<Result.OkFrom<number>, Failure>({ try: async () => 32, catch: async () => recover() }))
	expectType<Flow.Try.Async<number, Failure>>(Flow.Try.Async<number, Failure>({ try: async () => Result.OkFrom(32), catch: recover }))
	expectError(Flow.Try.Sync<number, Failure>({ try: () => 1, catch: () => 'broken' }))
	expectError(Flow.Try.Async<number, Failure>({ try: async () => 1, catch: () => 'broken' }))
}

// Recovery can also produce a success. Async recovery receives an unknown error.
{
	expectType<Flow.Try.Sync<number, string>>(Flow.Try.Sync({ try: (): number => 1, catch: (): string => 'recovered' }))
	expectType<Flow.Try.Async<number, string>>(Flow.Try.Async({
		try: async (): Promise<number> => 1,
		catch: async (error): Promise<string> => {
			expectType<unknown>(error)
			return 'recovered'
		},
	}))
}

// Cancellation adds AbortError and supplies the exact signal type to the callback.
{
	const result = Flow.Try.Async({
		signal: new AbortController().signal,
		try: (signal): number => {
			expectType<AbortSignal>(signal)
			return 1
		},
	})
	expectType<Promise<Utils.RuntimeError | Utils.AbortError | Result.Ok<null, number>>>(result)
	expectError(Flow.Try.Async({ signal: 'invalid', try: () => 1 }))
}

// Undefined, void, and promises in sync sources are rejected.
{
	expectError(Flow.Try.Sync(() => undefined))
	expectError(Flow.Try.Sync(() => {}))
	expectError(Flow.Try.Sync(async () => 1))
	expectError(Flow.Try.Async(async () => undefined))
	expectError(Flow.Try.Async(() => {}))
	expectError(Flow.Try.Sync({ try: () => 1, catch: () => undefined }))
	expectError(Flow.Try.Async({ try: () => 1, catch: async () => undefined }))
}
