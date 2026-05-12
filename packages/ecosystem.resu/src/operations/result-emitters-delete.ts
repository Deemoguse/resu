import { Result } from '../classes/result'
import type { Emitter } from '../classes/emitter'

export const ResultEmittersDelete: (emmiter: Emitter) => void = Result.deleteEmmiter.bind(Result)
