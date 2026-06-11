import { Result } from '../classes/result'

/**
 * Union of every public result instance.
 */
export type ResultAny =
	Result<'ok', Result.AnyTag, Result.AnyData> |
	Result<'error', Result.AnyTag, Result.AnyData>
