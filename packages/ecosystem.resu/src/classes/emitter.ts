import type { ResultAny } from '../operations/result-any'

/**
 * Callback types for observing newly created results.
 */
export namespace Emitter {
	/**
	 * Receives the original shallow-frozen result and a function to unsubscribe.
	 * Return values are ignored; returned promises are not awaited or caught.
	 *
	 * @param result
	 * Newly created result, with its original payload reference.
	 *
	 * @param unsubscribe
	 * Idempotent function that removes the callback's current subscription.
	 */
	export type SubscriberCallback = (result: ResultAny, unsubscribe: () => void) => unknown
}

/**
 * Shared dispatcher for synchronous result creation events.
 * Prefer `Result.Emitter.Subscribe` and `Result.Emitter.Unsubscribe` in application code.
 *
 * Each delivery uses the subscribers present at its start. New subscriptions
 * take effect on the next delivery; removing a subscriber does not cancel a call
 * already included in the current delivery. Synchronous callback exceptions are
 * reported through `console.error` without preventing later callbacks from running.
 */
export const Emitter = Object.freeze({
	/**
	 * Internal callback registrations shared by the public subscription operations.
	 *
	 * @internal
	 */
	subscribers: new Map<Emitter.SubscriberCallback, (result: ResultAny) => void>(),

	/**
	 * Observes future results without replaying previously created results.
	 * Registering the same callback again keeps one subscription and supplies a new
	 * unsubscribe function. Any returned unsubscribe function for that callback
	 * removes its current registration, including a later registration.
	 *
	 * @param cb
	 * Callback responsible for filtering results and managing its subscription.
	 *
	 * @returns
	 * Idempotent unsubscribe function, also passed to the callback.
	 *
	 * @example
	 * ```ts
	 * const off = Emitter.subscribe((result, unsubscribe) => {
	 * 	if (result.status !== 'error') return
	 * 	unsubscribe()
	 * 	console.error(result.data)
	 * })
	 * off()
	 * ```
	 */
	subscribe(cb: Emitter.SubscriberCallback): () => void {
		const unsubscribe = () => this.unsubscribe(cb)
		this.subscribers.set(cb, (result) => cb(result, unsubscribe))
		return unsubscribe
	},

	/**
	 * Removes the callback's current subscription; unknown callbacks are ignored.
	 * A callback already included in an ongoing delivery still receives that result.
	 *
	 * @param callback
	 * Exact function reference used when subscribing.
	 */
	unsubscribe(callback: Emitter.SubscriberCallback) {
		this.subscribers.delete(callback)
	},

	/**
	 * Delivers a result synchronously to the subscribers present at delivery start.
	 * Does not create result wrappers. Results created by callbacks cause nested
	 * deliveries unless their construction explicitly uses `emit: false`.
	 *
	 * @param result
	 * Fully initialized, shallow-frozen result to deliver.
	 *
	 * @internal
	 */
	runSubscribers(result: ResultAny) {
		const iterator = this.subscribers.values()
		Array.from(iterator).forEach((handler) => {
			try { handler(result) }
			catch (error) { console.error('Result Emitter Subscriber Execution Error:', error) }
		})
	},
})
