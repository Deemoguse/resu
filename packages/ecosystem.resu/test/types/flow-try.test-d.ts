import { expectError, expectType } from 'tsd'
import { FlowTrySync } from '../../src/operations/flow-try-sync'
import { FlowTryAsync } from '../../src/operations/flow-try-async'
import type { AbortError } from '../../src/errors/abort-error'
import type { RuntimeError } from '../../src/errors/runtime-error'
import type { ResultError } from '../../src/operations/result-error'
import type { ResultOk } from '../../src/operations/result-ok'
import { ResultErrorFrom } from '../../src/operations/result-error-from'

const signal = new AbortController().signal
const failureTag = 'Failure' as const

expectType<FlowTrySync<number>>(FlowTrySync(() => 1 as number))
expectType<RuntimeError | ResultError<'Failure', number>>(FlowTrySync(() => ResultErrorFrom(1 as number, failureTag)))

expectType<FlowTryAsync<number>>(FlowTryAsync(() => 1 as number))
expectType<FlowTryAsync<number>>(FlowTryAsync(async () => 1 as number))
expectType<Promise<RuntimeError | AbortError | ResultOk<null, number>>>(FlowTryAsync({ signal, try: (currentSignal) => currentSignal.aborted ? 0 : 1 as number }),)

expectError(FlowTrySync(() => undefined))
expectError(FlowTryAsync(async () => undefined))
