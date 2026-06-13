import { ResultErrorFrom } from '../operations/result-error-from'
import type { Result } from '../classes/result'
import type { UtilsNonUndefinedSync } from '../utils/utils-non-undefined-sync'

/**
 * Types for fixed-tag internal error constructors.
 */
export namespace UtilsCreateErrorWith {
	/**
	 * Error result type produced by an internal error constructor.
	 *
	 * @template T
	 * Error tag assigned to the result.
	 *
	 * @template D
	 * Payload carried by the error result.
	 */
	export type Return<
		T extends Result.Tag,
		D = Result.AnyData,
	> =
		[T, D] extends [unknown, unknown]
			? ResultErrorFrom<D, T>
			: never
}

/**
 * Overloaded constructor type for fixed-tag internal error results.
 *
 * @template T
 * Error tag assigned to every produced result.
 */
export type UtilsCreateErrorWith<T extends Result.Tag> = [T] extends [unknown]
	? {
		/**
		 * Creates an error result from a message.
		 *
		 * @param message
		 * Message used to create an `Error` payload.
		 *
		 * @returns
		 * Error result with the fixed tag and an `Error` payload.
		 */
		(message: string): UtilsCreateErrorWith.Return<T, Error>
		/**
		 * Creates an error result from a custom payload.
		 *
		 * @template D
		 * Payload type carried by the error result.
		 *
		 * @param data
		 * Optional custom payload.
		 *
		 * @returns
		 * Error result with the fixed tag and payload.
		 */
		<D = null>(data?: UtilsNonUndefinedSync<D>): UtilsCreateErrorWith.Return<T, D>
	}
	: never

/**
 * Creates a fixed-tag error result constructor.
 *
 * @template T
 * Error tag assigned to every produced result.
 *
 * @param tag
 * Error tag to bind.
 *
 * @returns
 * Constructor that creates error results with the bound tag.
 *
 * @example
 * ```ts
 * const ValidationError = InternalErrorWith('ValidationError')
 * const result = ValidationError('Invalid payload')
 * ```
 *
 * @example
 * ```ts
 * const AbortLikeError = InternalErrorWith('AbortLikeError')
 * const result = AbortLikeError({ reason: 'cancelled' })
 * ```
 */
export function UtilsCreateErrorWith<T extends Result.Tag>(tag: T): UtilsCreateErrorWith<T> {
	return function (data: unknown) {
		const resolvedData = typeof data === 'string' ? new Error(data) : data
		return ResultErrorFrom(resolvedData, tag)
	} as UtilsCreateErrorWith<T>
}
