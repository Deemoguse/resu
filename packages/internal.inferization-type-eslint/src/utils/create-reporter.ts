import type { TSESTree } from '@typescript-eslint/utils'
import type { TSESLint } from '@typescript-eslint/utils'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'

export type CreateReporter<
	M extends Record<string, null | Record<string, any>>,
> = <
	I extends keyof M,
>(params: {
	node: TSESTree.Node
	message: I
	messageData: M[I]
	fixed?: string | TSESLint.ReportFixFunction
}) => (
	void
)

export function CreateReporter<
	M extends Record<string, null | Record<string, any>>,
>(
	context: RuleContext<keyof M & string, any[]>,
	messages: object & { InferType: M },
): (
	CreateReporter<M>
) {
	void (messages)
	return (params) => context.report({
		messageId: params.message as string,
		node: params.node,
		data: params.messageData || {},
		fix: typeof params.fixed === 'string'
			? (fixer) => fixer.replaceText(params.node, params.fixed as string)
			: params.fixed,
	})
}
