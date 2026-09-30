import { Result } from '../classes/result'

/**
 * Union of every public result instance shape.
 */
export type ResultAny =
	Result<{ status: 'ok', tag: Result.AnyTag, data: Result.AnyData }> |
	Result<{ status: 'error', tag: Result.AnyTag, data: Result.AnyData }>
