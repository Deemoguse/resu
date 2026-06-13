import { expectAssignable, expectNotAssignable, expectType } from 'tsd'
import { ResultError } from '../../src/operations/result-error'
import { ResultErrorFrom } from '../../src/operations/result-error-from'
import { ResultErrorFromUnlessOk } from '../../src/operations/result-error-from-unless-ok'
import { ResultOk } from '../../src/operations/result-ok'
import { ResultOkFrom } from '../../src/operations/result-ok-from'
import { ResultOkFromUnlessError } from '../../src/operations/result-ok-from-unless-error'
import type { ResultAny } from '../../src/operations/result-any'
import type { ResultAnyError } from '../../src/operations/result-any-error'
import type { ResultAnyOk } from '../../src/operations/result-any-ok'
import type { ResultExclude } from '../../src/operations/result-exclude'
import type { ResultExcludeError } from '../../src/operations/result-exclude-error'
import type { ResultExcludeOk } from '../../src/operations/result-exclude-ok'
import type { ResultExtract } from '../../src/operations/result-extract'
import type { ResultExtractError } from '../../src/operations/result-extract-error'
import type { ResultExtractOk } from '../../src/operations/result-extract-ok'
import type { ResultIs } from '../../src/operations/result-is'
import type { ResultIsError } from '../../src/operations/result-is-error'
import type { ResultIsOk } from '../../src/operations/result-is-ok'
import type { ErrorResult, FailureResult, OkResult, ReadyResult } from './_shared'

const okTag = 'Ready' as const
const errorTag = 'Failure' as const
const overrideTag = 'Override' as const
const ok = ResultOk({ tag: okTag, data: 1 as number })
const error = ResultError({ tag: errorTag, data: new Error('boom') })

type ReadyNumber = ReadyResult<number>
type UntaggedBoolean = OkResult<boolean>
type FailureError = FailureResult<Error>
type UntaggedStringError = ErrorResult<string>
type Input = ReadyNumber | UntaggedBoolean | FailureError | UntaggedStringError

type CreatedOk = OkResult<null>
type CreatedError = ErrorResult<null>
type OkFromError = ResultOk<'Failure', Error>
type ErrorFromOk = ResultError<'Override', number>
type OkUnlessError = FailureResult<Error>
type ErrorUnlessOk = ReadyNumber

type ExtractedOk = ReadyNumber | UntaggedBoolean
type ExtractedFailure = FailureError
type ExtractedReady = ReadyNumber
type ExtractedUntaggedError = UntaggedStringError

type WithoutReady = UntaggedBoolean | FailureError | UntaggedStringError
type WithoutFailure = ReadyNumber | UntaggedBoolean | UntaggedStringError
type WithoutUntaggedOk = ReadyNumber | FailureError | UntaggedStringError

expectType<ReadyNumber>(ok)
expectType<FailureError>(error)
expectType<CreatedOk>(ResultOk())
expectType<CreatedError>(ResultError())

expectType<OkFromError>(ResultOkFrom(error))
expectType<ErrorFromOk>(ResultErrorFrom(ok, overrideTag))
expectType<OkUnlessError>(ResultOkFromUnlessError(error, overrideTag))
expectType<ErrorUnlessOk>(ResultErrorFromUnlessOk(ok, overrideTag))

expectAssignable<ResultAny>(ok)
expectAssignable<ResultAny>(error)
expectAssignable<ResultAnyOk>(ok)
expectAssignable<ResultAnyError>(error)
expectNotAssignable<ResultAnyOk>(error)
expectNotAssignable<ResultAnyError>(ok)

expectType<ExtractedOk>({} as ResultExtract<Input, 'ok'>)
expectType<ExtractedFailure>({} as ResultExtract<Input, 'error', 'Failure'>)
expectType<ExtractedReady>({} as ResultExtractOk<Input, 'Ready'>)
expectType<ExtractedUntaggedError>({} as ResultExtractError<Input, null>)

expectType<WithoutReady>({} as ResultExclude<Input, 'ok', 'Ready'>)
expectType<WithoutFailure>({} as ResultExcludeError<Input, 'Failure'>)
expectType<WithoutUntaggedOk>({} as ResultExcludeOk<Input, null>)

expectType<true>({} as ResultIs<ReadyNumber>)
expectType<false>({} as ResultIs<number>)
expectType<true>({} as ResultIsOk<ReadyNumber>)
expectType<false>({} as ResultIsOk<FailureResult<number>>)
expectType<true>({} as ResultIsError<FailureResult<number>>)
expectType<false>({} as ResultIsError<ReadyNumber>)
