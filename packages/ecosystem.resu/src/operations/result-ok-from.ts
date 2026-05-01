import { ResultFromWith } from '../factories/result-create-result-from-with'
import type { Result } from '../models/result'

export type ResultOkFrom<
	V,
	T extends Result.Tag,
> =
	ResultFromWith.Return<'ok', V, T>

export const ResultOkFrom: ResultFromWith<'ok'> = ResultFromWith('ok')
