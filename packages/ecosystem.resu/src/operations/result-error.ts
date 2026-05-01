import { Result } from '../models/result'
import { ResultWith } from '../factories/result-create-result-with'

export type ResultError<
	T extends Result.Tag,
	D extends Result.Data,
> =
	Result<'error', T, D>

export const ResultError: ResultWith<'error'> = ResultWith('error')
