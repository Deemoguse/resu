import { expectAssignable, expectError, expectType } from 'tsd'
import { ResultOk } from '../../src/operations/result-ok'
import { ResultError } from '../../src/operations/result-error'
import { FlowMatchStrict } from '../../src/operations/flow-match-strict'
import { FlowMatchLoose } from '../../src/operations/flow-match-loose'
import type { FlowTrySync } from '../../src/operations/flow-try-sync'

type Input =
	| ResultOk<'Ready', number>
	| ResultError<'Failure', string>

const input = Math.random() > 0.5
	? ResultOk({ tag: 'Ready', data: 1 as number })
	: ResultError({ tag: 'Failure', data: 'broken' })

const readyTags: ['Ready'] = ['Ready']
const failureTags: ['Failure'] = ['Failure']

const handledOk = FlowMatchLoose<never, Input>(input).ok(readyTags, (result) => {
	expectType<ResultOk<'Ready', number>>(result)
	return result.data.toString()
})
expectType<FlowMatchLoose<ResultOk<null, string>, ResultError<'Failure', string>>>(handledOk)
expectType<FlowTrySync<ResultOk<null, string> | ResultError<'Failure', string>>>(handledOk.result())
expectError(handledOk.ok(readyTags, () => 'again'))
expectError(FlowMatchLoose<never, Input>(input).ok(readyTags, () => undefined))

const fullyHandled = handledOk.error(failureTags, (result) => {
	expectType<ResultError<'Failure', string>>(result)
	return result.data.length
})
expectType<FlowMatchLoose<ResultOk<null, string> | ResultOk<null, number>, never>>(fullyHandled)
expectType<FlowTrySync<ResultOk<null, string> | ResultOk<null, number>>>(fullyHandled.result())
expectError(fullyHandled.error(failureTags, () => 1))

const handledAny = FlowMatchStrict<never, Input>(input).any((result) => result.status)
expectAssignable<FlowMatchStrict<ResultOk<null, 'ok' | 'error'>, never>>(handledAny)
expectAssignable<FlowTrySync<ResultOk<null, 'ok' | 'error'>>>(handledAny.result())
expectError(handledAny.any(() => 'again'))
expectError(FlowMatchStrict<never, Input>(input).any(() => undefined))
