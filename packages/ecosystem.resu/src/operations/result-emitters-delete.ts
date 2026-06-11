import { Result } from '../classes/result'
import type { Emitter } from '../classes/emitter'

/**
 * Unregisters an emitter from result construction events.
 *
 * @param emmiter
 * Emitter instance to unregister.
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
