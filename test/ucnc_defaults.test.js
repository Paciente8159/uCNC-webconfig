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

test('keepFilter keeps user values present in the new baseline and drops absent keys', () => {
	const scope = {
		app_state: { VERSION: 11700, MCU: 'atmega328p', BOARD: 'src/board.h', OLD_PIN: '9', KEPT_PIN: '7' },
		app_fields: { NEW_PIN: { type: 'int' }, KEPT_PIN: { type: 'int' } },
		__boardDefaultKeys: ['OLD_PIN', 'KEPT_PIN'],
	};
	const dropped = defaults.keepFilter(scope, { KEPT_PIN: '3', NEW_PIN: '4' }, '__boardDefaultKeys');
	assert.deepEqual(dropped, ['OLD_PIN']);
	assert.equal(scope.app_state.OLD_PIN, undefined);
	// Kept user value survives even though baseline says '3'
	assert.equal(scope.app_state.KEPT_PIN, '7');
	// New baseline key not in state gets coerced default
	assert.equal(scope.app_state.NEW_PIN, 4);
	// Protected keys survive
	assert.equal(scope.app_state.VERSION, 11700);
	assert.equal(scope.app_state.MCU, 'atmega328p');
	assert.equal(scope.app_state.BOARD, 'src/board.h');
	assert.deepEqual(scope.__boardDefaultKeys, ['KEPT_PIN', 'NEW_PIN']);
});

test('keepFilter never overwrites a surviving user value even when it differs', () => {
	const scope = {
		app_state: { VERSION: 11700, FREQ: '16000000', BAUDRATE: 250000 },
		app_fields: { FREQ: { type: 'int' }, BAUDRATE: { type: 'int' } },
		__boardDefaultKeys: ['FREQ', 'BAUDRATE'],
	};
	defaults.keepFilter(scope, { FREQ: 16000000, BAUDRATE: 115200 }, '__boardDefaultKeys');
	assert.equal(scope.app_state.FREQ, '16000000');
	assert.equal(scope.app_state.BAUDRATE, 250000);
});

test('keepFilter filters custom block defines absent from the new baseline', () => {
	const scope = {
		app_state: {
			VERSION: 11700,
			CUSTOM_BOARDMAP_CONFIGS: '#define OLD_MACRO 1\n#define KEPT_MACRO 2\n#define ANOTHER_KEPT 3',
			MY_PIN: '4',
		},
		app_fields: { MY_PIN: { type: 'int' } },
		__boardDefaultKeys: ['MY_PIN'],
	};
	defaults.keepFilter(scope, { MY_PIN: '5', KEPT_MACRO: '2', ANOTHER_KEPT: '3' }, '__boardDefaultKeys');
	assert.equal(scope.app_state.MY_PIN, '4');
	// OLD_MACRO should be dropped from custom block (absent from baseline)
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS.includes('OLD_MACRO'), false);
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS.includes('KEPT_MACRO'), true);
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS.includes('ANOTHER_KEPT'), true);
});

test('keepFilter filters HAL custom block defines absent from the new baseline', () => {
	const scope = {
		app_state: {
			VERSION: 11700,
			CUSTOM_HAL_CONFIGS: '#define OLD_HAL_MACRO 1\n#define KEPT_HAL 2',
		},
		app_fields: {},
		__halDefaultKeys: [],
	};
	defaults.keepFilter(scope, { KEPT_HAL: '2' }, '__halDefaultKeys');
	assert.equal(scope.app_state.CUSTOM_HAL_CONFIGS.includes('OLD_HAL_MACRO'), false);
	assert.equal(scope.app_state.CUSTOM_HAL_CONFIGS.includes('KEPT_HAL'), true);
});

