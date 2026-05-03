import { createRule } from './utils/create-rule'
import { JsonSchema } from './utils/json-schema'
import { MessageObject } from './utils/message-object'
import { CreateReporter } from './utils/create-reporter'
import { extractTupleFromConditionalNodes } from './processors/extract-conditional-tuple-nodes'
import { testConditionElseBranchReturnNever } from './processors/test-condition-else-branch-return-never'
import { testConditionType } from './processors/test-condition-types'
import { testTupleIncludeAllParameters } from './processors/test-tuple-include-all-parameters'
import { testOrderMustMatchGenericParameters } from './processors/test-order-must-match-generic-parameters'
import { testNotContainNonGenericTypes } from './processors/test-not-contain-non-generic-types'
import { testTupleMustNotContainDuplicateGenericTypes } from './processors/test-tuple-must-not-contain-duplicate-generic-types'
import { testPatternMustInferAllGenericTypeParameters } from './processors/test-pattern-must-infer-all-generic-type-parameters'
import { fixRequired } from './fixers/fix-required'
import type { ConfigObject, RuleDefinition } from '@eslint/core'

type Options = typeof Options.InferType
const Options = JsonSchema({
	type: 'object',
	properties: {
		enforceElseBranchMustReturnNever: { type: 'boolean', default: true },
		enforceTupleOrderMustMatchGenericParameters: { type: 'boolean', default: true },
		enforceTupleMustNotContainNonGenericTypes: { type: 'boolean', default: true },
		enforceTupleMustNotContainDuplicateGenericTypes: { type: 'boolean', default: true },
	},
})

type MessageData = typeof Message.InferType
type Message = keyof MessageData
const Message = MessageObject({
	required: 'Generic type alias should be wrapped into infer-based conditional type.',
	elseBranchMustReturnNever: 'The else branch must return never keyword.',
	tupleMustIncludeAllParameters: 'The tuple type must include all generic type parameters.',
	tupleOrderMustMatchGenericParameters: 'The order of the tuple type must match the order of generic type parameters.',
	tupleMustNotContainNonGenericTypes: 'The tuple type must not contain elements other than generic type parameters.',
	tupleMustNotContainDuplicateGenericTypes: 'The tuple type should not contain repeated parameters of the generic type.',
	tuplePatternMustInferAllGenericTypeParameters: 'The tuple pattern must cover all generic type parameters and infer each of them.',
})

const rule = createRule<[Options], Message>({
	name: 'inferization-type',
	meta: {
		type: 'suggestion',
		fixable: 'code',
		schema: [Options],
		messages: Message,
		docs: { description: 'Wrap generic type aliases into infer-based conditional type.' },
	},

	create(context) {
		const report = CreateReporter(context, Message)
		const userOptions = context.options[0] as undefined | Options
		const defaultOptions: Options = {
			enforceElseBranchMustReturnNever: userOptions?.enforceElseBranchMustReturnNever ?? true,
			enforceTupleOrderMustMatchGenericParameters: userOptions?.enforceTupleOrderMustMatchGenericParameters ?? true,
			enforceTupleMustNotContainNonGenericTypes: userOptions?.enforceTupleMustNotContainNonGenericTypes ?? true,
			enforceTupleMustNotContainDuplicateGenericTypes: userOptions?.enforceTupleMustNotContainNonGenericTypes ?? true,
		}

		return {
			TSTypeAliasDeclaration(node) {
				const parametersNode = node.typeParameters
				if (!parametersNode || !parametersNode.params.length) return

				const conditionNode = testConditionType(node.typeAnnotation)
				if (conditionNode.status === 'error') return report({
					node: node.typeAnnotation,
					message: 'required',
					messageData: null,
					fixed: fixRequired(context, parametersNode, node.typeAnnotation),
				})

				const tuples = extractTupleFromConditionalNodes(conditionNode.data)
				if (tuples.status === 'error') return report({
					node: node.typeAnnotation,
					message: 'required',
					messageData: null,
					fixed: fixRequired(context, parametersNode, node.typeAnnotation),
				})

				const checkTupleIncludeAllParameters = testTupleIncludeAllParameters(parametersNode, tuples.data.checkTupleNode)
				if (checkTupleIncludeAllParameters.status === 'error') report({
					node: tuples.data.checkTupleNode,
					message: 'tupleMustIncludeAllParameters',
					messageData: null,
				})

				const extendsTypleMustInferAllGenericTypeParameters = testPatternMustInferAllGenericTypeParameters(tuples.data.checkTupleNode, tuples.data.extendsTupleNode)
				if (extendsTypleMustInferAllGenericTypeParameters.status === 'error') report({
					node: tuples.data.extendsTupleNode,
					message: 'tuplePatternMustInferAllGenericTypeParameters',
					messageData: null,
				})

				if (defaultOptions.enforceTupleMustNotContainDuplicateGenericTypes) {
					const checkTupleNotContainDublicateGenericTypes = testTupleMustNotContainDuplicateGenericTypes(parametersNode, tuples.data.checkTupleNode)
					if (checkTupleNotContainDublicateGenericTypes.status === 'error') checkTupleNotContainDublicateGenericTypes.data.forEach((node) => {
						report({
							node: node,
							message: 'tupleMustNotContainDuplicateGenericTypes',
							messageData: null,
						})
					})
				}

				if (defaultOptions.enforceTupleOrderMustMatchGenericParameters) {
					const checkTupleOrderMustMatchGenericParameters = testOrderMustMatchGenericParameters(parametersNode, tuples.data.checkTupleNode)
					if (checkTupleOrderMustMatchGenericParameters.status === 'error') checkTupleOrderMustMatchGenericParameters.data.forEach((node) => {
						report({
							node: node,
							message: 'tupleOrderMustMatchGenericParameters',
							messageData: null,
						})
					})
				}

				if (defaultOptions.enforceTupleMustNotContainNonGenericTypes) {
					const checkTupleNotContainNonGenericTypes = testNotContainNonGenericTypes(parametersNode, tuples.data.checkTupleNode)
					if (checkTupleNotContainNonGenericTypes.status === 'error') checkTupleNotContainNonGenericTypes.data.forEach((node) => {
						report({
							node: node,
							message: 'tupleMustNotContainNonGenericTypes',
							messageData: null,
						})
					})
				}

				if (defaultOptions.enforceElseBranchMustReturnNever) {
					const conditionalBranchElseReturnNever = testConditionElseBranchReturnNever(conditionNode.data)
					if (conditionalBranchElseReturnNever.status === 'error') report({
						node: conditionNode.data.falseType,
						message: 'elseBranchMustReturnNever',
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
