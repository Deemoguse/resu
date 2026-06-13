import type { ResultError } from '../../src/operations/result-error'
import type { ResultOk } from '../../src/operations/result-ok'

export type ReadyResult<T> = ResultOk<'Ready', T>
export type FailureResult<T> = ResultError<'Failure', T>
export type OkResult<T> = ResultOk<null, T>
export type ErrorResult<T> = ResultError<null, T>
