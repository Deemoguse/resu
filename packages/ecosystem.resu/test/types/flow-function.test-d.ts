import { expectError, expectType } from 'tsd'
import { FlowFunctionSync } from '../../src/operations/flow-function-sync'
import { FlowFunctionAsync } from '../../src/operations/flow-function-async'
import type { FlowTrySync } from '../../src/operations/flow-try-sync'
import type { FlowTryAsync } from '../../src/operations/flow-try-async'

const syncWrapped = FlowFunctionSync((input: string, count: number): number => input.length + count)
expectType<(input: string, count: number) => FlowTrySync<number>>(syncWrapped)

const asyncWrapped = FlowFunctionAsync(async (input: string): Promise<number> => input.length)
expectType<(input: string) => FlowTryAsync<number>>(asyncWrapped)

const asyncFromSyncWrapped = FlowFunctionAsync((input: string): number => input.length)
expectType<(input: string) => FlowTryAsync<number>>(asyncFromSyncWrapped)

expectError(FlowFunctionSync(async (): Promise<number> => 1))
expectError(FlowFunctionSync(() => undefined))
expectError(FlowFunctionAsync(async () => undefined))
