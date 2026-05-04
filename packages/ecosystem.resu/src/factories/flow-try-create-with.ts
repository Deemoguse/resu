import { AbortError } from '../errors/abort-error'
import { RuntimeError } from '../errors/runtime-error'
import { OkFromUnlessError } from '../namespaces/result'
import type { ResultAny } from '../operations/result-any'
import type { NonUndefined } from '../types/non-undefined'

export namespace FlowTryCreateWith {
	export type Return<
		T,
		C = never,
		S extends boolean = false,
	> =
		[T, C, S] extends [unknown, unknown, unknown]
			? RuntimeError | (S extends true ? AbortError : never) | OkFromUnlessError<T | C>
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

export type FlowTryCreateWith<
	M extends 'sync' | 'async',
> =
	[M] extends [unknown]
		? M extends 'sync' ? {
			<T, C = never> (operation: FlowTryCreateWith.SyncBranches<T, C>): FlowTryCreateWith.Return<T, C>
			<T> (operation: () => NonUndefined<T>): FlowTryCreateWith.Return<T>
		} : {
			<T, C = never> (operation: FlowTryCreateWith.AsyncBranches<T, C, true>): FlowTryCreateWith.Return<T, C, true>
			<T, C = never> (operation: FlowTryCreateWith.AsyncBranches<T, C>): FlowTryCreateWith.Return<T, C>
			<T> (operation: () => Promise<NonUndefined<T>>): FlowTryCreateWith.Return<T>
		}
		: never

export function FlowTryCreateWith<M extends 'sync' | 'async'>(mode: M): FlowTryCreateWith<M> {
	return function (operation: FlowTryCreateWith.Operations) {
		const tryFn = operation.try || operation
		const catchFn = operation.catch || ((error) => error)
		const signal = operation.signal

		if (mode === 'sync') {
			try { return OkFromUnlessError(tryFn()) }
			catch (error) {
				try { return OkFromUnlessError(catchFn(error)) }
				catch (error) { return RuntimeError(error) }
			}
		}
		else if (signal?.aborted) {
			return AbortError()
		}
		else return new Promise<ResultAny>((res) => {
			const tryFnPromise = (signal?: AbortSignal) => promiseResultWrap(tryFn(signal))
			const catchFnPromise = (error?: AbortSignal) => promiseResultWrap(catchFn(error))

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
	} as FlowTryCreateWith<M>
}

async function promiseResultWrap(value: unknown): Promise<ResultAny> {
	try {
		const res = await Promise.resolve(value)
		return OkFromUnlessError(res) as ResultAny
	}
	catch (error) {
		return RuntimeError(error) as ResultAny
	}
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