test('keepFilter writes coerced defaults for baseline keys missing from state', () => {
	const scope = {
		app_state: { VERSION: 11700 },
		app_fields: { NEW_FLAG: { type: 'bool' }, NEW_COUNT: { type: 'int' } },
		__boardDefaultKeys: [],
	};
	defaults.keepFilter(scope, { NEW_FLAG: 'true', NEW_COUNT: '4' }, '__boardDefaultKeys');
	assert.equal(scope.app_state.NEW_FLAG, true);
	assert.equal(scope.app_state.NEW_COUNT, 4);
});

test('resetFilter replaces board layer with new baseline then lets user values survive', () => {
	const scope = {
		app_state: { VERSION: 11700, BOARD: 'src/board.h', OLD_PIN: '9', KEPT_PIN: '7', MY_PIN: '3' },
		app_fields: { KEPT_PIN: { type: 'int' }, MY_PIN: { type: 'int' }, NEW_PIN: { type: 'int' } },
		__boardDefaultKeys: ['OLD_PIN', 'KEPT_PIN', 'MY_PIN'],
	};
	const dropped = defaults.resetFilter(scope, { KEPT_PIN: '1', MY_PIN: '2', NEW_PIN: '4' }, '__boardDefaultKeys');
	// OLD_PIN is absent from the new baseline
	assert.deepEqual(dropped, ['OLD_PIN']);
	// Old stale key deleted
	assert.equal(scope.app_state.OLD_PIN, undefined);
	// User value for KEPT_PIN survives (baseline says '1', user had '7')
	assert.equal(scope.app_state.KEPT_PIN, '7');
	// User value for MY_PIN survives (baseline says '2', user had '3')
	assert.equal(scope.app_state.MY_PIN, '3');
	// NEW_PIN from baseline written since user had no value
	assert.equal(scope.app_state.NEW_PIN, 4);
	assert.deepEqual(scope.__boardDefaultKeys, ['KEPT_PIN', 'MY_PIN', 'NEW_PIN']);
});

test('resetFilter preserves machine identity fields', () => {
	const scope = {
		app_state: { VERSION: 11700, BOARD: 'src/board.h', KINEMATIC: 'CORE_XY', MP_SCARA: 0, AXIS_COUNT: 3, BAUDRATE: 250000, OLD_PIN: '9' },
		app_fields: { KINEMATIC: { type: 'string' }, MP_SCARA: { type: 'int' }, AXIS_COUNT: { type: 'int' }, BAUDRATE: { type: 'int' }, NEW_PIN: { type: 'int' } },
		__boardDefaultKeys: ['KINEMATIC', 'MP_SCARA', 'AXIS_COUNT', 'BAUDRATE', 'OLD_PIN'],
	};
	defaults.resetFilter(scope, { KINEMATIC: 'CARTESIAN', NEW_PIN: '4' }, '__boardDefaultKeys');
	// Machine identity survives with user value
	assert.equal(scope.app_state.KINEMATIC, 'CORE_XY');
	assert.equal(scope.app_state.MP_SCARA, 0);
	assert.equal(scope.app_state.AXIS_COUNT, 3);
	assert.equal(scope.app_state.BAUDRATE, 250000);
	// OLD_PIN dropped (absent from new baseline)
	assert.equal(scope.app_state.OLD_PIN, undefined);
	// NEW_PIN from baseline written
	assert.equal(scope.app_state.NEW_PIN, 4);
});

test('resetFilter sentinel path resets to empty baseline preserving machine identity', () => {
	const scope = {
		app_state: { VERSION: 11700, BOARD: 'boardmap_overrides.h', KINEMATIC: 'CORE_XY', OLD_PIN: '9' },
		app_fields: { KINEMATIC: { type: 'string' } },
		__boardDefaultKeys: ['KINEMATIC', 'OLD_PIN'],
	};
	defaults.resetFilter(scope, {}, '__boardDefaultKeys');
	assert.equal(scope.app_state.KINEMATIC, 'CORE_XY');
	assert.equal(scope.app_state.OLD_PIN, undefined);
});

