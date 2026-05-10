import { Result } from '../classes/result'

export type ResultAny =
	Result<'ok', Result.AnyTag, Result.AnyData> |
	Result<'error', Result.AnyTag, Result.AnyData>
