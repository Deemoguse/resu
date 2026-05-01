import { Result } from '../models/result'
import { ResultWith } from '../factories/result-create-result-with'

export type ResultOk<
	T extends Result.Tag,
	D,
> =
	Result<'ok', T, D>

export const ResultOk: ResultWith<'ok'> = ResultWith('ok')
