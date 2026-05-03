import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'

const eslintDisableLineRegexp = /\beslint-disable-line\b/u
const eslintDisableNextLineRegexp = /\beslint-disable-next-line\b/u

function testSameLineDisableDirective(
	annotationNode: TSESTree.TypeNode,
	comment: TSESTree.Comment,
): (
	boolean
) {
	return comment.loc.start.line === annotationNode.loc.end.line
		&& eslintDisableLineRegexp.test(comment.value)
}

function testPreviousLineDisableDirective(
	annotationNode: TSESTree.TypeNode,
	comment: TSESTree.Comment,
): (
	boolean
) {
	return comment.loc.end.line === annotationNode.loc.start.line - 1
		&& eslintDisableNextLineRegexp.test(comment.value)
}

export function fixRequired(
	context: RuleContext<string, any>,
	parametersNode: TSESTree.TSTypeParameterDeclaration,
	annotationNode: TSESTree.TypeNode,
	patternType: 'any' | 'unknown',
): (
	TSESLint.ReportFixFunction
) {
	const parameterNames = parametersNode.params.map((node) => node.name.name)
	const annotationNodeSourceCode = context.sourceCode.getText(annotationNode)

	const extendsTupleElements = Array(parametersNode.params.length).fill(patternType)

	const fixedCode = `[${parameterNames.join(', ')}] extends [${extendsTupleElements.join(',')}]`
	const multilineFixedCode = `${fixedCode}\n` + `? ${annotationNodeSourceCode}\n` + ': never'

	const disableLineComment = context.sourceCode
		.getCommentsAfter(annotationNode)
		.find((comment) => testSameLineDisableDirective(annotationNode, comment))

	const disableNextLineComment = context.sourceCode
		.getCommentsBefore(annotationNode)
		.find((comment) => testPreviousLineDisableDirective(annotationNode, comment))

	return (fixer) => {
		if (disableLineComment) return fixer.replaceTextRange(
			[annotationNode.range[0], disableLineComment.range[1]],
			`${fixedCode}\n` + `? ${annotationNodeSourceCode} ${context.sourceCode.getText(disableLineComment)}\n` + ': never',
		)

		if (disableNextLineComment) return fixer.replaceTextRange(
			[disableNextLineComment.range[0], annotationNode.range[1]],
			`${fixedCode}\n` + `${context.sourceCode.getText(disableNextLineComment)}\n` + `? ${annotationNodeSourceCode}\n` + ': never',
		)

		return fixer.replaceText(annotationNode, multilineFixedCode)
	}
}
