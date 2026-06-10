import type { ResultAny } from '../operations/result-any'
import type { NonUndefinedSync } from '../types/non-undefined-sync'
import type { Emitter } from './emitter'

export namespace Result {
	export type Status = 'ok' | 'error'
	export type Tag = null | string
	export type Data = unknown

	export type AnyTag = NonUndefinedSync<Tag>
	export type AnyData = NonUndefinedSync<unknown>

	export type Params<
		S extends Result.Status,
		T extends Result.Tag,
		D,
	> =
		[S, T, D] extends [unknown, unknown, unknown]
			? {
				status: S
				tag?: NonUndefinedSync<T>
				data?: NonUndefinedSync<D>
				emit?: boolean
			}
			: never
}

export class Result<
	S extends Result.Status = Result.Status,
	T extends Result.Tag = null,
	D = null,
> {
	private static _getEmitterSet(): Set<Emitter> {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		const ctx = window || globalThis
		// @ts-expect-error eslint-disable-line @typescript-eslint/ban-ts-comment
		return (ctx['__RESU_EMITTERS__'] ||= new Set()) as Set<Emitter>
	}

	public static addEmmiter(emmiter: Emitter): void {
		const emmiters = this._getEmitterSet()
		emmiters.add(emmiter)
	}

	public static deleteEmmiter(emmiter: Emitter): void {
		const emmiters = this._getEmitterSet()
		if (!emmiters.has(emmiter)) return
		emmiters.delete(emmiter)
		emmiter.offAll()
	}

	// ---------------------------------------------------------------------

	public readonly status: S
	public readonly tag: T
	public readonly data: NonUndefinedSync<D>

	constructor(params: Result.Params<S, T, D>) {
		this.status = params.status
		this.tag = (params.tag ?? null) as T
		this.data = (params.data ?? null) as NonUndefinedSync<D>

		this._callEmit(params.emit)
		return Object.freeze(this) as this
	}

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
