import type { ResultAny } from '../operations/result-any'

/**
 * Types used by result emitters.
 */
export namespace Emitter {
	/**
	 * Function shape used for internal listener adapters.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export type AnyFn = (...args: any[]) => any

	/**
	 * Handler accepted by emitter subscription methods.
	 *
	 * @template T
	 * Subscription phase that determines the handler arguments.
	 */
	export type Handler<T extends 'on' | 'off'> =
		[T] extends [unknown]
			? T extends 'on'
				? (result: ResultAny, off: () => void) => unknown
				: (result: ResultAny) => unknown
			: never

	/**
	 * Predicate that decides whether a result should be emitted by default.
	 *
	 * @param result
	 * Result being considered for emission.
	 *
	 * @returns
	 * `true` when the result should be emitted.
	 */
	export type EmitByDefaultOptionPredicat = (result: ResultAny) => boolean

	/**
	 * Static boolean or predicate form accepted by emitter options.
	 */
	export type EmitByDefaultOption = boolean | EmitByDefaultOptionPredicat

	/**
	 * Options that control which result statuses are emitted automatically.
	 */
	export type Options = {
		/**
		 * Enables or filters automatic `ok` result emission.
		 */
		emitOk?: EmitByDefaultOption

		/**
		 * Enables or filters automatic `error` result emission.
		 */
		emitError?: EmitByDefaultOption
	}
}

/**
 * Event-style dispatcher used by result emission helpers.
 *
 * Emitter instances subscribe to result events and can be registered with the
 * result emitter operations. The constructor is private in the public type
 * surface, so consumers normally receive or create instances through package
 * integration code.
 *
 * @example
 * ```ts
 * declare const emitter: Emitter
 * const off = emitter.on((result) => result.status)
 * ```
 *
 * @example
 * ```ts
 * declare const emitter: Emitter
 * emitter.on((result, off) => {
 * 	if (result.status === 'error') off()
 * })
 * ```
 */
export class Emitter {
	/**
	 * Event target that owns listener dispatch.
	 */
	private readonly _target = new EventTarget()

	/**
	 * Maps public handlers to event listener adapters.
	 */
	private readonly _listeners = new Map<Emitter.AnyFn, Emitter.AnyFn>()

	/**
	 * Optional predicate for default `ok` emissions.
	 */
	public readonly emitOk?: Emitter.EmitByDefaultOptionPredicat

	/**
	 * Optional predicate for default `error` emissions.
	 */
	public readonly emitError?: Emitter.EmitByDefaultOptionPredicat

	/**
	 * Creates an emitter with default emission options.
	 *
	 * @param options
	 * Emission options for ok and error results.
	 */
	private constructor(options: Emitter.Options) {
		if (options.emitOk) this.emitOk = this._emitPredicate(options.emitOk)
		if (options.emitError) this.emitError = this._emitPredicate(options.emitError)
	}

	/**
	 * Subscribes to emitted results.
	 *
	 * @param handler
	 * Callback invoked for each emitted result. The second argument unsubscribes
	 * the same handler.
	 *
	 * @returns
	 * Function that removes the handler.
	 *
	 * @example
	 * ```ts
	 * declare const emitter: Emitter
	 * const off = emitter.on((result) => result.status)
	 * ```
	 *
	 * @example
	 * ```ts
	 * declare const emitter: Emitter
	 * emitter.on((result, off) => {
	 * 	if (result.status === 'ok') off()
	 * })
	 * ```
	 */
	public on(handler: Emitter.Handler<'on'>): undefined | (() => void) {
		const off = () => this.off(handler as Emitter.Handler<'off'>)
		const adapter = (event: CustomEvent<ResultAny>) => handler(event.detail, off)

		this._listeners.set(handler, adapter)
		this._target.addEventListener('@', (event) => adapter(event as CustomEvent<ResultAny>))

		return off
	}

	/**
	 * Removes a previously registered handler.
	 *
	 * @param handler
	 * Handler to remove from this emitter.
	 *
	 * @example
	 * ```ts
	 * declare const emitter: Emitter
	 * const off = emitter.on(() => undefined)
	 * off?.()
	 * ```
	 *
	 * @example
	 * ```ts
	 * declare const emitter: Emitter
	 * const handler = (result: ResultAny) => result.status
	 * emitter.on(handler)
	 * emitter.off(handler)
	 * ```
	 */
	public off(handler: Emitter.Handler<'off'>): void {
		const adapter = this._listeners.get(handler)
		if (adapter) this._target.removeEventListener('@', adapter)
	}

	/**
	 * Removes every registered handler from this emitter.
	 *
	 * @example
	 * ```ts
	 * declare const emitter: Emitter
	 * emitter.offAll()
	 * ```
	 *
	 * @example
	 * ```ts
	 * declare const emitter: Emitter
	 * emitter.on(() => undefined)
	 * emitter.offAll()
	 * ```
	 */
	public offAll(): void {
		this._listeners.forEach((_, handler) => this.off(handler))
	}

	/**
	 * Emits a result to the current subscribers.
	 *
	 * @param result
	 * Result instance to dispatch.
	 *
	 * @example
	 * ```ts
	 * declare const emitter: Emitter
	 * emitter.emit(ResultOk({ data: 1 }))
	 * ```
	 *
	 * @example
	 * ```ts
	 * declare const emitter: Emitter
	 * emitter.emit(ResultError({ tag: 'Failure', data: 'broken' }))
	 * ```
	 */
	public emit(result: ResultAny): void {
		const event = new CustomEvent('@', { detail: result })
		this._target.dispatchEvent(event)
	}

	/**
	 * Normalizes emitter option values into predicates.
	 *
	 * @param value
	 * Boolean or predicate option.
	 *
	 * @returns
	 * Predicate form of the option.
	 */
	private _emitPredicate(value: Emitter.EmitByDefaultOption): Emitter.EmitByDefaultOptionPredicat {
		return typeof value === 'function' ? value : () => value
	}
}
