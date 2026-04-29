// @ts-check

import globals from 'globals'
import eslintJS from '@eslint/js'
import eslintTS from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

/** @import { Config } from 'eslint/config' */

/**
 * @param {Parameters<typeof defineConfig>} args
 * @returns {Config[]}
 */
export function createConfig (...args) {
	return defineConfig([
		{
			plugins: {
				js: eslintJS
			},
			files: [
				'**/*.{js,mjs,cjs,ts,mts,cts}'
			],
			extends: [
				'js/recommended'
			],
			languageOptions: {
				globals: { ...globals.node },
			}
		},
		eslintTS.configs.strict,
	], ...args)
}
