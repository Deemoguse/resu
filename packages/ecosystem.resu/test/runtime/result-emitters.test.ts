import { describe, expect, it } from 'vitest'
import { Emitter } from '../../src/classes/emitter'
import { ResultEmittersAdd } from '../../src/operations/result-emitters-add'
import { ResultEmittersDelete } from '../../src/operations/result-emitters-delete'
import { ResultError } from '../../src/operations/result-error'
import { ResultOk } from '../../src/operations/result-ok'
import { expectErrorResult, expectOkResult } from './helpers/result-assertions'

const EmitterCtor = Emitter as unknown as new (options: {
	emitOk?: boolean
	emitError?: boolean
}) => Emitter

function createEmitter(options: { emitOk?: boolean, emitError?: boolean } = { emitOk: true, emitError: true }): Emitter {
	return new EmitterCtor(options)
}

describe('ResultEmittersAdd', () => {
	it('adds an emitter to the stack used for result events', () => {
		const emitter = createEmitter()
		const seen: unknown[] = []

		emitter.on((result) => {
			seen.push(result)
		})

		ResultEmittersAdd(emitter)

		ResultOk({ tag: 'Ready', data: 1 })
		ResultError({ tag: 'Failure', data: 'broken' })

		expect(seen).toHaveLength(2)
		expectOkResult(seen[0], { tag: 'Ready', data: 1 })
		expect(expectErrorResult(seen[1], 'Failure').data).toBe('broken')
	})
})

describe('ResultEmittersDelete', () => {
	it('removes an emitter from the stack used for result events', () => {
		const emitter = createEmitter()
		const seen: unknown[] = []

		emitter.on((result) => {
			seen.push(result)
		})

		ResultEmittersAdd(emitter)
		ResultOk({ tag: 'BeforeDelete', data: 1 })
		ResultEmittersDelete(emitter)
		ResultError({ tag: 'AfterDelete', data: 'should not emit' })

		expect(seen).toHaveLength(1)
		expectOkResult(seen[0], { tag: 'BeforeDelete', data: 1 })
	})
})
