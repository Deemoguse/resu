import { ESLintUtils } from '@typescript-eslint/utils'

export const createRule: ReturnType<typeof ESLintUtils.RuleCreator> = ESLintUtils.RuleCreator((name) => `internal/${name}`)
