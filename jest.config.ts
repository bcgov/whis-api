import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
	preset: 'ts-jest/presets/js-with-ts-esm',
	testEnvironment: 'node',
	collectCoverageFrom: ['**/src/*.{ts}', '!**/node_modules/**', '!**/vendor/**'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1'
	},
	globals: {
		extensionsToTreatAsEsm: ['.ts', '.js'],
		'ts-jest': {
			useESM: true,
			diagnostics: true
		}
	},
	transform: {},
	moduleDirectories: ['node_modules', 'src', 'data']
};

export default config;
