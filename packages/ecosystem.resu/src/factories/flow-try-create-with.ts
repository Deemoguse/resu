import { UtilsErrorAbort } from '../utils/utils-error-abort'
import { UtilsErrorRuntime } from '../utils/utils-error-runtime'
import { ResultOkFromUnlessError } from '../operations/result-ok-from-unless-error'
import type { ResultAny } from '../operations/result-any'
import type { FlowChecked } from '../operations/flow-checked'
import type { UtilsNonUndefinedSource } from '../utils/utils-non-undefined-source'

/**
 * Types for sync and async flow try helpers.
 */
export namespace FlowTryWith {
	/**
	 * Result union produced by a flow try operation.
	 *
	 * @template T
	 * Value returned by the try branch.
	 *
	 * @template C
	 * Value returned by the catch branch.
	 *
	 * @template S
	 * Whether abort signaling is required for the async operation.
	 */
	export type Return<
		T,
		C = never,
		S extends boolean = false,
	> =
		[T, C, S] extends [unknown, unknown, unknown]
			? FlowChecked<(S extends true ? UtilsErrorAbort : never) | ResultOkFromUnlessError<T | C>>
			: never

	/**
	 * Object-form sync operation accepted by flow try.
	 *
	 * @template T
	 * Value returned by the try branch.
	 *
	 * @template C
	 * Value returned by the catch branch.
	 */
	export type SyncBranches<
		T,
		C = never,
	> =
		[T, C] extends [unknown, unknown]
			? {
				/**
				 * Branch executed under synchronous flow try.
				 */
				try: () => UtilsNonUndefinedSource<T>
				/**
				 * Optional recovery branch for thrown errors.
				 */
				catch?: () => UtilsNonUndefinedSource<C>
			}
			: never

	/**
	 * Object-form async operation accepted by flow try.
	 *
	 * @template T
	 * Value returned by the try branch.
	 *
	 * @template C
	 * Value returned by the catch branch.
	 *
	 * @template S
	 * Whether an abort signal is required.
	 */
	export type AsyncBranches<
		T,
		C = never,
		S extends boolean = false,
	> =
		[T, C, S] extends [unknown, unknown, unknown]
			? S extends true ? {
				/**
				 * Required abort signal observed by the async operation.
				 */
				signal: AbortSignal
				/**
				 * Branch executed with the provided abort signal.
				 */
				try: (signal: AbortSignal) => UtilsNonUndefinedSource<T> | Promise<UtilsNonUndefinedSource<T>>
				/**
				 * Optional recovery branch for rejected or thrown errors.
				 */
				catch?: (error: unknown) => UtilsNonUndefinedSource<C> | Promise<UtilsNonUndefinedSource<C>>
			} : {
				/**
				 * Optional abort signal observed by the async operation.
				 */
				signal?: never
				/**
				 * Branch executed by async flow try.
				 */
				try:
					(() => Promise<UtilsNonUndefinedSource<T>>) |
					(() => UtilsNonUndefinedSource<T>)
				/**
				 * Optional recovery branch for rejected or thrown errors.
				 */
				catch?:
					((error: unknown) => Promise<UtilsNonUndefinedSource<C>>) |
					((error: unknown) => UtilsNonUndefinedSource<C>)
			}
			: never

	/**
	 * Runtime operation shape shared by sync and async implementations.
	 */
	export type Operations = (() => unknown) & {
		/**
		 * Optional signal used by async operations.
		 */
		signal?: AbortSignal
		/**
		 * Try branch callback.
		 */
		try?: (signal?: AbortSignal) => unknown
		/**
		 * Catch branch callback.
		 */
		catch?: (error: unknown) => unknown
	}
}

/**
 * Function type for sync or async flow try helpers.
 *
 * @template M
 * Flow try execution mode.
 */
export type FlowTryWith<
	M extends 'sync' | 'async',
