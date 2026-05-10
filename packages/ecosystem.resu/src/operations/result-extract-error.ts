import type { Result } from '../classes/result'
import type { ResultAny } from './result-any'
import type { ResultExtract } from './result-extract'

export type ResultExtractError<
	R extends ResultAny,
	T extends Result.Tag = never,
> =
	[R, T] extends [unknown, unknown]
		? ResultExtract<R, 'error', T>
		: never
