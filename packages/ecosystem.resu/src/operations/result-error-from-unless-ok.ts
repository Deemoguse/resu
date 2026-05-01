import { ResultFromUnlessWith } from '../factories/result-create-result-from-unless-with'
import type { Result } from '../models/result'

export type ResultErrorFromUnlessOk<
	V,
	T extends Result.Tag,
> =
	ResultFromUnlessWith.Return<'error', V, T>

export const ResultErrorFromUnlessOk: ResultFromUnlessWith<'error'> = ResultFromUnlessWith('error')
