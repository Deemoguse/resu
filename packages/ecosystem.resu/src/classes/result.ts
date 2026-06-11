import type { ResultAny } from '../operations/result-any'
import type { NonUndefinedSync } from '../types/non-undefined-sync'
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
	export type AnyTag = NonUndefinedSync<Tag>

	/**
	 * Non-undefined payload shape used by broad result aliases.
	 */
	export type AnyData = NonUndefinedSync<unknown>

	/**
	 * Constructor parameters for a concrete result instance.
	 *
	 * @template S
	 * Result status stored on the instance.
	 *
	 * @template T
	 * Result tag stored on the instance.
	 *
	 * @template D
	 * Result payload stored on the instance.
	 */
	export type Params<
		S extends Result.Status,
		T extends Result.Tag,
		D,
	> =
		[S, T, D] extends [unknown, unknown, unknown]
			? {
				/**
				 * Status stored on the result.
				 */
				status: S

				/**
				 * Optional tag stored on the result.
				 */
				tag?: NonUndefinedSync<T>

				/**
				 * Optional payload stored on the result.
				 */
				data?: NonUndefinedSync<D>

				/**
				 * Optional emission override for result observers.
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
 * @template S
 * Status represented by this result.
 *
 * @template T
 * Tag represented by this result.
 *
 * @template D
 * Payload represented by this result.
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
 */
export class Result<
	S extends Result.Status = Result.Status,
	T extends Result.Tag = null,
	D = null,
> {
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
	 */
	public readonly status: S

	/**
	 * Tag carried by this result.
	 */
	public readonly tag: T

	/**
	 * Payload carried by this result.
	 */
	public readonly data: NonUndefinedSync<D>

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
	 */
	constructor(params: Result.Params<S, T, D>) {
		this.status = params.status
		this.tag = (params.tag ?? null) as T
		this.data = (params.data ?? null) as NonUndefinedSync<D>

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
