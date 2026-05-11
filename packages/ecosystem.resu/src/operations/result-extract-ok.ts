import type { Result } from '../classes/result'
import type { ResultExtract } from './result-extract'

export type ResultExtractOk<
	V,
	T extends Result.Tag = never,
> =
	[V, T] extends [unknown, unknown]
		? ResultExtract<V, 'ok', T>
		: never