test('resetFilter filters custom block defines that collide with baseline', () => {
	const scope = {
		app_state: {
			VERSION: 11700,
			BOARD: 'src/board.h',
			CUSTOM_BOARDMAP_CONFIGS: '#define COLLIDE_PIN 5\n#define MY_EXTRA_PIN 9\n#define STAYS 7',
		},
		app_fields: {},
		__boardDefaultKeys: [],
	};
	defaults.resetFilter(scope, { COLLIDE_PIN: '3' }, '__boardDefaultKeys');
	// COLLIDE_PIN is re-defined by baseline — should be dropped from custom block
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS.includes('COLLIDE_PIN'), false);
	// MY_EXTRA_PIN not in baseline — should stay
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS.includes('MY_EXTRA_PIN'), true);
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS.includes('STAYS'), true);
});

test('keepFilter returns empty dropped array when all old keys exist in new baseline', () => {
	const scope = {
		app_state: { VERSION: 11700, PIN_A: '1', PIN_B: '2' },
		app_fields: { PIN_A: { type: 'int' }, PIN_B: { type: 'int' } },
		__boardDefaultKeys: ['PIN_A', 'PIN_B'],
	};
	const dropped = defaults.keepFilter(scope, { PIN_A: '5', PIN_B: '6' }, '__boardDefaultKeys');
	assert.deepEqual(dropped, []);
});

test('resetFilter returns empty dropped when all old keys exist in new baseline', () => {
	const scope = {
		app_state: { VERSION: 11700, PIN_A: '1' },
		app_fields: { PIN_A: { type: 'int' } },
		__boardDefaultKeys: ['PIN_A'],
	};
	const dropped = defaults.resetFilter(scope, { PIN_A: '5' }, '__boardDefaultKeys');
	assert.deepEqual(dropped, []);
});

test('keepFilter with empty baseline drops all non-protected keys', () => {
	const scope = {
		app_state: { VERSION: 11700, PIN_A: '1', PIN_B: '2' },
		app_fields: {},
		__boardDefaultKeys: ['PIN_A', 'PIN_B'],
	};
	const dropped = defaults.keepFilter(scope, {}, '__boardDefaultKeys');
	assert.deepEqual(dropped, ['PIN_A', 'PIN_B']);
	assert.equal(scope.app_state.PIN_A, undefined);
	assert.equal(scope.app_state.PIN_B, undefined);
	assert.equal(scope.app_state.VERSION, 11700);
});

test('keepFilter on empty layer does not error', () => {
	const scope = {
		app_state: { VERSION: 11700 },
		app_fields: {},
		__boardDefaultKeys: [],
	};
	const dropped = defaults.keepFilter(scope, { NEW_KEY: '1' }, '__boardDefaultKeys');
	assert.deepEqual(dropped, []);
	assert.equal(scope.app_state.NEW_KEY, '1');
});

test('resetFilter on empty layer does not error', () => {
	const scope = {
		app_state: { VERSION: 11700 },
		app_fields: {},
		__boardDefaultKeys: [],
	};
	const dropped = defaults.resetFilter(scope, { NEW_KEY: '1' }, '__boardDefaultKeys');
	assert.deepEqual(dropped, []);
	assert.equal(scope.app_state.NEW_KEY, '1');
});

test('filterCustomBlock keeps non-define lines (comments, blank preserved)', () => {
	const scope = {
		app_state: { VERSION: 11700, CUSTOM_BOARDMAP_CONFIGS: '// comment\n#define DEF 1\n#define KEEP 2\n' },
		app_fields: { DEF: { type: 'int' } },
		__boardDefaultKeys: ['DEF'],
	};
	defaults.keepFilter(scope, { DEF: '1', KEEP: '2' }, '__boardDefaultKeys');
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS.includes('// comment'), true);
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS.includes('DEF'), true);
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS.includes('KEEP'), true);
});
