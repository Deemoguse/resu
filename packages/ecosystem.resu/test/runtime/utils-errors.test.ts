import { describe, expect, it } from 'vitest'
import { Result, Utils } from '../../src/namespaces/index'
import { expectResult } from './helpers/result-assertions'

describe.each([
	{ name: 'Utils.RuntimeError', create: (data?: unknown) => Utils.RuntimeError<unknown>(data), tag: 'RuntimeError' },
	{ name: 'Utils.AbortError', create: (data?: unknown) => Utils.AbortError<unknown>(data), tag: 'AbortError' },
] as const)('$name', ({ create, tag }) => {
	it('defaults an omitted payload to null', () => {
		expectResult(create(), { status: 'error', tag, data: null })
	})

	it.each(['failed', ''])('converts message %j into an Error', (message) => {
		const result = create(message)
		expect(result.status).toBe('error')
		expect(result.tag).toBe(tag)
		expect(result.data).toBeInstanceOf(Error)
		expect((result.data as Error).message).toBe(message)
	})

	it.each([0, false, null, { code: 'FAILURE' }, new Error('original')])('keeps a custom payload: %j', (data) => {
		const result = create(data)
		expectResult(result, { status: 'error', tag, data })
		expect(result.data).toBe(data)
	})

	it('replaces a source result tag and keeps its payload', () => {
		const source = Result.Ok({ tag: 'Source', data: { id: 1 } })
		const result = create(source)
		expectResult(result, { status: 'error', tag, data: source.data })
		expect(result).not.toBe(source)
		expect(result.data).toBe(source.data)
	})
})
