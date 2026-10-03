import { FlowTrySync } from '../operations/flow-try-sync'
import { UtilsErrorRuntime } from '../utils/utils-error-runtime'
import { ResultOkFromUnlessError } from '../operations/result-ok-from-unless-error'
import type { Result } from './result'
import type { ResultAny } from '../operations/result-any'
import type { ResultAnyError } from '../operations/result-any-error'
import type { ResultExclude } from '../operations/result-exclude'
import type { ResultExtract } from '../operations/result-extract'
import type { UtilsNonUndefinedSource } from '../utils/utils-non-undefined-source'
import type { UtilsNonAmptyArray } from '../utils/utils-non-empty-array'

type MATCH_DEFAULT_HANDLER = typeof MATCH_DEFAULT_HANDLER
const MATCH_DEFAULT_HANDLER = Symbol.for('__RESU_MATCH_DEFAULT_HANDLER__')

/**
 * Shared matching-chain types.
 */
export namespace Match {
	/**
	 * Concrete chain kind and its result state.
	 */
	export interface Kind {
		/**
		 * Accumulated handler outcomes.
		 */
		R: unknown
		/**
		 * Unmatched input variants.
		 */
		L: unknown
		/**
		 * Concrete chain instance.
		 */
		type: unknown
	}

	/**
	 * Constructor for a concrete chain kind.
	 *
	 * @template K
	 * Match kind that provides the concrete chain type.
	 */
	export type KindTarget<K extends Kind> =
		[K] extends [unknown]
			? new (...args: unknown[]) => K['type']
			: never

	/**
	 * Status selectors for cases and the general fallback.
	 */
	export type CaseStatus = 'any' | Result.Status

	/**
	 * Input variants covered by a case.
	 *
	 * @template R
	 * Result union to select from.
	 *
	 * @template S
	 * Status selector to apply.
	 *
	 * @template T
	 * Optional tag to select within that status.
	 */
	export type CaseExtractResult<
		R extends ResultAny,
		S extends CaseStatus,
		T extends Result.Tag = never,
	> =
		[R, S, T] extends [unknown, unknown, unknown]
			? S extends Result.Status
				? ResultExtract<R, S, T>
				: ResultExtract<R, Result.Status, T>
			: never

	/**
	 * Input variants left unmatched after a case.
	 *
	 * @template R
	 * Result union to filter.
	 *
	 * @template S
	 * Status selector to remove.
	 *
	 * @template T
	 * Optional tag to remove within that status.
	 */
	export type CaseExcludeResult<
		R extends ResultAny,
		S extends CaseStatus,
		T extends Result.Tag = never,
	> =
		[R, S, T] extends [unknown, unknown, unknown]
			? S extends Result.Status
				? ResultExclude<R, S, T>
				: ResultExclude<R, Result.Status, T>
			: never

	/**
	 * Tags available among unmatched variants of the selected status.
	 *
	 * @template L
	 * Remaining result union.
	 *
	 * @template S
	 * Status selector to inspect.
	 */
	export type CaseResultTags<
		L extends ResultAny,
		S extends CaseStatus,
	> =
		[L, S] extends [unknown, unknown]
			? CaseExtractResult<L, S>['tag']
			: never

	/**
	 * Synchronous handler for the input variants covered by a case.
	 *
	 * @template R
	 * Result union supplied to the handler.
	 *
	 * @template V
	 * Value returned by the handler.
	 *
	 * @template S
	 * Status selector applied to the result union.
	 *
	 * @template T
	 * Optional tag selector.
	 */
	export type CaseHandler<
		R extends ResultAny = ResultAny,
		V = unknown,
		S extends CaseStatus = CaseStatus,
		T extends Result.Tag = Result.Tag,
	> =
		[R, V, S, T] extends [unknown, unknown, unknown, unknown]
			? [R] extends [never]
				? never
				: (result: CaseExtractResult<R, S, T>) => UtilsNonUndefinedSource<V>
			: never

