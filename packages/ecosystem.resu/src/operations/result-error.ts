import { Result } from '../models/result'
import { ResultWith } from '../factories/result-create-result-with'

export type ResultError<
	T extends Result.Tag,
	D extends Result.Data,
> =
	[T, D] extends [unknown, unknown]
		? Result<'error', T, D>
		: never

export const ResultError: ResultWith<'error'> = ResultWith('error')
