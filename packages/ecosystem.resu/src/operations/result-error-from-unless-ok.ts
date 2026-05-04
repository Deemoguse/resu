import { ResultFromUnlessWith } from '../factories/result-create-result-from-unless-with'
import type { Result } from '../models/result'

export type ResultErrorFromUnlessOk<
	V,
	T extends Result.Tag = never,
> =
	[V, T] extends [unknown, unknown]
		? ResultFromUnlessWith.Return<'error', V, T>
		: never

export const ResultErrorFromUnlessOk: ResultFromUnlessWith<'error'> = ResultFromUnlessWith('error')
