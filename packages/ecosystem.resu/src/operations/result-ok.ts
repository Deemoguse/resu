import { Result } from '../classes/result'
import { ResultWith } from '../factories/result-create-result-with'

export type ResultOk<
	T extends Result.Tag,
	D,
> =
	[T, D] extends [unknown, unknown]
		? Result<'ok', T, D>
		: never

export const ResultOk: ResultWith<'ok'> = ResultWith('ok')
