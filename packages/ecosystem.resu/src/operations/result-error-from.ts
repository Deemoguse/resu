import { ResultFromWith } from '../factories/result-create-result-from-with'
import type { Result } from '../models/result'

export type ResultErrorFrom<
	V,
	T extends Result.Tag,
> =
	ResultFromWith.Return<'error', V, T>

export const ResultErrorFrom: ResultFromWith<'error'> = ResultFromWith('error')
