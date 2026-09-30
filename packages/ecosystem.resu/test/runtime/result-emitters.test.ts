import { describe, expect, it } from 'vitest'
import { Emitter } from '../../src/classes/emitter'
import { ResultEmittersAdd } from '../../src/operations/result-emitters-add'
import { ResultEmittersDelete } from '../../src/operations/result-emitters-delete'
import { ResultError } from '../../src/operations/result-error'
import { ResultOk } from '../../src/operations/result-ok'
import { expectErrorResult, expectOkResult } from './helpers/result-assertions'

function createEmitter(options: Emitter.Options = { emitOk: true, emitError: true }): Emitter {
	return new Emitter(options)
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

		ResultEmittersDelete(emitter)
	})

	it('uses explicit result emission as an override', () => {
		const emitter = createEmitter({ emitOk: false, emitError: false })
		const seen: unknown[] = []

		emitter.on((result) => seen.push(result))
		ResultEmittersAdd(emitter)

		ResultOk({ data: 'default' })
		ResultOk({ data: 'forced', emit: true })
		ResultError({ data: 'forced-error', emit: true })
		ResultError({ data: 'suppressed', emit: false })

		expect(seen).toHaveLength(2)
		expectOkResult(seen[0], { tag: null, data: 'forced' })
		expect(expectErrorResult(seen[1], null).data).toBe('forced-error')

		ResultEmittersDelete(emitter)
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

		emitter.emit(ResultOk({ data: 'manual' }))
		expect(seen).toHaveLength(1)
	})
})

describe('Emitter subscriptions', () => {
	it('returns an unsubscribe callback and supports handlers with the off argument', () => {
		const emitter = createEmitter({})
		const seen: unknown[] = []
		const handler = (result: Parameters<Emitter.Handler<'on'>>[0], off: () => void) => {
			seen.push(result)
			off()
		}

		const off = emitter.on(handler)
		emitter.emit(ResultOk({ data: 1 }))
		emitter.emit(ResultOk({ data: 2 }))

		expect(off).toBeTypeOf('function')
		expect(seen).toHaveLength(1)
		expectOkResult(seen[0], { tag: null, data: 1 })
	})

	it('removes all registered handlers', () => {
		const emitter = createEmitter({})
		const seen: unknown[] = []

		emitter.on((result) => seen.push(result))
		emitter.offAll()
		emitter.emit(ResultOk({ data: 1 }))

		expect(seen).toHaveLength(0)
	})
})
