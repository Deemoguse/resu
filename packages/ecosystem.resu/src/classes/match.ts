import { UtilsErrorRuntime } from '../utils/utils-error-runtime'
import { FlowTrySync } from '../operations/flow-try-sync'
import { ResultOkFromUnlessError } from '../operations/result-ok-from-unless-error'
import type { Result } from './result'
import type { ResultAny } from '../operations/result-any'
import type { UtilsResultSource } from '../utils/utils-result-source'
import type { UtilsNonUndefinedSync } from '../utils/utils-non-undefined-sync'
import type { UtilsNonAmptyArray } from '../utils/utils-non-empty-array'
import type { ResultExclude } from '../operations/result-exclude'
import type { ResultAnyError } from '../operations/result-any-error'
import type { ResultExtract } from '../operations/result-extract'

/**
 * Type helpers used by flow matching chains.
 */
export namespace Match {
	/**
	 * Constructor shape that preserves a concrete match chain subtype.
	 *
	 * @template K
	 * Match kind that provides the concrete chain type.
	 */
	export type KindTarget<K extends Kind> =
		[K] extends [unknown]
			? new (...args: unknown[]) => K['type']
			: never

	/**
	 * Structural kind used to re-create typed match chain instances.
	 */
	export interface Kind {
		/**
		 * Accumulated handled result type.
		 */
		R: unknown
		/**
		 * Remaining unhandled result type.
		 */
		L: unknown
		/**
		 * Concrete chain instance type.
		 */
		type: unknown
	}

	/**
	 * Handler invoked when a result branch matches.
	 *
	 * @template R
	 * Result type received by the handler.
	 *
	 * @template V
	 * Value returned by the handler.
	 */
	export type Handler<R extends ResultAny = ResultAny, V = unknown> =
		[R, V] extends [unknown, unknown]
			? (result: R) => UtilsNonUndefinedSync<UtilsResultSource<V>>
			: never

	/**
	 * Handler registry carried by immutable match chains.
	 */
	export type Store = {
		/**
		 * Deferred usage error produced by duplicate handlers.
		 */
		usageError?: ResultAnyError
		/**
		 * Tag handlers for ok results.
		 */
		ok: Map<Result.Tag, Handler>
		/**
		 * Tag handlers for error results.
		 */
		error: Map<Result.Tag, Handler>
		/**
		 * Status-wide ok handler.
		 */
		okAny?: Handler
		/**
		 * Status-wide error handler.
		 */
		errorAny?: Handler
		/**
		 * Fallback handler for any result status.
		 */
		any?: Handler
	}

	/**
	 * Adds handlers for one or more tags under a concrete result status.
	 *
	 * @template K
	 * Concrete match chain kind.
	 *
	 * @template S
	 * Result status handled by this matcher.
	 *
	 * @template R
	 * Accumulated handled result type.
	 *
	 * @template L
	 * Remaining unhandled result type.
	 */
	export type WithTag<
		K extends Kind,
		S extends Result.Status,
		R extends ResultAny,
		L extends ResultAny,
	> =
		[K, S, R, L] extends [unknown, unknown, unknown, unknown]
			? [ResultExtract<L, S>] extends [never]
				? never
				: <
					T extends ResultExtract<L, S>['tag'],
					V,
				>(
					tags: UtilsNonAmptyArray<T>,
					handler: Handler<ResultExtract<L, S, T>, V>,
				) => (
					Match.Apply<K, Match.CalcResult<R, V>, Match.CalcLeft<S, L, T>>
				)
			: never

	/**
	 * Adds a status-wide or fallback handler to a match chain.
	 *
	 * @template K
	 * Concrete match chain kind.
	 *
	 * @template S
	 * Status selector handled by this matcher.
	 *
	 * @template R
	 * Accumulated handled result type.
	 *
	 * @template L
	 * Remaining unhandled result type.
	 */
	export type WithStatus<
		K extends Kind,
		S extends Result.Status | 'any',
		R extends ResultAny,
		L extends ResultAny,
	> =
		[K, S, R, L] extends [unknown, unknown, unknown, unknown]
			? S extends Result.Status
				? [ResultExtract<L, S>] extends [never]
					? never
					: <V>(handler: Handler<ResultExtract<L, S>, V>) => Match.Apply<K, Match.CalcResult<R, V>, ResultExclude<L, S>>
				: [L] extends [never]
					? never
					: <V>(handler: Handler<L, V>) => Match.Apply<K, Match.CalcResult<R, V>, never>
			: never

	/**
	 * Extends a match result union with a handler output.
	 *
	 * @template R
	 * Existing handled result union.
	 *
	 * @template V
	 * Handler output to wrap into a result when needed.
	 */
	export type CalcResult<
		R extends ResultAny,
		V,
	> =
		[R, V] extends [unknown, unknown]
			? R | ResultOkFromUnlessError<V>
			: never

