import { ResultFromUnlessWith } from '../factories/result-create-result-from-unless-with'
import type { Result } from '../models/result'

export type ResultOkFromUnlessError<
	V,
	T extends Result.Tag,
> =
	ResultFromUnlessWith.Return<'ok', V, T>

export const ResultOkFromUnlessError: ResultFromUnlessWith<'ok'> = ResultFromUnlessWith('ok')
