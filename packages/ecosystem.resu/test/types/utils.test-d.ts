import { expectAssignable, expectError, expectNotAssignable, expectType } from 'tsd'
import { Flow, Result, Utils } from '../../src/namespaces/index'

// Non-empty arrays and concrete, non-undefined values.
{
	expectAssignable<Utils.NonAmptyArray<string>>(['first'])
	expectAssignable<Utils.NonAmptyArray<string>>(['first', 'second'])
	expectNotAssignable<Utils.NonAmptyArray<string>>([])
	expectNotAssignable<Utils.NonAmptyArray<string>>(['first', 1])
	expectType<number>({} as Utils.NonUndefined<number | undefined>)
	expectType<null>(null as Utils.NonUndefined<null | undefined>)
	expectType<never>({} as Utils.NonUndefined<undefined>)
	expectType<unknown>({} as Utils.NonUndefined<unknown>)
}

// A plain or untagged success source may be raw; tagged results remain containers.
{
	expectAssignable<Utils.Source<number>>(1)
	expectAssignable<Utils.Source<number>>(Result.OkFrom(1))
	expectAssignable<Utils.Source<Result.OkFrom<number>>>(1)
	expectAssignable<Utils.Source<Result.OkFrom<number>>>(Result.OkFrom(1))
	expectAssignable<Utils.Source<Result.ErrorFrom<string>>>(Result.ErrorFrom('broken'))
	expectNotAssignable<Utils.Source<Result.ErrorFrom<string>>>('broken')
	expectNotAssignable<Utils.Source<Result.Ok<'Ready', number>>>(1)
	expectType<never>({} as Utils.NonUndefinedSource<Promise<number>>)
	expectType<never>({} as Utils.NonUndefinedSource<undefined>)
}

// Checked normalization includes runtime errors and preserves explicit errors.
{
	expectType<Utils.RuntimeError | Result.OkFrom<number>>({} as Flow.Checked<number>)
	expectType<Utils.RuntimeError | Result.Error<'Failure', string>>({} as Flow.Checked<Result.Error<'Failure', string>>)
}

// Error constructors infer payloads; string messages become Error objects.
{
	expectType<Utils.RuntimeError<null>>(Utils.RuntimeError())
	expectType<Utils.RuntimeError<Error>>(Utils.RuntimeError('message'))
	expectType<Utils.AbortError<Error>>(Utils.AbortError('message'))
	expectType<Utils.AbortError<number>>(Utils.AbortError(1 as number))
	expectType<Utils.RuntimeError<number>>(Utils.RuntimeError(Result.OkFrom(1 as number)))
	expectError(Utils.RuntimeError<number>('message'))
}
