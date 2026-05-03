import { ResultFromWith } from '../factories/result-create-result-from-with'
import type { Result } from '../models/result'

export type ResultErrorFrom<
	V,
	T extends Result.Tag,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromWith.Return<'error', V, T>
		: never

export const ResultErrorFrom: ResultFromWith<'error'> = ResultFromWith('error')
