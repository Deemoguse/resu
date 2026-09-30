import { Result } from '../classes/result'
import type { Emitter } from '../classes/emitter'

/**
 * Unregisters an emitter and removes all listeners attached to it.
 *
 * @param emmiter
 * Emitter instance to unregister and clear.
 *
 * @example
 * ```ts
 * ResultEmittersDelete(emitter)
 * ```
 *
 * @example
 * ```ts
 * ResultEmittersAdd(emitter)
 * ResultEmittersDelete(emitter)
 * ```
 */
export const ResultEmittersDelete: (emmiter: Emitter) => void = Result.deleteEmmiter.bind(Result)
