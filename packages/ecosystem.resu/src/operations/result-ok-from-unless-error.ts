import { ResultFromUnlessWith } from '../factories/result-create-result-from-unless-with'
import type { Result } from '../classes/result'

export type ResultOkFromUnlessError<
	V,
	T extends Result.Tag = never,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromUnlessWith.Return<'ok', V, T>
		: never

export const ResultOkFromUnlessError: ResultFromUnlessWith<'ok'> = ResultFromUnlessWith('ok')
