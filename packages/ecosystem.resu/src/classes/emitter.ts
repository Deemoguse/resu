import type { ResultAny } from '../operations/result-any'

export namespace Emitter {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export type AnyFn = (...args: any[]) => any

	export type Handler<T extends 'on' | 'off'> =
		[T] extends [unknown]
			? T extends 'on'
				? (result: ResultAny, off: () => void) => unknown
				: (result: ResultAny) => unknown
			: never

	export type EmitByDefaultOptionPredicat = (result: ResultAny) => boolean

	export type EmitByDefaultOption = boolean | EmitByDefaultOptionPredicat

	export type Options = {
		emitOk?: EmitByDefaultOption
		emitError?: EmitByDefaultOption
	}
}

export class Emitter {
	private readonly _target = new EventTarget()
	private readonly _listeners = new Map<Emitter.AnyFn, Emitter.AnyFn>()

	public readonly emitOk?: Emitter.EmitByDefaultOptionPredicat
	public readonly emitError?: Emitter.EmitByDefaultOptionPredicat

	private constructor(options: Emitter.Options) {
		if (options.emitOk) this.emitOk = this._emitPredicate(options.emitOk)
		if (options.emitError) this.emitError = this._emitPredicate(options.emitError)
	}

	public on(handler: Emitter.Handler<'on'>): undefined | (() => void) {
		const off = () => this.off(handler as Emitter.Handler<'off'>)
		const adapter = (event: CustomEvent<ResultAny>) => handler(event.detail, off)

		this._listeners.set(handler, adapter)
		this._target.addEventListener('@', (event) => adapter(event as CustomEvent<ResultAny>))

		return off
	}

	public off(handler: Emitter.Handler<'off'>): void {
		const adapter = this._listeners.get(handler)
		if (adapter) this._target.removeEventListener('@', adapter)
	}

	public offAll(): void {
		this._listeners.forEach((_, handler) => this.off(handler))
	}

	public emit(result: ResultAny): void {
		const event = new CustomEvent('@', { detail: result })
		this._target.dispatchEvent(event)
	}

	private _emitPredicate(value: Emitter.EmitByDefaultOption): Emitter.EmitByDefaultOptionPredicat {
		return typeof value === 'function' ? value : () => value
	}
}
