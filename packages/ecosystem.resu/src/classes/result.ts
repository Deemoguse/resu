import type { ResultAny } from '../operations/result-any'
import type { UtilsNonUndefinedSync } from '../utils/utils-non-undefined-sync'
import type { Emitter } from './emitter'

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
	 * Non-undefined tag shape used by broad result aliases.
	 */
	export type AnyTag = UtilsNonUndefinedSync<Tag>

	/**
	 * Non-undefined payload shape used by broad result aliases.
	 */
	export type AnyData = UtilsNonUndefinedSync<unknown>

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
				tag?: UtilsNonUndefinedSync<P['tag']>

				/**
				 * Optional payload stored on the result.
				 *
				 * @public
				 */
				data?: UtilsNonUndefinedSync<P['data']>

				/**
				 * Optional emission override for result observers.
				 *
				 * @public
				 */
				emit?: boolean
			}
			: never
}

/**
 * Immutable container for an `ok` or `error` result value.
 *
 * Result instances expose only their status, optional tag, and payload. Prefer
 * the public result operation helpers for construction in application code.
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
	/**
	 * Returns the shared emitter registry.
	 *
	 * @returns
	 * Mutable emitter set used by result construction.
	 */
	private static _getEmitterSet(): Set<Emitter> {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		const ctx = window || globalThis
		// @ts-expect-error eslint-disable-line @typescript-eslint/ban-ts-comment
		return (ctx['__RESU_EMITTERS__'] ||= new Set()) as Set<Emitter>
	}

	/**
	 * Registers an emitter that can observe newly created results.
	 *
	 * @param emmiter
	 * Emitter instance to add to the shared registry.
	 *
	 * @example
	 * ```ts
	 * const emitter = getEmitter()
	 * Result.addEmmiter(emitter)
	 * ```
	 *
	 * @example
	 * ```ts
	 * Result.addEmmiter(emitter)
	 * const off = emitter.on((result) => result.status)
	 * ```
	 */
	public static addEmmiter(emmiter: Emitter): void {
		const emmiters = this._getEmitterSet()
		emmiters.add(emmiter)
	}

	/**
	 * Removes an emitter from result observation and clears its listeners.
	 *
	 * @param emmiter
	 * Emitter instance to remove from the shared registry.
	 *
	 * @example
	 * ```ts
	 * Result.deleteEmmiter(emitter)
	 * ```
	 *
	 * @example
	 * ```ts
	 * Result.addEmmiter(emitter)
	 * Result.deleteEmmiter(emitter)
	 * ```
	 */
	public static deleteEmmiter(emmiter: Emitter): void {
		const emmiters = this._getEmitterSet()
		if (!emmiters.has(emmiter)) return
		emmiters.delete(emmiter)
		emmiter.offAll()
	}

	// ---------------------------------------------------------------------

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
	 * Payload carried by this result.
	 *
	 * @public
	 */
	public readonly data: UtilsNonUndefinedSync<P['data']>

	/**
	 * Creates a result with the provided status, tag, payload, and emission option.
	 *
	 * @param params
	 * Result fields and optional emission behavior.
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
		this.data = (params.data ?? null) as UtilsNonUndefinedSync<P['data']>

		this._callEmit(params.emit)
		return Object.freeze(this) as this
	}

	/**
	 * Notifies registered emitters about this result when emission is allowed.
	 *
	 * @param emit
	 * Optional override for default emission behavior.
	 *
	 * @returns
	 * Nothing.
	 */
	private _callEmit(emit?: boolean): void {
		const emmiters = Result._getEmitterSet()
		emmiters.forEach((emmiter) => {
			const allow = emit ?? this.status === 'ok'
				? emmiter.emitOk?.(this as ResultAny)
				: emmiter.emitError?.(this as ResultAny)

			if (allow) emmiter.emit(this as ResultAny)
		})
	}
}
