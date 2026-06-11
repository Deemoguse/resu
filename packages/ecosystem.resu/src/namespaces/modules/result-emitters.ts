/**
 * Event-style dispatcher used by result emitter operations.
 */
export { Emitter } from '../../classes/emitter'

/**
 * Registers an emitter for result construction events.
 */
export { ResultEmittersAdd as Add } from '../../operations/result-emitters-add'

/**
 * Unregisters an emitter from result construction events.
 */
export { ResultEmittersDelete as Delete } from '../../operations/result-emitters-delete'
