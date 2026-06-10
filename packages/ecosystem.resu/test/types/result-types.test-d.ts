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

const okTag = 'Ready' as const
const errorTag = 'Failure' as const
const overrideTag = 'Override' as const
const ok = ResultOk({ tag: okTag, data: 1 as number })
const error = ResultError({ tag: errorTag, data: new Error('boom') })

type Input =
	| ResultOk<'Ready', number>
	| ResultOk<null, boolean>
	| ResultError<'Failure', Error>
	| ResultError<null, string>

expectType<ResultOk<'Ready', number>>(ok)
expectType<ResultError<'Failure', Error>>(error)
expectType<ResultOk<null, null>>(ResultOk())
expectType<ResultError<null, null>>(ResultError())

expectType<ResultOk<'Failure', Error>>(ResultOkFrom(error))
expectType<ResultError<'Override', number>>(ResultErrorFrom(ok, overrideTag))
expectType<ResultError<'Failure', Error>>(ResultOkFromUnlessError(error, overrideTag))
expectType<ResultOk<'Ready', number>>(ResultErrorFromUnlessOk(ok, overrideTag))

expectAssignable<ResultAny>(ok)
expectAssignable<ResultAny>(error)
expectAssignable<ResultAnyOk>(ok)
expectAssignable<ResultAnyError>(error)
expectNotAssignable<ResultAnyOk>(error)
expectNotAssignable<ResultAnyError>(ok)

expectType<ResultOk<'Ready', number> | ResultOk<null, boolean>>({} as ResultExtract<Input, 'ok'>)
expectType<ResultError<'Failure', Error>>({} as ResultExtract<Input, 'error', 'Failure'>)
expectType<ResultOk<'Ready', number>>({} as ResultExtractOk<Input, 'Ready'>)
expectType<ResultError<null, string>>({} as ResultExtractError<Input, null>)

expectType<ResultOk<null, boolean> | ResultError<'Failure', Error> | ResultError<null, string>>({} as ResultExclude<Input, 'ok', 'Ready'>)
expectType<ResultOk<'Ready', number> | ResultOk<null, boolean> | ResultError<null, string>>({} as ResultExcludeError<Input, 'Failure'>)
expectType<ResultOk<'Ready', number> | ResultError<'Failure', Error> | ResultError<null, string>>({} as ResultExcludeOk<Input, null>)

expectType<true>({} as ResultIs<ResultOk<'Ready', number>>)
expectType<false>({} as ResultIs<number>)
expectType<true>({} as ResultIsOk<ResultOk<'Ready', number>>)
expectType<false>({} as ResultIsOk<ResultError<'Failure', number>>)
expectType<true>({} as ResultIsError<ResultError<'Failure', number>>)
expectType<false>({} as ResultIsError<ResultOk<'Ready', number>>)
