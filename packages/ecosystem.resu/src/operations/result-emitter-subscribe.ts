import { Emitter } from '../classes/emitter'

/**
 * Subscribes to newly created results with `(result, unsubscribe)` callback arguments.
 * Delivery is synchronous and uses the original shallow-frozen result. Return
 * values are ignored and returned promises are not awaited or caught.
 *
 * Repeated registration of the same callback keeps one subscription. New
 * subscriptions during a delivery take effect on the next delivery. Synchronous
 * callback exceptions are logged through `console.error`; later callbacks continue.
 *
 * @param cb
 * Callback responsible for filtering results and managing its subscription.
 *
 * @returns
 * Idempotent function that removes the callback's current subscription, also
 * passed as its second argument. Earlier unsubscribe functions for the same
 * callback also remove a later registration.
 *
 * @example
 * ```ts
 * const off = ResultEmitterSubscribe((result, unsubscribe) => {
 * 	if (result.status !== 'error') return
 * 	unsubscribe()
 * 	console.error(result.data)
 * })
 * off()
 * ```
 */
export const ResultEmitterSubscribe = Emitter.subscribe.bind(Emitter)
