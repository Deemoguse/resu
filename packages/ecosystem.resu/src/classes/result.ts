import type { ResultAny } from '../operations/result-any'
import type { UtilsNonUndefined } from '../utils/utils-non-undefined'
import { Emitter } from './emitter'

/**
 * Describes the structural pieces shared by every result instance.
 */
export namespace Result {
	/**
	 * Public status carried by a result.
	 */
	export type Status = 'ok' | 'error'

	/**
	 * Optional result discriminator used by matching helpers.
	 */
	export type Tag = null | string

	/**
	 * Payload accepted by result helpers.
	 */
	export type Data = unknown

	/**
	 * Constructor parameters for a concrete result shape.
	 *
	 * @template P
	 * Result shape whose `status`, `tag`, and `data` fields define the instance.
	 */
	export type Params<P extends {
		status: Result.Status
		tag: Result.Tag
		data: Result.Data
	}> =
		[P] extends [unknown]
			? {
				/**
				 * Status stored on the result.
				 *
				 * @public
				 */
				status: P['status']

				/**
				 * Optional tag stored on the result.
				 *
				 * @public
				 */
				tag?: UtilsNonUndefined<P['tag']>

				/**
				 * Optional payload stored on the result.
				 *
				 * @public
				 */
				data?: UtilsNonUndefined<P['data']>

				/**
				 * Controls notification of result creation subscribers.
				 *
				 * `false` suppresses notification for this result. `true` or omission
				 * notifies all current subscribers, regardless of the result status.
				 *
				 * @public
				 */
				emit?: boolean
			}
			: never
}

// Internal nominal type marker used to distinguish `Result`
// from structurally compatible types:
const ResultSymbol = Symbol.for('__RESU_RESULT_KEY__')

/**
 * Container for an `ok` or `error` result with readonly, shallow-frozen fields.
 *
 * Result instances expose only their status, optional tag, and payload. Prefer
 * the public result operation helpers for construction in application code.
 * Subscribers receive this same instance synchronously after it is frozen,
 * unless construction uses `emit: false`. Nested result creation is not suppressed.
 *
 * @template P
 * Result shape whose `status`, `tag`, and `data` fields are exposed by the instance.
 *
 * @example
 * ```ts
 * const result = new Result({ status: 'ok', tag: 'Ready', data: 1 })
 * result.status
 * ```
 *
 * @example
 * ```ts
 * const result = new Result({ status: 'error', data: new Error('boom') })
 * result.data
 * ```
 *
 * @public
 */
export class Result<P extends {
	status: Result.Status
	tag: Result.Tag
	data: Result.Data
}> {
	// Internal nominal type marker used to distinguish `Result`
	// from structurally compatible types.
	public readonly [ResultSymbol] = ResultSymbol

	/**
	 * Status carried by this result.
	 *
	 * @public
	 */
	public readonly status: P['status']

	/**
	 * Tag carried by this result.
	 *
	 * @public
	 */
	public readonly tag: P['tag']

	/**
	 * Payload carried by this result; readonly applies to the field, not nested data.
	 *
	 * @public
	 */
	public readonly data: P['data']

	/**
	 * Creates and shallow-freezes a result before notifying creation subscribers.
	 * Unless `emit: false` is provided, subscribers run before construction returns.
	 * Synchronous subscriber exceptions are logged and do not stop other subscribers.
	 *
	 * @param params
	 * Result fields and optional emission override.
	 *
	 * @example
	 * ```ts
	 * const result = new Result({ status: 'ok', data: 42 })
	 * ```
	 *
	 * @example
	 * ```ts
	 * const result = new Result({ status: 'error', tag: 'Failure', data: 'broken' })
	 * ```
	 *
	 * @public
	 */
	constructor(params: Result.Params<P>) {
		this.status = params.status
		this.tag = (params.tag ?? null)
		this.data = (params.data ?? null)

		const readonlyThis = Object.freeze(this)
		if (params.emit !== false) Emitter.runSubscribers(readonlyThis as ResultAny)

		return readonlyThis
	}
}
