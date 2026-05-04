import { ResultFromWith } from '../factories/result-create-result-from-with'
import type { Result } from '../models/result'

export type ResultOkFrom<
	V,
	T extends Result.Tag,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromWith.Return<'ok', V, T>
		: never

export const ResultOkFrom: ResultFromWith<'ok'> = ResultFromWith('ok')
