// @ts-check

import path from 'path'
import { defineConfig, mergeConfig } from 'tsdown'

/** @import { UserConfig } from 'tsdown' */
/** @import { InlineConfig } from 'tsdown' */

/**
 * @param {InlineConfig} [override]
 * @returns {UserConfig}
 */
export function createConfig (override) {
	const config = defineConfig({
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

	return override ? mergeConfig(config, override) : config
}

/**
 * @param {string} relative
 * @returns {string}
 */
export function fromRoot (relative, root = process.cwd()) {
	return path.resolve(root, relative)
}
