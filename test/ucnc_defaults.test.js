const test = require('node:test');
const assert = require('node:assert/strict');
require('../preprocessor.js');
const defaults = require('../ucnc_defaults.js');

test('uses a compiler manifest before the browser fallback', async () => {
	const requests = [];
	const fetchImpl = async url => {
		requests.push(url);
		return {
			ok: true,
			json: async () => ({
				metadata: { requestedRef: 'v1.17.0', commit: 'abc123' },
				boards: { 'src/board.h': { macros: { PIN: '4' }, boardMacros: { PIN: '4' } } },
			}),
		};
	};
	const result = await defaults.loadBoardDefaults({ ref: 'v1.17.0', board: 'src/board.h', mcuPath: 'src/mcu.h', fetchImpl });
	assert.equal(result.source, 'manifest');
	assert.equal(result.macros.PIN, '4');
	assert.deepEqual(requests, ['./manifests/v1.17.0/defaults.json']);
});

test('falls back to raw headers for an arbitrary old branch', async () => {
	const fetchImpl = async url => {
		if (url.startsWith('./manifests/')) return { ok: false, status: 404 };
		if (url.endsWith('/src/board.h')) return { ok: true, text: async () => '#define MCU OLD_MCU\n#define PIN 7' };
		if (url.endsWith('/src/mcu.h')) return { ok: true, text: async () => '#ifndef PIN\n#define PIN 9\n#endif\n#define TIMER 2' };
		return { ok: false, status: 404 };
	};
	const result = await defaults.loadBoardDefaults({ ref: 'old/maintenance', board: 'src/board.h', mcuPath: 'src/mcu.h', fetchImpl });
	assert.equal(result.source, 'browser-fallback');
	assert.equal(result.macros.PIN, '7');
	assert.equal(result.macros.TIMER, '2');
	assert.equal(result.boardMacros.PIN, '7');
});

test('coerces known firmware values according to field metadata', () => {
	assert.equal(defaults.coerceForField('false', { type: 'bool' }), false);
	assert.equal(defaults.coerceForField('0', { type: 'bool' }), false);
	assert.equal(defaults.coerceForField('16000000UL', { type: 'int' }), 16000000);
	assert.equal(defaults.coerceForField('"Arduino UNO"', { type: 'string' }), 'Arduino UNO');
});

test('replaces the previous board layer instead of retaining stale defaults', () => {
	const scope = {
		app_state: { BOARD: 'new-board.h', OLD_PIN: '9' },
		app_fields: { NEW_PIN: { type: 'int' } },
		__boardDefaultKeys: ['OLD_PIN'],
	};
	defaults.replaceDefaults(scope, { NEW_PIN: '4' }, '__boardDefaultKeys');
	assert.equal(scope.app_state.OLD_PIN, undefined);
	assert.equal(scope.app_state.NEW_PIN, 4);
	assert.equal(scope.app_state.BOARD, 'new-board.h');
});
