import { describe, expect, it, vi } from 'vitest'
import { Flow, Result } from '../../src/namespaces/index'
import { expectErrorResult, expectOkResult, expectResult } from './helpers/result-assertions'

// Runtime tests also exercise JavaScript callers, including duplicate and
// out-of-order registrations rejected by the typed chain. Type contracts are
// checked separately in test/types/flow-match.test-d.ts.
type RuntimeMatch = {
	case: (status: 'ok' | 'error' | 'any', tagOrHandler: unknown, handler?: unknown) => RuntimeMatch
	result: (ignoreMismatch?: true) => Result.Any
}

const modes = [
	{ name: 'Loose', create: (input: Result.Any) => Flow.Match.Loose(input) as unknown as RuntimeMatch },
	{ name: 'Strict', create: (input: Result.Any) => Flow.Match.Strict(input) as unknown as RuntimeMatch },
]

const branches = [
	{ status: 'ok', make: Result.Ok },
	{ status: 'error', make: Result.Error },
] as const

describe.each(modes)('Flow.Match.$name', ({ create }) => {
	describe('tag cases', () => {
		describe.each(branches)('$status branch', ({ status, make }) => {
			it.each([
				{ label: 'single string tag', filter: 'Ready', tag: 'Ready' },
				{ label: 'tag array', filter: ['Ready'], tag: 'Ready' },
				{ label: 'single null tag', filter: null, tag: null },
				{ label: 'null tag array', filter: [null], tag: null },
				{ label: 'empty string tag', filter: '', tag: '' },
				{ label: 'multiple tags', filter: ['Cached', 'Ready'], tag: 'Ready' },
				{ label: 'mixed null and string tags', filter: [null, 'Ready'], tag: null },
			])('matches a $label', ({ filter, tag }) => {
				const input = make({ tag, data: 2 })
				const handler = vi.fn((current: Result.Any) => current.data)
				const chain = create(input).case(status, filter, handler)
				expect(handler).not.toHaveBeenCalled()
				expectOkResult(chain.result(), { tag: null, data: 2 })
				expect(handler).toHaveBeenCalledExactlyOnceWith(input)
			})

			it('does not call a tag handler for a different tag', () => {
				const handler = vi.fn(() => 'unexpected')
				create(make({ tag: 'Cached', data: 2 })).case(status, 'Ready', handler).result(true)
				expect(handler).not.toHaveBeenCalled()
			})

			it('does not call a tag handler for the opposite status', () => {
				const input = status === 'ok'
					? Result.Error({ tag: 'Ready', data: 2 })
					: Result.Ok({ tag: 'Ready', data: 2 })
				const handler = vi.fn(() => 'unexpected')
				create(input).case(status, ['Ready'], handler).result(true)
				expect(handler).not.toHaveBeenCalled()
			})

			it.each([
				{ label: 'single tag', tags: 'Ready', tag: 'Ready' },
				{ label: 'tag array', tags: ['Ready', 'Cached'], tag: 'Cached' },
				{ label: 'null tag', tags: null, tag: null },
			])('matches either status with any and a $label', ({ tags, tag }) => {
				const handler = vi.fn(() => 'handled')
				const input = make({ tag, data: 2 })
				const chain = create(input).case('any', tags, handler)
				expectOkResult(chain.result(), { tag: null, data: 'handled' })
				expect(handler).toHaveBeenCalledExactlyOnceWith(input)
			})
		})
	})

	describe('status cases and fallback', () => {
		it.each(branches)('handles every tag in the $status branch', ({ status, make }) => {
			const handler = vi.fn(() => 'handled')
			expectOkResult(create(make({ tag: 'Domain', data: 1 })).case(status, handler).result(), { tag: null, data: 'handled' })
			expect(handler).toHaveBeenCalledTimes(1)
		})

		it.each(branches)('uses the general fallback for $status results', ({ make }) => {
			expectOkResult(create(make({ data: 1 })).case('any', () => 'fallback').result(), { tag: null, data: 'fallback' })
		})

		it.each([
			{ label: 'tag, status, fallback', order: ['tag', 'status', 'fallback'] },
			{ label: 'fallback, status, tag', order: ['fallback', 'status', 'tag'] },
		])('prefers tag over status over fallback: $label', ({ order }) => {
			const input = Result.Ok({ tag: 'Ready', data: 1 })
			const tagHandler = vi.fn(() => 'tag')
			const statusHandler = vi.fn(() => 'status')
			const fallbackHandler = vi.fn(() => 'fallback')
			let chain = create(input)
			for (const kind of order) {
				if (kind === 'tag') chain = chain.case('ok', 'Ready', tagHandler)
				if (kind === 'status') chain = chain.case('ok', statusHandler)
				if (kind === 'fallback') chain = chain.case('any', fallbackHandler)
			}
			expectOkResult(chain.result(), { tag: null, data: 'tag' })
			expect(tagHandler).toHaveBeenCalledTimes(1)
			expect(statusHandler).not.toHaveBeenCalled()
			expect(fallbackHandler).not.toHaveBeenCalled()
		})

		it('prefers a status handler when no tag case matches', () => {
			const chain = create(Result.Error({ tag: 'Other', data: 1 }))
				.case('error', ['Failure'], () => 'tag')
				.case('any', () => 'fallback')
				.case('error', () => 'status')
			expectOkResult(chain.result(), { tag: null, data: 'status' })
		})
	})

	describe('handler output and evaluation', () => {
		it.each([0, false, '', null])('preserves a falsy handler value: %j', (data) => {
			expectOkResult(create(Result.Ok({ data: 1 })).case('any', () => data).result(), { tag: null, data })
		})

		it.each([
			{ source: Result.Ok({ tag: 'Recovered', data: { id: 1 } }) },
			{ source: Result.Error({ tag: 'DomainFailure', data: { id: 2 } }) },
		])('preserves a returned $source.status result without nesting', ({ source }) => {
			const result = create(Result.Ok({ data: 1 })).case('any', () => source).result()
			expectResult(result, { status: source.status, tag: source.tag, data: source.data })
			expect(result).not.toBe(source)
			expect(result.data).toBe(source.data)
		})

		it('wraps a handler exception into RuntimeError', () => {
			const error = new Error('handler failed')
			const result = create(Result.Ok({ data: 1 })).case('any', () => { throw error }).result()
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('does not suppress handler exceptions with result(true)', () => {
			const error = new Error('handler failed')
			const result = create(Result.Ok({ data: 1 })).case('any', () => { throw error }).result(true)
			expect(expectErrorResult(result, 'RuntimeError').data).toBe(error)
		})

		it('evaluates again on each result call', () => {
			const handler = vi.fn(() => 'handled')
			const chain = create(Result.Ok({ data: 1 })).case('any', handler)
			expect(chain.result()).not.toBe(chain.result())
			expect(handler).toHaveBeenCalledTimes(2)
		})
	})

	describe('chain isolation and duplicate registration', () => {
		it('keeps sibling tag chains independent', () => {
			const base = create(Result.Ok({ tag: 'Ready', data: 1 }))
			const first = base.case('ok', 'Ready', () => 'first')
			const second = base.case('ok', 'Ready', () => 'second')
			expect(first).not.toBe(base)
			expect(second).not.toBe(first)
			expectOkResult(first.result(), { tag: null, data: 'first' })
			expectOkResult(second.result(), { tag: null, data: 'second' })
			expectResult(base.result(true), { status: 'ok', tag: 'Ready', data: 1 })
		})

		it.each([
			{ label: 'tag', status: 'ok', tags: ['Ready'] },
			{ label: 'null tag', status: 'ok', tags: [null] },
			{ label: 'status handler', status: 'ok', tags: undefined },
			{ label: 'fallback', status: 'any', tags: undefined },
		] as const)('defers a duplicate $label error until evaluation', ({ status, tags }) => {
			const input = Result.Ok({ tag: tags?.[0] ?? null, data: 1 })
			const handler = vi.fn(() => 'handled')
			const base = tags ? create(input).case(status, [...tags], handler) : create(input).case(status, handler)
			const duplicate = tags ? base.case(status, [...tags], handler) : base.case(status, handler)
			expect(typeof duplicate.result).toBe('function')
			const result = duplicate.result()
			expect(expectErrorResult(result, 'RuntimeError').data).toBeInstanceOf(Error)
			expect(handler).not.toHaveBeenCalled()
			expectOkResult(base.result(), { tag: null, data: 'handled' })
		})

		it('detects duplicate tags within one registration', () => {
			const handler = vi.fn(() => 'handled')
			const chain = create(Result.Ok({ tag: 'Ready', data: 1 })).case('ok', ['Ready', 'Ready'], handler)
			expectErrorResult(chain.result(), 'RuntimeError')
			expect(handler).not.toHaveBeenCalled()
		})

		it('retains a usage error through later chain steps', () => {
			const chain = create(Result.Ok({ tag: 'Ready', data: 1 }))
				.case('ok', 'Ready', () => 'first')
				.case('ok', 'Ready', () => 'duplicate')
				.case('error', 'Failure', () => 'later')
			expectErrorResult(chain.result(true), 'RuntimeError')
		})

		it('allows the same tag for different statuses', () => {
			const chain = create(Result.Error({ tag: 'Shared', data: 1 }))
				.case('ok', 'Shared', () => 'ok')
				.case('error', 'Shared', () => 'error')
			expectOkResult(chain.result(), { tag: null, data: 'error' })
		})
	})
})

describe('unmatched results', () => {
	it.each(branches)('Loose preserves an unmatched $status result', ({ make, status }) => {
		const input = make({ tag: 'Domain', data: { id: 1 } })
		const result = Flow.Match.Loose(input).result()
		expectResult(result, { status, tag: 'Domain', data: input.data })
		expect(result).not.toBe(input)
		expect(result.data).toBe(input.data)
	})

	it.each(branches)('Strict reports an unmatched $status result', ({ make }) => {
		const chain = Flow.Match.Strict(make({ data: 1 })) as unknown as RuntimeMatch
		const error = expectErrorResult(chain.result(), 'RuntimeError').data as Error
		expect(error.message).toContain('Non-exhaustive match')
	})

	it.each(branches)('Strict result(true) preserves an unmatched $status result', ({ make, status }) => {
		const input = make({ tag: 'Domain', data: 1 })
		expectResult(Flow.Match.Strict(input).result(true), { status, tag: 'Domain', data: 1 })
	})
})
