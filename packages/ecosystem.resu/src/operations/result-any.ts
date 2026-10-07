import { Result } from '../classes/result'

/**
 * Union of every public result instance shape.
 */
export type ResultAny =
	Result<{ status: 'ok', tag: Result.Tag, data: Result.Data }> |
	Result<{ status: 'error', tag: Result.Tag, data: Result.Data }>
