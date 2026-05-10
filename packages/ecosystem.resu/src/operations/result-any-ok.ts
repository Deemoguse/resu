import { Result } from '../classes/result'

export type ResultAnyOk = {} & Result<'ok', Result.AnyTag, Result.AnyData>
