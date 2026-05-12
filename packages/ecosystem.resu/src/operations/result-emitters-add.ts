import { Result } from '../classes/result'
import type { Emitter } from '../classes/emitter'

export const ResultEmittersAdd: (emmiter: Emitter) => void = Result.addEmmiter.bind(Result)
