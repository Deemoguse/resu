import { RuntimeError } from '../errors/runtime-error'
import { FlowTrySync } from '../operations/flow-try-sync'
import { ResultOkFromUnlessError } from '../operations/result-ok-from-unless-error'
import type { Result } from './result'
import type { ResultAny } from '../operations/result-any'
import type { NonUndefined } from '../types/non-undefined'
import type { ResultExclude } from '../operations/result-exclude'
import type { ResultAnyError } from '../operations/result-any-error'
import type { ResultExtract } from '../operations/result-extract'
import type { NonAmptyArray } from '../types/non-empty-array'

export namespace Match {
	export type KindTarget<K extends Kind> =
		[K] extends [unknown]
			? new (...args: unknown[]) => K['type']
			: never

	export interface Kind {
		R: unknown
		L: unknown
		type: unknown
	}

	export type Handler<R extends ResultAny = ResultAny, V = unknown> =
		[R, V] extends [unknown, unknown]
			? (result: R) => NonUndefined<V>
			: never

	export type Store = {
		usageError?: ResultAnyError
		ok: Map<Result.Tag, Handler>
		error: Map<Result.Tag, Handler>
		okAny?: Handler
		errorAny?: Handler
		any?: Handler
	}

	export type WithTag<
		K extends Kind,
		S extends Result.Status,
		R extends ResultAny,
		L extends ResultAny,
	> =
		[K, S, R, L] extends [unknown, unknown, unknown, unknown]
			? [ResultExtract<L, S>] extends [never] ? never : <
				T extends ResultExtract<L, S>['tag'],
				V,
			>(
				tags: NonAmptyArray<T>,
				handler: Handler<ResultExtract<L, S, T>, V>,
			) => (
				Match.Apply<K, Match.CalcResult<R, V>, Match.CalcLeft<S, L, T>>
			)
			: never

	export type WithStatus<
		K extends Kind,
		S extends Result.Status | 'any',
		R extends ResultAny,
		L extends ResultAny,
	> =
		[K, S, R, L] extends [unknown, unknown, unknown, unknown]
			? S extends Result.Status
				? <V>(handler: Handler<ResultExtract<L, S>, V>) => Match.Apply<K, Match.CalcResult<R, V>, ResultExclude<L, S>>
				: <V>(handler: Handler<L, V>) => Match.Apply<K, Match.CalcResult<R, V>, never>
			: never

	export type CalcResult<
		R extends ResultAny,
		V,
	> =
		[R, V] extends [unknown, unknown]
			? R | ResultOkFromUnlessError<V>
			: never

	export type CalcLeft<
		S extends Result.Status,
		L extends ResultAny,
		T extends Result.Tag = never,
	> =
		[S, L, T] extends [unknown, unknown, unknown]
			? ResultExclude<L, S, T>
			: never

	export type Apply<
		K extends Kind,
		R extends ResultAny,
		L extends ResultAny,
	> =
		[K, R, L] extends [unknown, unknown, unknown]
			? (K & { R: R, L: L })['type']
			: never
}

export abstract class Match<
	R extends ResultAny = never,
	L extends ResultAny = never,
	K extends Match.Kind = Match.Kind,
> {
	protected readonly inputResult: L
	protected readonly store: Match.Store
	protected readonly target: Match.KindTarget<K>

	constructor(
		target: Match.KindTarget<K>,
		result: L,
		store?: Match.Store,
	) {
		this.target = target
		this.store = this._createStore(store)
		this.inputResult = result
	}

	public abstract result(): FlowTrySync<R | L>

	public readonly ok: Match.WithTag<K, 'ok', R, L> = this._withTag('ok')

	public readonly error: Match.WithTag<K, 'error', R, L> = this._withTag('error')

	public readonly okAny: Match.WithStatus<K, 'ok', R, L> = this._withStatus('ok')

	public readonly errorAny: Match.WithStatus<K, 'error', R, L> = this._withStatus('error')

	public readonly any: Match.WithStatus<K, 'any', R, L> = this._withStatus('any')

	protected resolveResult<R1 extends ResultAny>(cb: (missmatch: boolean, result: ResultAny) => R1): FlowTrySync<R1> {
		const result = FlowTrySync(() => {
			if (this.store.usageError) return this.store.usageError

			const { status, tag } = this.inputResult
			const handler = this.store[status].get(tag) || this.store[`${status}Any`] || this.store.any

			const result = FlowTrySync(() => ResultOkFromUnlessError(handler ? handler(this.inputResult) : this.inputResult))
			return cb(!!handler, result)
		})

		return result as FlowTrySync<R1>
	}

	private _createStore(base?: Match.Store): Match.Store {
		return {
			ok: new Map(base?.ok),
			error: new Map(base?.error),
			okAny: base?.okAny,
			errorAny: base?.errorAny,
			any: base?.any,
		}
	}

	private _withTag <S extends Result.Status>(status: S): Match.WithTag<K, S, R, L> {
		return ((tags, handler) => {
			const store = this._createStore(this.store)
			if (!store.usageError) tags.some((tag) => {
				const alreadyExist = store[status].has(tag)
				if (alreadyExist) return store.usageError = RuntimeError(`A handler is already defined for ${status}:${tag || 'null'}.`)
				else store[status].set(tag, handler as Match.Handler)
			})

			return new this.target(this.inputResult, store)
		}) as Match.WithTag<K, S, R, L>
	}

	private _withStatus <S extends Result.Status | 'any'>(status: S): Match.WithStatus<K, S, R, L> {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const prop = status === 'any' ? 'any' : `${status as Result.Status}Any` as const

		return ((handler: Match.Handler) => {
			const store = this._createStore(this.store)
			if (!store.usageError) {
				const alreadyExist = !!store[prop]
				if (alreadyExist) return store.usageError = RuntimeError(`A handler is already defined for ${status}.`)
				else store[prop] = handler
			}

			return new this.target(this.inputResult, store)
		}) as Match.WithStatus<K, S, R, L>
	}
}