	/**
	 * Removes handled variants from the remaining result union.
	 *
	 * @template S
	 * Status to remove.
	 *
	 * @template L
	 * Remaining result union before the handler is added.
	 *
	 * @template T
	 * Optional tag to remove within the status.
	 */
	export type CalcLeft<
		S extends Result.Status,
		L extends ResultAny,
		T extends Result.Tag = never,
	> =
		[S, L, T] extends [unknown, unknown, unknown]
			? ResultExclude<L, S, T>
			: never

	/**
	 * Applies accumulated result and remaining types to a concrete chain kind.
	 *
	 * @template K
	 * Concrete match chain kind.
	 *
	 * @template R
	 * Accumulated handled result type.
	 *
	 * @template L
	 * Remaining unhandled result type.
	 */
	export type Apply<
		K extends Kind,
		R extends ResultAny,
		L extends ResultAny,
	> =
		[K, R, L] extends [unknown, unknown, unknown]
			? (K & { R: R, L: L })['type']
			: never
}

/**
 * Base class for immutable result matching chains.
 *
 * Concrete match helpers add handlers for result statuses and tags, then call
 * `result()` to evaluate the chain into a flow result.
 *
 * @template R
 * Accumulated result type produced by configured handlers.
 *
 * @template L
 * Result type that may still be left unhandled.
 *
 * @template K
 * Concrete match chain kind.
 *
 * @example
 * ```ts
 * const result = FlowMatchLoose(ResultOk({ tag: 'Ready', data: 1 }))
 * 	.ok(['Ready'], (current) => current.data + 1)
 * 	.result()
 * ```
 *
 * @example
 * ```ts
 * const result = FlowMatchStrict(ResultError({ tag: 'Failure', data: 'broken' }))
 * 	.error(['Failure'], (current) => current.data)
 * 	.result()
 * ```
 */
export abstract class Match<
	R extends ResultAny = never,
	L extends ResultAny = never,
	K extends Match.Kind = Match.Kind,
