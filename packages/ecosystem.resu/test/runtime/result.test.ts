import { describe, expect, it } from 'vitest'
import { Result } from '../../src/namespaces/index'
import { expectResult } from './helpers/result-assertions'

const constructors = [
	{ name: 'Result.Ok', create: Result.Ok, status: 'ok' },
	{ name: 'Result.Error', create: Result.Error, status: 'error' },
] as const

describe.each(constructors)('$name', ({ create, status }) => {
	describe('defaults and payloads', () => {
		it('defaults omitted fields to null', () => {
			expectResult(create(), { status, tag: null, data: null })
			expectResult(create({}), { status, tag: null, data: null })
			expectResult(create({ tag: undefined, data: undefined }), { status, tag: null, data: null })
		})

		it.each([
			{ label: 'zero', data: 0 },
			{ label: 'false', data: false },
			{ label: 'empty string', data: '' },
			{ label: 'null', data: null },
			{ label: 'object', data: { id: 1 } },
			{ label: 'array', data: [1, 2] },
		])('preserves $label payloads', ({ data }) => {
			const result = create<'Ready', unknown>({ tag: 'Ready', data })
			expectResult(result, { status, tag: 'Ready', data })
			expect(result.data).toBe(data)
		})

		it('preserves an empty tag', () => {
			expectResult(create({ tag: '', data: 1 }), { status, tag: '', data: 1 })
		})
	})

	describe('immutability', () => {
		it('freezes the result fields', () => {
			const result = create({ tag: 'Ready', data: 1 })
			expect(Object.isFrozen(result)).toBe(true)
			expect(Reflect.set(result, 'tag', 'Changed')).toBe(false)
			expect(Reflect.set(result, 'data', 2)).toBe(false)
			expect(Reflect.set(result, 'status', status === 'ok' ? 'error' : 'ok')).toBe(false)
			expectResult(result, { status, tag: 'Ready', data: 1 })
		})

		it('keeps payload identity without freezing the payload', () => {
			const data = { count: 1 }
			const result = create({ data })
			data.count = 2
			expect(result.data).toBe(data)
			expect(result.data.count).toBe(2)
			expect(Object.isFrozen(data)).toBe(false)
		})

		it('creates independent containers on repeated calls', () => {
			expect(create({ data: 1 })).not.toBe(create({ data: 1 }))
		})
	})
})

describe.each([
	{ name: 'Result.OkFrom', convert: Result.OkFrom, status: 'ok' },
	{ name: 'Result.ErrorFrom', convert: Result.ErrorFrom, status: 'error' },
] as const)('$name', ({ convert, status }) => {
	it.each([0, false, '', null, { count: 2 }])('wraps a plain value: %j', (data) => {
		expectResult(convert(data), { status, tag: null, data })
	})

	it('wraps a lookalike object as data', () => {
		const data = { status: 'error', tag: 'Lookalike', data: 1 }
		expect(convert(data).data).toBe(data)
	})

	describe.each(constructors)('converting $name', ({ create }) => {
		it('preserves tag and payload in a new frozen container', () => {
			const data = { count: 2 }
			const source = create({ tag: 'Source', data })
			const result = convert(source)
			expectResult(result, { status, tag: 'Source', data })
			expect(result).not.toBe(source)
			expect(result.data).toBe(data)
			expect(Object.isFrozen(result)).toBe(true)
		})

		it.each(['Override', '', null])('replaces the tag with %j', (tag) => {
			const source = create({ tag: 'Source', data: 2 })
			expectResult(convert(source, tag), { status, tag, data: 2 })
			expect(source.tag).toBe('Source')
		})
	})
})

describe.each([
	{ name: 'Result.OkFromUnlessError', convert: Result.OkFromUnlessError, status: 'ok' },
	{ name: 'Result.ErrorFromUnlessOk', convert: Result.ErrorFromUnlessOk, status: 'error' },
] as const)('$name', ({ convert, status }) => {
	it('wraps a plain value using the requested status', () => {
		expectResult(convert(0, 'Converted'), { status, tag: 'Converted', data: 0 })
	})

	it('applies the tag override when the input has the requested status', () => {
		const source = status === 'ok'
			? Result.Ok({ tag: 'Source', data: 2 })
			: Result.Error({ tag: 'Source', data: 2 })
		const result = convert(source, null)
		expectResult(result, { status, tag: null, data: 2 })
		expect(result).not.toBe(source)
	})

	it('preserves the opposite status and ignores the supplied tag', () => {
		const source = status === 'ok'
			? Result.Error({ tag: 'Failure', data: { id: 1 } })
			: Result.Ok({ tag: 'Ready', data: { id: 1 } })
		const result = convert(source, 'Ignored')
		expectResult(result, { status: source.status, tag: source.tag, data: source.data })
		expect(result).not.toBe(source)
		expect(result.data).toBe(source.data)
	})
})

describe('Result guards', () => {
	it.each([
		{ name: 'ok', create: Result.Ok, isOk: true, isError: false },
		{ name: 'error', create: Result.Error, isOk: false, isError: true },
	])('recognizes the $name branch', ({ create, isOk, isError }) => {
		const result = create({ tag: 'Domain', data: 1 })
		expect(Result.Is(result)).toBe(true)
		expect(Result.IsOk(result)).toBe(isOk)
		expect(Result.IsError(result)).toBe(isError)
	})

	it.each([
		{ label: 'undefined', value: undefined },
		{ label: 'null', value: null },
		{ label: 'number', value: 0 },
		{ label: 'string', value: 'ok' },
		{ label: 'boolean', value: false },
		{ label: 'array', value: [] },
		{ label: 'plain object', value: {} },
		{ label: 'lookalike', value: { status: 'ok', tag: 'Ready', data: 1 } },
		{ label: 'serialized result', value: JSON.parse(JSON.stringify(Result.Ok({ data: 1 }))) as unknown },
	])('rejects $label values', ({ value }) => {
		expect(Result.Is(value)).toBe(false)
		expect(Result.IsOk(value)).toBe(false)
		expect(Result.IsError(value)).toBe(false)
	})
})
