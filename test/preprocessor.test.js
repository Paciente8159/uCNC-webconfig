const test = require('node:test');
const assert = require('node:assert/strict');
const { preprocess } = require('../preprocessor.js');

test('preprocesses conditional defaults, aliases, includes, and continuations', async () => {
	const files = new Map([
		['https://example.test/board.h', `
#define CLOCK 16000000UL
#ifndef BUFFER_SIZE
#define BUFFER_SIZE 14
#endif
#if defined(CLOCK) && CLOCK > 0
#define CLOCK_ENABLED true
#elif UNKNOWN
#define CLOCK_ENABLED false
#endif
#if UNDEFINED_IDENTIFIER
#define WRONG_BRANCH 1
#else
#define RIGHT_BRANCH 1
#endif
#define MULTILINE (2 + \\
  2)
#include "pins.h"
`],
		['https://example.test/pins.h', `
#define URL "https://example.test/value" // the URL must survive comment removal
#define STEP0_BIT 2
`],
	]);
	const result = await preprocess({
		entryFile: 'https://example.test/board.h',
		loadFile: async file => {
			if (!files.has(file)) throw new Error(`missing ${file}`);
			return files.get(file);
		},
	});
	assert.equal(result.macros.BUFFER_SIZE, '14');
	assert.equal(result.macros.CLOCK_ENABLED, 'true');
	assert.equal(result.macros.RIGHT_BRANCH, '1');
	assert.equal(result.macros.WRONG_BRANCH, undefined);
	assert.equal(result.macros.MULTILINE, '(2 +   2)');
	assert.equal(result.macros.URL, '"https://example.test/value"');
	assert.equal(result.macros.STEP0_BIT, '2');
	assert.deepEqual(result.diagnostics.filter(item => item.level === 'error'), []);
});

test('reports unsupported conditions instead of executing source text', async () => {
	const result = await preprocess({
		entryFile: 'https://example.test/unsafe.h',
		loadFile: async () => '#if (() => globalThis.compromised = true)()\n#define BAD 1\n#endif',
	});
	assert.equal(globalThis.compromised, undefined);
	assert.equal(result.macros.BAD, undefined);
	assert.equal(result.diagnostics[0].level, 'warning');
});