> =
	[M] extends [unknown]
		? M extends 'sync' ? {
			/**
			 * Executes an object-form synchronous operation.
			 *
			 * @template T
			 * Value returned by the try branch.
			 *
			 * @template C
			 * Value returned by the catch branch.
			 *
			 * @param operation
			 * Sync operation branches.
			 *
			 * @returns
			 * Flow result for the operation.
			 */
			<T, C = never> (operation: FlowTryWith.SyncBranches<T, C>): FlowTryWith.Return<T, C>
			/**
			 * Executes a callback-form synchronous operation.
			 *
			 * @template T
			 * Value returned by the callback.
			 *
			 * @param operation
			 * Sync callback to execute.
			 *
			 * @returns
			 * Flow result for the callback.
			 */
			<T> (operation: () => UtilsNonUndefinedSource<T>): FlowTryWith.Return<T>
		} : {
			/**
			 * Executes an object-form async operation with a required abort signal.
			 *
			 * @template T
			 * Value returned by the try branch.
			 *
			 * @template C
			 * Value returned by the catch branch.
			 *
			 * @param operation
			 * Async operation branches with a required signal.
			 *
			 * @returns
			 * Promise resolving to a flow result for the operation.
			 */
			<T, C = never> (operation: FlowTryWith.AsyncBranches<T, C, true>): Promise<FlowTryWith.Return<T, C, true>>
			/**
			 * Executes an object-form async operation.
			 *
			 * @template T
			 * Value returned by the try branch.
			 *
			 * @template C
			 * Value returned by the catch branch.
			 *
			 * @param operation
			 * Async operation branches.
			 *
			 * @returns
			 * Promise resolving to a flow result for the operation.
			 */
			<T, C = never> (operation: FlowTryWith.AsyncBranches<T, C>): Promise<FlowTryWith.Return<T, C>>
			/**
			 * Executes a callback-form async operation.
			 *
			 * @template T
			 * Value returned by the callback.
			 *
			 * @param operation
			 * Async-capable callback to execute.
			 *
			 * @returns
			 * Promise resolving to a flow result for the callback.
			 */
			<T> (operation: () => Promise<UtilsNonUndefinedSource<T>>): Promise<FlowTryWith.Return<T>>
			/**
			 * Executes a callback-form sync operation.
			 *
			 * @template T
			 * Value returned by the callback.
			 *
			 * @param operation
			 * Sync-capable callback to execute.
			 *
			 * @returns
			 * Promise resolving to a flow result for the callback.
			 */
			<T> (operation: () => UtilsNonUndefinedSource<T>): Promise<FlowTryWith.Return<T>>
		}
		: never

/**
 * Creates a flow try helper for a sync or async execution mode.
 *
 * @template M
 * Flow try execution mode.
 *
 * @param mode
 * Execution mode to bind.
 *
 * @returns
 * Flow try function for the selected mode.
 *
 * @example
 * ```ts
 * const TrySync = FlowTryWith('sync')
 * const result = TrySync(() => 5)
 * ```
 *
 * @example
 * ```ts
 * const TryAsync = FlowTryWith('async')
 * const result = await TryAsync({ try: async () => 5, catch: () => 0 })
 * ```
 */
export function FlowTryWith<M extends 'sync' | 'async'>(mode: M): FlowTryWith<M> {
	return function (operation: FlowTryWith.Operations) {
		const tryFn = operation.try || operation
		const catchFn = operation.catch || UtilsErrorRuntime
		const signal = operation.signal

		if (mode === 'sync') {
			try { return ResultOkFromUnlessError(tryFn()) }
			catch (error) {
				try { return ResultOkFromUnlessError(catchFn(error)) }
				catch (error) { return UtilsErrorRuntime(error) }
			}
		}
		else if (signal?.aborted) {
			return UtilsErrorAbort()
		}
		else return new Promise<ResultAny>((res) => {
			const tryFnPromise = (signal?: AbortSignal) => promiseResultWrap(Promise.resolve(signal).then(tryFn))
			const catchFnPromise = (error?: unknown) => promiseResultWrap(Promise.resolve(error).then(catchFn)).catch(UtilsErrorRuntime)

			if (signal) {
				const abortPromise = createAbortPromise(signal)
				return res(Promise.race([
					abortPromise.promise,
					tryFnPromise(signal).catch(catchFnPromise).finally(abortPromise.cancel),
				]))
			}
			else {
				return res(tryFnPromise().catch(catchFnPromise))
			}
		})
	} as FlowTryWith<M>
}

/**
 * Wraps an awaited value into a result.
 *
 * @param value
 * Awaitable value to normalize.
 *
 * @returns
 * Promise resolving to a result.
 */
async function promiseResultWrap(value: unknown): Promise<ResultAny> {
	const res = await value
	return ResultOkFromUnlessError(res)
}

/**
 * Creates a cancellable abort result promise.
 *
 * @param signal
 * Signal to observe for aborts.
 *
 * @returns
 * Promise and cancellation callback for abort observation.
 */
function createAbortPromise(signal: AbortSignal): {
	promise: Promise<UtilsErrorAbort<null>>
	cancel: () => void
} {
	const internalAbort = new AbortController()
	return {
		promise: new Promise<UtilsErrorAbort<null>>((res) => {
			if (signal.aborted) return res(UtilsErrorAbort())

			const handler = () => res(UtilsErrorAbort())
			const options = { once: true, signal: internalAbort.signal }
			signal.addEventListener('abort', handler, options)
		}),
		cancel: () => internalAbort.abort(),
	}
}
