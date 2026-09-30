// @ts-check

import path from 'path'
import { defineConfig, mergeConfig } from 'tsdown'

/** @import { UserConfig } from 'tsdown' */
/** @import { InlineConfig } from 'tsdown' */

/**
 * @param {InlineConfig | InlineConfig[]} [override]
 * @returns {UserConfig | UserConfig[]}
 */
export function createConfig (override) {
	const baseConfig = defineConfig({
		entry: fromRoot('./src/index.ts'),
		outDir: fromRoot(`./dist/`),

		alias: {
			'@': fromRoot('./src/index.ts')
		},
		format: ['cjs', 'es'],

		dts: true,
		minify: true,
		sourcemap: true,
		exports: true,
	})

	return override
		? [override].flat().map((config) => mergeConfig(baseConfig, config))
		: baseConfig
}

/**
 * @param {string} relative
 * @returns {string}
 */
export function fromRoot (relative, root = process.cwd()) {
	return path.resolve(root, relative)
}
