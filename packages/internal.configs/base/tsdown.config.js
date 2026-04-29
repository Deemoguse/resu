// @ts-check
// @ts-expect-error
import path from 'path'
import { defineConfig, mergeConfig } from 'tsdown'

/** @import { UserConfig } from 'tsdown' */
/** @import { NormalizedFormat } from 'tsdown' */

/** @typedef {UserConfig | ((format: NormalizedFormat) => UserConfig)} Override */

/**
 * @param {Override} [override]
 * @returns {UserConfig[]}
 */
export function createConfig (override) {
	return defineConfig([
		configWithFormat('es', override),
		configWithFormat('cjs', override),
	])
}

/**
 * @param {string} relative
 * @returns {string}
 */
function fromRoot (relative) {
	// @ts-expect-error
	return path.resolve(process.cwd(), relative)
}

/**
 * @param {NormalizedFormat} format
 * @param {Override} [override]
 * @returns {UserConfig}
 */
function configWithFormat (format, override) {
	const resolvedOverrideConfig = typeof override === 'function'
		? override(format)
		: override

	/** @type { UserConfig } */
	const config = {
		entry: fromRoot('./src/index.ts'),
		outDir: fromRoot(`./dist/${format}`),

		format: format,

		dts: true,
		alias: {
			'@': fromRoot('./src/index.ts')
		},
	}

	return resolvedOverrideConfig
		? mergeConfig(config, resolvedOverrideConfig)
		: config
}