> {
	/**
	 * Result being matched by the chain.
	 */
	protected readonly inputResult: L

	/**
	 * Handler store accumulated by the chain.
	 */
	protected readonly store: Match.Store

	/**
	 * Constructor used to preserve the concrete chain subtype.
	 */
	protected readonly target: Match.KindTarget<K>

	/**
	 * Creates a match chain over a result.
	 *
	 * @param target
	 * Concrete match constructor used for chained calls.
	 *
	 * @param result
	 * Result value to match.
	 *
	 * @param store
	 * Optional existing handler store for chain cloning.
	 *
	 * @example
	 * ```ts
	 * const chain = FlowMatchLoose(ResultOk({ data: 1 }))
	 * ```
	 *
	 * @example
	 * ```ts
	 * const chain = FlowMatchStrict(ResultError({ tag: 'Failure', data: 'broken' }))
	 * ```
	 */
	constructor(
		target: Match.KindTarget<K>,
		result: L,
		store?: Match.Store,
	) {
		this.target = target
		this.store = this._createStore(store)
		this.inputResult = result
	}

	/**
	 * Evaluates the configured match chain.
	 *
	 * @returns
	 * Flow result produced by a matching handler, or by the concrete chain mode.
	 *
	 * @example
	 * ```ts
	 * const result = FlowMatchLoose(ResultOk({ data: 1 })).result()
	 * ```
	 *
	 * @example
	 * ```ts
	 * const result = FlowMatchStrict(ResultError({ tag: 'Failure' })).result()
	 * ```
	 */
	public abstract result(): FlowTrySync<R | L>

	/**
	 * Adds a handler for one or more ok tags.
	 *
	 * @example
	 * ```ts
	 * FlowMatchLoose(ResultOk({ tag: 'Ready', data: 1 }))
	 * 	.ok(['Ready'], (result) => result.data)
	 * ```
	 *
	 * @example
	 * ```ts
	 * FlowMatchStrict(ResultOk({ data: 1 }))
	 * 	.ok([null], (result) => result.data + 1)
	 * ```
	 */
	public readonly ok: Match.WithTag<K, 'ok', R, L> = this._withTag('ok')

	/**
	 * Adds a handler for one or more error tags.
	 *
	 * @example
	 * ```ts
	 * FlowMatchLoose(ResultError({ tag: 'Failure', data: 'broken' }))
	 * 	.error(['Failure'], (result) => result.data)
	 * ```
	 *
	 * @example
	 * ```ts
	 * FlowMatchStrict(ResultError({ data: new Error('boom') }))
	 * 	.error([null], (result) => result.data)
	 * ```
	 */
	public readonly error: Match.WithTag<K, 'error', R, L> = this._withTag('error')

	/**
	 * Adds a handler for any ok result.
	 *
	 * @example
	 * ```ts
	 * FlowMatchLoose(ResultOk({ data: 1 }))
	 * 	.okAny((result) => result.data)
	 * ```
	 *
	 * @example
	 * ```ts
	 * FlowMatchStrict(ResultOk({ tag: 'Ready', data: 1 }))
	 * 	.okAny((result) => result.tag)
	 * ```
	 */
	public readonly okAny: Match.WithStatus<K, 'ok', R, L> = this._withStatus('ok')

	/**
	 * Adds a handler for any error result.
	 *
	 * @example
	 * ```ts
	 * FlowMatchLoose(ResultError({ data: 'broken' }))
	 * 	.errorAny((result) => result.data)
	 * ```
	 *
	 * @example
	 * ```ts
	 * FlowMatchStrict(ResultError({ tag: 'Failure', data: 1 }))
	 * 	.errorAny((result) => result.tag)
	 * ```
	 */
	public readonly errorAny: Match.WithStatus<K, 'error', R, L> = this._withStatus('error')

	/**
	 * Adds a fallback handler for any remaining result.
	 *
	 * @example
	 * ```ts
	 * FlowMatchLoose(ResultOk({ data: 1 }))
	 * 	.any((result) => result.status)
	 * ```
	 *
	 * @example
	 * ```ts
	 * FlowMatchStrict(ResultError({ tag: 'Failure' }))
	 * 	.any((result) => result.tag)
	 * ```
	 */
	public readonly any: Match.WithStatus<K, 'any', R, L> = this._withStatus('any')

	/**
	 * Resolves the chain through the concrete match mode.
	 *
	 * @template R1
	 * Result type returned by the resolver callback.
	 *
	 * @param cb
	 * Callback that receives whether a handler was missed and the resolved result.
	 *
	 * @returns
	 * Flow result returned by the concrete match mode.
	 */
	protected resolveResult<R1 extends ResultAny>(cb: (missmatch: boolean, result: ResultAny) => R1): FlowTrySync<R1> {
		const result = FlowTrySync(() => {
			if (this.store.usageError) return this.store.usageError

			const { status, tag } = this.inputResult
			const handler = this.store[status].get(tag) || this.store[`${status}Any`] || this.store.any

			const result = FlowTrySync(() => ResultOkFromUnlessError(handler ? handler(this.inputResult) : this.inputResult))
			return cb(!handler, result)
		})

		return result as FlowTrySync<R1>
	}

	/**
	 * Creates an isolated handler store for a new chain step.
	 *
	 * @param base
	 * Optional store to copy.
	 *
	 * @returns
	 * New mutable store for the next chain instance.
	 */
	private _createStore(base?: Match.Store): Match.Store {
		return {
			ok: new Map(base?.ok),
			error: new Map(base?.error),
			okAny: base?.okAny,
			errorAny: base?.errorAny,
			any: base?.any,
		}
	}

	/**
	 * Builds a tag-specific chain method.
	 *
	 * @template S
	 * Result status handled by the method.
	 *
	 * @param status
	 * Result status to match.
	 *
	 * @returns
	 * Chain method for tags under the given status.
	 */
	private _withTag <S extends Result.Status>(status: S): Match.WithTag<K, S, R, L> {
		return ((tags, handler) => {
			const store = this._createStore(this.store)
			if (!store.usageError) tags.some((tag) => {
				const alreadyExist = store[status].has(tag)
				if (alreadyExist) return store.usageError = UtilsErrorRuntime(`A handler is already defined for ${status}:${tag || 'null'}.`)
				else store[status].set(tag, handler as Match.Handler)
			})

			return new this.target(this.inputResult, store)
		}) as Match.WithTag<K, S, R, L>
	}

	/**
	 * Builds a status-wide or fallback chain method.
	 *
	 * @template S
	 * Status selector handled by the method.
	 *
	 * @param status
	 * Status selector to match.
	 *
	 * @returns
	 * Chain method for the requested status selector.
	 */
	private _withStatus <S extends Result.Status | 'any'>(status: S): Match.WithStatus<K, S, R, L> {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const prop = status === 'any' ? 'any' : `${status as Result.Status}Any` as const

		return ((handler: Match.Handler) => {
			const store = this._createStore(this.store)
			if (!store.usageError) {
				const alreadyExist = !!store[prop]
				if (alreadyExist) return store.usageError = UtilsErrorRuntime(`A handler is already defined for ${status}.`)
				else store[prop] = handler
			}

			return new this.target(this.inputResult, store)
		}) as Match.WithStatus<K, S, R, L>
	}
}
