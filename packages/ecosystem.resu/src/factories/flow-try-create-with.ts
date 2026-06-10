import { AbortError } from '../errors/abort-error'
import { RuntimeError } from '../errors/runtime-error'
import { ResultOkFromUnlessError } from '../operations/result-ok-from-unless-error'
import type { ResultAny } from '../operations/result-any'
import type { NonUndefined } from '../types/non-undefined'

export namespace FlowTryWith {
	export type Return<
		T,
		C = never,
		S extends boolean = false,
	> =
		[T, C, S] extends [unknown, unknown, unknown]
			? RuntimeError | (S extends true ? AbortError : never) | ResultOkFromUnlessError<T | C>
			: never

	export type SyncBranches<
		T,
		C = never,
	> =
		[T, C] extends [unknown, unknown]
			? {
				try: () => NonUndefined<T>
				catch?: () => NonUndefined<C>
			}
			: never

	export type AsyncBranches<
		T,
		C = never,
		S extends boolean = false,
	> =
		[T, C, S] extends [unknown, unknown, unknown]
			? S extends true ? {
				signal: AbortSignal
				try: (signal: AbortSignal) => NonUndefined<T> | Promise<NonUndefined<T>>
				catch?: (error: unknown) => NonUndefined<C> | Promise<NonUndefined<C>>
			} : {
				signal?: AbortSignal
				try: () => NonUndefined<T> | Promise<NonUndefined<T>>
				catch?: (error: unknown) => NonUndefined<C> | Promise<NonUndefined<C>>
			}
			: never

	export type Operations = (() => unknown) & {
		signal?: AbortSignal
		try?: (signal?: AbortSignal) => unknown
		catch?: (error: unknown) => unknown
	}
}

export type FlowTryWith<
	M extends 'sync' | 'async',
> =
	[M] extends [unknown]
		? M extends 'sync' ? {
			<T, C = never> (operation: FlowTryWith.SyncBranches<T, C>): FlowTryWith.Return<T, C>
			<T> (operation: () => NonUndefined<T>): FlowTryWith.Return<T>
		} : {
			<T, C = never> (operation: FlowTryWith.AsyncBranches<T, C, true>): Promise<FlowTryWith.Return<T, C, true>>
			<T, C = never> (operation: FlowTryWith.AsyncBranches<T, C>): Promise<FlowTryWith.Return<T, C>>
			<T> (operation: () => NonUndefined<T> | Promise<NonUndefined<T>>): Promise<FlowTryWith.Return<T>>
		}
		: never

export function FlowTryWith<M extends 'sync' | 'async'>(mode: M): FlowTryWith<M> {
	return function (operation: FlowTryWith.Operations) {
		const tryFn = operation.try || operation
		const catchFn = operation.catch || RuntimeError
		const signal = operation.signal

		if (mode === 'sync') {
			try { return ResultOkFromUnlessError(tryFn()) }
			catch (error) {
				try { return ResultOkFromUnlessError(catchFn(error)) }
				catch (error) { return RuntimeError(error) }
			}
		}
		else if (signal?.aborted) {
			return AbortError()
		}
		else return new Promise<ResultAny>((res) => {
			const tryFnPromise = (signal?: AbortSignal) => promiseResultWrap(Promise.resolve(signal).then(tryFn))
			const catchFnPromise = (error?: unknown) => promiseResultWrap(Promise.resolve(error).then(catchFn)).catch(RuntimeError)

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

async function promiseResultWrap(value: unknown): Promise<ResultAny> {
	const res = await value
	return ResultOkFromUnlessError(res)
}

function createAbortPromise(signal: AbortSignal): {
	promise: Promise<AbortError<null>>
	cancel: () => void
} {
	const internalAbort = new AbortController()
	return {
		promise: new Promise<AbortError<null>>((res) => {
			if (signal.aborted) return res(AbortError())

			const handler = () => res(AbortError())
			const options = { once: true, signal: internalAbort.signal }
			signal.addEventListener('abort', handler, options)
		}),
		cancel: () => internalAbort.abort(),
	}
}
