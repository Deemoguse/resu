import { Result } from '../classes/result'
import type { Emitter } from '../classes/emitter'

/**
 * Registers an emitter for result construction events.
 * Listeners receive frozen `Result` copies sharing the original payloads.
 *
 * @param emmiter
 * Emitter instance to register.
 *
 * @example
 * ```ts
 * ResultEmittersAdd(emitter)
 * ResultOk({ data: 1 })
 * ```
 *
 * @example
 * ```ts
 * const off = emitter.on((result) => result.status)
 * ResultEmittersAdd(emitter)
 * ```
 */
export const ResultEmittersAdd: (emmiter: Emitter) => void = Result.addEmmiter.bind(Result)
