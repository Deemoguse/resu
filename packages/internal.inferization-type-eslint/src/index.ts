import { createRule } from './utils/create-rule'
import { JsonSchema } from './utils/json-schema'
import { MessageObject } from './utils/message-object'
import { CreateReporter } from './utils/create-reporter'
import { extractTuples } from './processors/extract-tuples'
import { testElseNever } from './processors/test-else-never'
import { testCondition } from './processors/test-condition'
import { testAllParams } from './processors/test-all-params'
import { testTupleOrder } from './processors/test-tuple-order'
import { testOnlyParams } from './processors/test-only-params'
import { testUniqueParams } from './processors/test-unique-params'
import { testPattern } from './processors/test-pattern'
import { fixRequired } from './fixers/fix-required'
import type { ConfigObject, RuleDefinition } from '@eslint/core'

type Options = typeof Options.InferType
const Options = JsonSchema({
	type: 'object',
	properties: {
		enforceElseNever: {
			type: 'boolean',
		},
		enforceTupleOrder: {
			type: 'boolean',
		},
		enforceOnlyParams: {
			type: 'boolean',
		},
		enforceUniqueParams: {
			type: 'boolean',
		},
		enforcePattern: {
			type: 'object',
			properties: {
				enable: { type: 'boolean' },
				type: { type: 'string', pattern: 'any|unknown' },
			},
		},
	},
})

type MessageData = typeof Message.InferType
type Message = keyof MessageData
const Message = MessageObject({
	required: 'Generic type alias should be wrapped into conditional type.',
	elseNever: 'The else branch must return never keyword.',
	tupleAllParams: 'The tuple type must include all generic type parameters.',
	tupleOrder: 'The order of the tuple type must match the order of generic type parameters.',
	tupleOnlyParams: 'The tuple type must not contain elements other than generic type parameters.',
	tupleUniqueParams: 'The tuple type should not contain repeated parameters of the generic type.',
	pattern: 'The extends tuple pattern must cover all generic type parameters, and each corresponding element must be {{type}}',
})

const rule = createRule<Options[], Message>({
	name: 'inferization-type',
	meta: {
		type: 'suggestion',
		fixable: 'code',
		schema: [Options],
		messages: Message,
		docs: { description: 'Wrap generic type aliases into conditional type.' },
	},

	create(context) {
		const report = CreateReporter(context, Message)
		const userOptions = context.options[0]
		const defaultOptions = {
			enforceElseNever: userOptions?.enforceElseNever ?? true,
			enforceTupleOrder: userOptions?.enforceTupleOrder ?? true,
			enforceOnlyParams: userOptions?.enforceOnlyParams ?? true,
			enforceUniqueParams: userOptions?.enforceUniqueParams ?? true,
			enforcePattern: {
				enable: userOptions?.enforcePattern?.enable ?? true,
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
				type: (userOptions?.enforcePattern?.type || 'unknown') as 'any' | 'unknown',
			},
		} satisfies Required<Options>

		return {
			TSTypeAliasDeclaration(node) {
				const paramsNode = node.typeParameters
				if (!paramsNode || !paramsNode.params.length) return

				const patternType = defaultOptions.enforcePattern.type

				const condition = testCondition(node.typeAnnotation)
				if (condition.status === 'error') return report({
					node: node.typeAnnotation,
					message: 'required',
					messageData: null,
					fixed: fixRequired(context, paramsNode, node.typeAnnotation, patternType),
				})

				const tuples = extractTuples(condition.data)
				if (tuples.status === 'error') return report({
					node: node.typeAnnotation,
					message: 'required',
					messageData: null,
					fixed: fixRequired(context, paramsNode, node.typeAnnotation, patternType),
				})

				const hasAllParams = testAllParams(paramsNode, tuples.data.checkTuple)
				if (hasAllParams.status === 'error') report({
					node: tuples.data.checkTuple,
					message: 'tupleAllParams',
					messageData: null,
				})

				const patternIsValid = testPattern(tuples.data.checkTuple, tuples.data.extendsTuple, patternType)
				if (defaultOptions.enforcePattern.enable && patternIsValid.status === 'error') report({
					node: tuples.data.extendsTuple,
					message: 'pattern',
					messageData: {
						type: patternType,
					},
				})

				if (defaultOptions.enforceUniqueParams) {
					const hasDuplicates = testUniqueParams(paramsNode, tuples.data.checkTuple)
					if (hasDuplicates.status === 'error') hasDuplicates.data.forEach((node) => {
						report({
							node: node,
							message: 'tupleUniqueParams',
							messageData: null,
						})
					})
				}

				if (defaultOptions.enforceTupleOrder) {
					const orderMatches = testTupleOrder(paramsNode, tuples.data.checkTuple)
					if (orderMatches.status === 'error') orderMatches.data.forEach((node) => {
						report({
							node: node,
							message: 'tupleOrder',
							messageData: null,
						})
					})
				}

				if (defaultOptions.enforceOnlyParams) {
					const onlyParams = testOnlyParams(paramsNode, tuples.data.checkTuple)
					if (onlyParams.status === 'error') onlyParams.data.forEach((node) => {
						report({
							node: node,
							message: 'tupleOnlyParams',
							messageData: null,
						})
					})
				}

				if (defaultOptions.enforceElseNever) {
					const elseIsNever = testElseNever(condition.data)
					if (elseIsNever.status === 'error') report({
						node: condition.data.falseType,
						message: 'elseNever',
						messageData: null,
					})
				}
			},
		}
	},
})

export default {
	configs: {
		recommendedTypeChecked: {
			plugins: {
				'@internal': {
					rules: {
						'inferization-type': rule as unknown as RuleDefinition,
					},
				},
			},
			rules: {
				'@internal/inferization-type': 'error',
			},
		},
	},
} as {
	readonly configs: {
		readonly recommendedTypeChecked: ConfigObject
	}
}
