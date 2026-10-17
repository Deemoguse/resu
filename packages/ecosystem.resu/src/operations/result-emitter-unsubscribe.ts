import { Emitter } from '../classes/emitter'

/**
 * Removes a result subscriber by its callback reference.
 * Unknown or already removed callbacks are ignored. A subscriber included in
 * an ongoing delivery still receives the current result after removal.
 *
 * @param callback
 * Exact function reference passed to the subscription operation.
 *
 * @example
 * ```ts
 * const callback: Emitter.SubscriberCallback = (result) => console.log(result.status)
 * Emitter.subscribe(callback)
 * ResultEmitterUnsubscribe(callback)
 * ```
 */
export const ResultEmitterUnsubscribe = Emitter.unsubscribe.bind(Emitter)