	/**
	 * Chain state after a case, with accumulated outcomes and unmatched variants.
	 *
	 * @template K
	 * Match kind used to reconstruct the concrete chain type.
	 *
	 * @template L
	 * Remaining result union before this case.
	 *
	 * @template R
	 * Result union already produced by earlier handlers.
	 *
	 * @template V
	 * Value returned by this handler.
	 *
	 * @template S
	 * Status selector handled by this case.
	 *
	 * @template T
	 * Optional tag selector handled by this case.
	 */
	export type CaseResult<
		K extends Kind,
		L extends ResultAny,
		R extends ResultAny,
		V,
		S extends CaseStatus,
		T extends Result.Tag = never,
	> =
		[K, L, R, V, S, T] extends [unknown, unknown, unknown, unknown, unknown, unknown]
			? (K & {
				R: R | ResultOkFromUnlessError<V>
				L: CaseExcludeResult<L, S, T> })['type']
			: never

	/** Registered cases and deferred usage error. */
	export interface StoreMap extends Map<string, unknown> {
		has(key: 'runtimeError' | CaseStatus): boolean

		get(key: 'runtimeError'): undefined | ResultAnyError
		set(key: 'runtimeError', value: undefined | ResultAnyError): this

		get(key: CaseStatus): undefined | Map<MATCH_DEFAULT_HANDLER | Result.Tag, CaseHandler>
		set(key: CaseStatus, value: Map<MATCH_DEFAULT_HANDLER | Result.Tag, CaseHandler>): this
	}
}

/**
 * Shared base for immutable loose and strict matching chains.
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
 * 	.case('ok', ['Ready'], (current) => current.data + 1)
 * 	.result()
 * ```
 *
 * @example
 * ```ts
 * const result = FlowMatchStrict(ResultError({ tag: 'Failure', data: 'broken' }))
 * 	.case('error', ['Failure'], (current) => current.data)
 * 	.result()
 * ```
 */
export abstract class Match<
	R extends ResultAny = never,
	L extends ResultAny = never,
	K extends Match.Kind = Match.Kind,
