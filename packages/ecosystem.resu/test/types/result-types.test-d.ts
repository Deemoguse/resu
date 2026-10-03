import { expectAssignable, expectError, expectNotAssignable, expectType } from 'tsd'
import { Result } from '../../src/namespaces/index'
import type { ResultExclude } from '../../src/operations/result-exclude'
import type { ResultExcludeOk } from '../../src/operations/result-exclude-ok'
import type { ResultExcludeError } from '../../src/operations/result-exclude-error'
import type { ResultExtract } from '../../src/operations/result-extract'
import type { ResultExtractOk } from '../../src/operations/result-extract-ok'
import type { ResultExtractError } from '../../src/operations/result-extract-error'
import type { Result as ResultClass } from '../../src/types'

type Ready = Result.Ok<'Ready', number>
type Other = Result.Ok<null, boolean>
type Failure = Result.Error<'Failure', Error>
type UntaggedError = Result.Error<null, string>
type Input = Ready | Other | Failure | UntaggedError
declare const input: Input
declare const unknownValue: unknown
const ok = Result.Ok({ tag: 'Ready', data: 1 as number })
const error = Result.Error({ tag: 'Failure', data: new Error('broken') })

// Constructors infer default fields, literal tags, and payload types.
{
	expectType<Ready>(ok)
	expectType<Failure>(error)
	expectType<Result.Ok<null, null>>(Result.Ok())
	expectType<Result.Error<null, null>>(Result.Error())
	expectType<Result.Ok<'Ready', null>>(Result.Ok({ tag: 'Ready' }))
	expectType<Result.Error<null, number>>(Result.Error({ data: 1 as number }))
	expectType<Result.Ok<'', false>>(Result.Ok({ tag: '', data: false as const }))
	expectType<ResultClass<{ status: 'ok', tag: 'Ready', data: number }>>(ok)
	expectError(Result.Ok({ tag: 1 }))
	expectError(Result.Error({ emit: 'yes' }))
}

// Conversions preserve payloads and apply only the requested tag override.
{
	expectType<Result.Ok<'Failure', Error>>(Result.OkFrom(error))
	expectType<Result.Error<'Ready', number>>(Result.ErrorFrom(ok))
	expectType<Result.Ok<null, Error>>(Result.OkFrom(error, null))
	expectType<Result.Error<'Override', number>>(Result.ErrorFrom(ok, 'Override'))
	expectType<Result.Ok<null, number>>(Result.OkFrom(1 as number))
	expectType<Result.Error<'Failure', string>>(Result.ErrorFrom('broken' as string, 'Failure'))
	expectType<Failure>(Result.OkFromUnlessError(error, 'Ignored'))
	expectType<Ready>(Result.ErrorFromUnlessOk(ok, 'Ignored'))
	expectType<Result.Ok<'Override', number>>(Result.OkFromUnlessError(ok, 'Override'))
	expectType<Result.Error<'Override', Error>>(Result.ErrorFromUnlessOk(error, 'Override'))
}

// Nominal typing, readonly fields, and guards support safe branch narrowing.
{
	expectAssignable<Result.Any>(ok)
	expectAssignable<Result.Any>(error)
	expectAssignable<Result.AnyOk>(ok)
	expectAssignable<Result.AnyError>(error)
	expectNotAssignable<Result.AnyOk>(error)
	expectNotAssignable<Result.AnyError>(ok)
	expectNotAssignable<Result.Any>({ status: 'ok', tag: 'Ready', data: 1 })
	expectError(ok.data = 2)
	expectError(ok.tag = 'Other')
	expectError(ok.status = 'error')

	if (Result.Is(unknownValue)) expectType<Result.Any>(unknownValue)
	if (Result.IsOk(unknownValue)) expectType<Result.AnyOk>(unknownValue)
	if (Result.IsError(unknownValue)) expectType<Result.AnyError>(unknownValue)
	if (Result.IsOk(input)) expectType<Ready | Other>(input)
	if (Result.IsError(input)) expectType<Failure | UntaggedError>(input)
}

// Extract and Exclude handle whole statuses, tag unions, null, and absent tags.
{
	expectType<Ready | Other>({} as ResultExtract<Input, 'ok'>)
	expectType<Failure>({} as ResultExtract<Input, 'error', 'Failure'>)
	expectType<Ready>({} as ResultExtractOk<Input, 'Ready'>)
	expectType<UntaggedError>({} as ResultExtractError<Input, null>)
	expectType<Failure | UntaggedError>({} as ResultExtractError<Input, 'Failure' | null>)
	expectType<never>({} as ResultExtractOk<Input, 'Missing'>)
	expectType<never>({} as ResultExtract<never, 'ok'>)
	expectType<Ready>({} as ResultExtract<Ready | string | null, 'ok'>)

	expectType<Failure | UntaggedError>({} as ResultExclude<Input, 'ok'>)
	expectType<Other | Failure | UntaggedError>({} as ResultExcludeOk<Input, 'Ready'>)
	expectType<Ready | Other | UntaggedError>({} as ResultExcludeError<Input, 'Failure'>)
	expectType<Ready | Failure | UntaggedError>({} as ResultExcludeOk<Input, null>)
	expectType<Ready | Other>({} as ResultExcludeError<Input, 'Failure' | null>)
	expectType<Input>({} as ResultExcludeOk<Input, 'Missing'>)
	expectType<never>({} as ResultExclude<never, 'ok'>)
}

// Compile-time predicates distinguish result containers from raw values.
{
	expectType<true>({} as Result.Is<Ready>)
	expectType<false>({} as Result.Is<number>)
	expectType<true>({} as Result.IsOk<Ready>)
	expectType<false>({} as Result.IsOk<Failure>)
	expectType<true>({} as Result.IsError<Failure>)
	expectType<false>({} as Result.IsError<Ready>)
}
