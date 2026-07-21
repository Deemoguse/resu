// @ts-check

import globals from 'globals'
import eslintJS from '@eslint/js'
import eslintTS from 'typescript-eslint'
import eslintStylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config'

/** @import { Config } from 'eslint/config' */

/**
 * @param {Parameters<typeof defineConfig>} args
 * @returns {Config[]}
 */
export function createConfig (...args) {
	return defineConfig([
		{
			ignores: [
				'dist/**/*',
				'*.config.*',
				'test/**/*',
				'*.test.*',
			],
		},

		eslintStylistic.configs.recommended,
		eslintJS.configs.recommended,
		eslintTS.configs.strictTypeChecked,
		{
			languageOptions: {
				parserOptions: {
					projectService: true,
				},
				globals: {
					...globals.browser,
					...globals.node,
				}
			},
			rules: {
				'@typescript-eslint/no-namespace': 'off',
				'@typescript-eslint/no-confusing-void-expression': 'off',
			}
		},

		{
			rules: {
				'@stylistic/brace-style': 'off',
				'@stylistic/max-statements-per-line': ['error', { "max": 3 }],
				'@stylistic/no-multi-spaces': 'off',
				'@stylistic/no-tabs': 'off',
				'@stylistic/indent': ['error', 'tab'],
				'@stylistic/indent-binary-ops': ['error', 'tab'],

				'@stylistic/semi': ['error', 'never'],
				'@stylistic/quotes': ['error', 'single'],

				'@stylistic/comma-dangle': ['error', 'always-multiline'],
				'@stylistic/comma-spacing': ['error', { 'before': false, 'after': true }],

				'@stylistic/arrow-parens': ['error', 'always'],
				'@stylistic/function-paren-newline': ['error', 'consistent'],
				'@stylistic/function-call-argument-newline': ['error', 'consistent'],

				'@stylistic/operator-linebreak': ['error', 'after', { 'overrides': { '?': 'before', ':': 'before', '&&': 'before', '||': 'before' }}],
			}
		},

		...args
	])
}