> {
	/**
	 * Original input shared by derived chains.
	 */
	protected readonly inputResult: L

	/**
	 * Registered cases and deferred usage error.
	 */
	protected readonly store: Match.StoreMap

	/**
	 * Constructor for the concrete chain kind.
	 */
	protected readonly target: Match.KindTarget<K>

	/**
	 * Initial state for a concrete matching mode.
	 *
	 * @param target
	 * Concrete match constructor used for chained calls.
	 *
	 * @param result
	 * Result value to match.
	 *
	 * @param baseStore
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
		baseStore?: Match.StoreMap,
	) {
		this.target = target
		this.store = baseStore || this._createStore()
		this.inputResult = result
	}

	/**
	 * Tag-specific case for `ok` or `error`.
	 * Duplicate registrations produce `RuntimeError` at evaluation.
	 *
	 * @param status
	 * Concrete result status to handle: `ok` or `error`.
	 *
	 * @param tag
	 * One tag or a non-empty list of tags; use `null` for an untagged result.
	 *
	 * @param handler
	 * Synchronous callback evaluated by `result()`. Plain values become `ok`;
	 * explicit results preserve their status, tag, and data.
	 *
	 * @returns
	 * New chain; the current chain and sibling chains remain unchanged.
	 */
	public case<
		S extends Result.Status,
		T extends Match.CaseResultTags<L, S>,
		V = never,
	>(
		status: S,
		tag: T | UtilsNonAmptyArray<T>,
		handler: Match.CaseHandler<L, V, S, T>
	): (
		Match.CaseResult<K, L, R, V, S, T>
	)

	/**
	 * Status-wide case or general `any` fallback.
	 * Duplicate registrations produce `RuntimeError` at evaluation.
	 *
	 * @param status
	 * Status to handle, or `any` for both result statuses.
	 *
	 * @param handler
	 * Synchronous callback invoked with the input result when this case is
	 * selected. Exceptions become `RuntimeError`.
	 *
	 * @returns
	 * New chain; handlers are not evaluated during registration.
	 */
	public case<
		S extends Match.CaseStatus,
		V = never,
	>(
		status: S,
		handler: Match.CaseHandler<L, V, S>
	): (
		Match.CaseResult<K, L, R, V, S>
	)

	/**
	 * Shared case registration with deferred usage errors.
	 *
	 * @param status
	 * Result status to handle, or `any` to handle either status.
	 *
	 * @param tagOrHandler
	 * Tag selector, or a synchronous callback for all remaining variants under
	 * the selected status.
	 *
	 * @param optionalHandler
	 * Callback required when a tag selector is supplied.
	 *
	 * @returns
	 * New chain containing the case or a deferred registration error.
	 */
	public case<
		S extends Match.CaseStatus,
		T extends Match.CaseResultTags<L, S>,
		V = never,
	>(
		status: Match.CaseStatus,
		tagOrHandler: T | UtilsNonAmptyArray<T> | Match.CaseHandler<L, V, S>,
		optionalHandler?: Match.CaseHandler<L, V, S, T>,
	): (
		Match.CaseResult<K, L, R, V, S>
	) {
		const store = this._createStore(this.store)
		const storeContainError = store.has('runtimeError')
		if (storeContainError) return new this.target(this.inputResult, store)

		const storeRecord = store.get(status)
		if (!storeRecord) {
			store.set('runtimeError', UtilsErrorRuntime('Invalid status. The following statuses are allowed: "any", "ok", or "error".'))
		}
		else {
			const tags = typeof tagOrHandler === 'function' ? [MATCH_DEFAULT_HANDLER] as const : Array.isArray(tagOrHandler) ? tagOrHandler : [tagOrHandler]
			const handler = typeof tagOrHandler === 'function' ? tagOrHandler : optionalHandler as Match.CaseHandler<L, V, S, T>

			for (const tag of tags) {
				const alreadyDefined = storeRecord.has(tag)
				if (alreadyDefined) store.set('runtimeError', UtilsErrorRuntime(`A handler is already defined for the status "${status}" ${tag === MATCH_DEFAULT_HANDLER ? '' : tag || 'null'}.`))
				else storeRecord.set(tag, handler as unknown as Match.CaseHandler)
			}
		}

		return new this.target(this.inputResult, store)
	}

	/**
	 * Isolated store for a derived chain.
	 *
	 * @param base
	 * Optional store to copy.
	 *
	 * @returns
	 * New mutable store for the next chain instance.
	 */
	private _createStore(base?: Match.StoreMap): Match.StoreMap {
		const clonedStore = new Map() as Match.StoreMap

		for (const status of ['any', 'ok', 'error'] as const) {
			clonedStore.set(status, new Map(base?.get(status)))
		}

		const runtimeError = base?.get('runtimeError')
		if (runtimeError) {
			clonedStore.set('runtimeError', runtimeError)
		}

		return clonedStore
	}

	/**
	 * Shared evaluation with mode-specific unmatched-input handling.
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
		const result = FlowTrySync((): ResultAny => {
			const usageError = this.store.get('runtimeError')
			if (usageError) return usageError

			const { status, tag } = this.inputResult
			const handlerByStatusAndTag = this.store.get(status)?.get(tag) || this.store.get(status)?.get(MATCH_DEFAULT_HANDLER)
			const handlerFallback = this.store.get('any')?.get(tag) || this.store.get('any')?.get(MATCH_DEFAULT_HANDLER)
			const handler = handlerByStatusAndTag || handlerFallback

			const result = FlowTrySync(() => ResultOkFromUnlessError(handler ? handler(this.inputResult) : this.inputResult))
			return cb(!handler, result) as ResultAny // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
		})

		return result as FlowTrySync<R1>
	}
}
