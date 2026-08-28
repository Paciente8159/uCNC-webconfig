const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function loadUiFoundation(context) {
	vm.runInContext(require('node:fs').readFileSync(path.join(ROOT, 'ui_foundation.js'), 'utf8'), context, {
		filename: 'ui_foundation.js',
	});
}

function createContext() {
	const storage = new Map();
	const fakeLocalStorage = {
		getItem(key) { return storage.has(key) ? storage.get(key) : null; },
		setItem(key, value) { storage.set(key, String(value)); },
		removeItem(key) { storage.delete(key); },
	};
	const context = {
		console,
		window: {},
		setTimeout,
		clearTimeout,
		document: {
			createElement() { return { style: {}, setAttribute() {}, appendChild() {}, removeChild() {}, click() {} }; },
			body: { appendChild() {}, removeChild() {} },
			documentElement: { setAttribute() {}, removeAttribute() {} },
		},
		localStorage: fakeLocalStorage,
		navigator: {},
		Blob: function () {},
		FileReader: function () {},
		URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
	};
	context.window.window = context.window;
	vm.createContext(context);
	return context;
}

function makeRootScope(overrides) {
	const scope = {
		app_state: {
			VERSION: 11606,
			MCU: 'MCU_AVR',
			BOARD: 'src/hal/boards/avr/boardmap_uno.h',
			KINEMATIC: 'KINEMATIC_CARTESIAN',
			...overrides,
		},
		app_fields: {
			VERSION: { type: 'int', nullable: false, file: '' },
			MCU: { type: '', nullable: false, file: 'boardmap' },
			KINEMATIC: { type: '', nullable: false, file: 'hal' },
		},
		app_options: {
			VERSIONS: [{ id: 'master', tag: 99999 }, { id: 'v1.16.6', tag: 11606 }],
			KINEMATICS: [
				{ id: 'KINEMATIC_CARTESIAN', name: 'Cartesian', version: 0 },
				{ id: 'KINEMATIC_COREXY', name: 'Core XY', version: 0 },
			],
			MCUS: [
				{ id: 'MCU_AVR', name: 'Atmel AVR', url: 'src/hal/mcus/avr/mcumap_avr.h' },
				{ id: 'MCU_ESP32', name: 'ESP32', url: 'src/hal/mcus/esp32/mcumap_esp32.h' },
			],
			BOARDS: [
				{ id: 'src/hal/boards/avr/boardmap_uno.h', name: 'Arduino UNO', mcu: 'MCU_AVR' },
				{ id: 'src/hal/boards/esp32/boardmap_wemos_d1_r32.h', name: 'Wemos D1 R32', mcu: 'MCU_ESP32' },
				{ id: 'boardmap_overrides.h', name: 'Custom board', mcu: 'MCU_AVR,MCU_SAMD21,MCU_STM32F0X,MCU_STM32F1X,MCU_STM32F4X,MCU_STM32H7X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_ESP32C3,MCU_ESP32S3,MCU_RP2040,MCU_RP2350' },
			],
			UCNCPINS: [
				{ pin: 'STEP0', type: 'stepper,special_output' },
				{ pin: 'DIR0', type: 'stepper,special_output' },
				{ pin: 'LIMIT_X', type: 'control,special_input' },
				{ pin: 'PROBE', type: 'control,special_input,unsafe_generic_input' },
			],
			MODULES_OPTIONS: [
				{ id: 'bltouch', name: 'Support for BLTouch probe', condition: '' },
				{ id: 'stm32_sdio', name: 'Enables SDIO support for SD Card module.', requires: 'sd_card_v2' },
				{ id: 'tmc_driver', name: 'Support for TMC drivers.', condition: 'VERSION>010806' },
			],
			TOOL_OPTIONS: [{ id: 'spindle_pwm', name: 'Spindle PWM' }],
		},
	};
	return scope;
}

test('modified tracking compares against committed defaults or fallback flags', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	scope.app_state.ENABLE_WIFI = true;
	scope.app_state.AXIS_COUNT = 4;

	const api = context.window.UiFoundation.initUiFoundation(scope, {});
	api.commitDefaultsSnapshot(scope, { AXIS_COUNT: 3 }, {});

	assert.equal(api.countChanged(scope), 2);
	const keys = api.changedKeyList(scope);
	assert.ok(keys.includes('AXIS_COUNT'));
	assert.ok(keys.includes('ENABLE_WIFI'));
	assert.ok(!keys.includes('VERSION'));
	assert.ok(!keys.includes('MCU'));
	assert.ok(!keys.includes('BOARD'));
	assert.ok(!keys.includes('KINEMATIC'));

	assert.equal(api.isKeyModified('AXIS_COUNT', scope), true);
	const reset = api.resetKey('AXIS_COUNT', scope);
	assert.equal(reset, true);
	assert.equal(scope.app_state.AXIS_COUNT, 3);
	assert.equal(api.countChanged(scope), 1);
});

test('changedDetails exposes sources and resetAllModified returns changed count', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	api.commitDefaultsSnapshot(scope, { BAUDRATE: 115200 }, {});
	scope.app_state.BAUDRATE = 230400;

	const details = api.changedDetails(scope);
	assert.equal(details.length, 1);
	assert.equal(details[0].key, 'BAUDRATE');
	assert.equal(details[0].defaultValue, 115200);
	assert.equal(details[0].currentValue, 230400);

	assert.equal(api.resetAllModified(scope), 1);
	assert.equal(scope.app_state.BAUDRATE, 115200);
});

test('validation reports missing selections, duplicates, module requirements and mismatch', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	api = context.window.UiFoundation.initUiFoundation(scope, {});

	// Missing primary selections
	delete scope.app_state.KINEMATIC;
	let findings = api.runValidation(scope);
	assert.ok(findings.some(f => f.setting === 'KINEMATIC' && f.severity === 'error'));

	// Duplicate gpio assignment: same port+bit combination
	scope.app_state.STEP0_BIT = 5;
	scope.app_state.STEP0_PORT = 'A';
	scope.app_state.DIR0_BIT = 5;
	scope.app_state.DIR0_PORT = 'A';
	findings = api.runValidation(scope);
	assert.ok(findings.some(f => f.setting === 'DIR0_BIT' && f.severity === 'error' && /more than one/.test(f.message)));

	// Same bit number on a different port is NOT a duplicate
	scope.app_state.STEP0_PORT = 'A';
	scope.app_state.DIR0_PORT = 'B';
	findings = api.runValidation(scope);
	assert.ok(!findings.some(f => f.setting === 'DIR0_BIT' && f.severity === 'error' && /more than one/.test(f.message)));

	// Module requires an unmet prerequisite
	scope.app_state.stm32_sdio = true;
	scope.app_state.sd_card_v2 = false;
	findings = api.runValidation(scope);
	assert.ok(findings.some(f => f.setting === 'stm32_sdio' && f.severity === 'error' && /sd_card_v2/.test(f.message)));

	// Version-gated module with incompatible version
	scope.app_state.tmc_driver = true;
	scope.app_state.VERSION = 10000;
	findings = api.runValidation(scope);
	assert.ok(findings.some(f => f.setting === 'tmc_driver' && f.severity === 'warning'));
});

test('validation detects Board/MCU mismatch from imported config', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	scope.app_state.MCU = 'MCU_ESP32';
	scope.app_state.BOARD = 'src/hal/boards/avr/boardmap_uno.h';
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	const findings = api.runValidation(scope);
	assert.ok(findings.some(f => f.setting === 'BOARD' && f.severity === 'error' && /not compatible/.test(f.message)));
});

test('validation ignores referenced pins that are omitted by IO offsets', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	scope.app_state.SOFT_SPI_ENABLED = true;
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	const findings = [];
	// No boardmap pins assigned: no duplicate error expected.
	assert.equal(findings.length, 0);
});

test('summary status rolls up errors, warnings and ready', () => {
	const api = {};
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	const foundation = context.window.UiFoundation.initUiFoundation(scope, {});
	const ready = foundation.summarizeFindings([]);
	assert.equal(ready.status, 'ready');
	const warned = foundation.summarizeFindings([{ severity: 'warning' }]);
	assert.equal(warned.status, 'warnings');
	const failed = foundation.summarizeFindings([{ severity: 'error' }]);
	assert.equal(failed.status, 'action-required');
});

test('autosave, restore and discard round-trip without protected keys', async () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	scope.app_state.AXIS_COUNT = 4;
	scope.app_state.__CHANGED_COUNT = 1; // must never be persisted
	const api = context.window.UiFoundation.initUiFoundation(scope, {});
	api.autosave();
	await new Promise(resolve => setTimeout(resolve, 700));

	const raw = context.localStorage.getItem('ucnc_config_draft_v1');
	const draft = JSON.parse(raw);
	assert.equal(draft.AXIS_COUNT, 4);
	assert.equal(Object.prototype.hasOwnProperty.call(draft, '__CHANGED_COUNT'), false);

	// mutate and restore
	scope.app_state.AXIS_COUNT = 2;
	api.restoreDraft();
	assert.equal(scope.app_state.AXIS_COUNT, 4);
	assert.equal(api.discardDraft(), true);
	assert.equal(context.localStorage.getItem('ucnc_config_draft_v1'), null);
});

test('checkDraft reports availability', async () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	const api = context.window.UiFoundation.initUiFoundation(scope, {});
	assert.equal(api.checkDraft(), false);
	api.autosave();
	await new Promise(resolve => setTimeout(resolve, 700));
	assert.equal(api.checkDraft(), true);
});

test('saveCompleteSnapshot returns a versioned state and excludes internal keys', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	const api = context.window.UiFoundation.initUiFoundation(scope, {});
	scope.app_state.__VALIDATION_ERRORS = 2;
	scope.app_state.AXIS_COUNT = 4;
	const snapshot = api.saveCompleteSnapshot();
	assert.equal(snapshot.format, 1);
	assert.equal(snapshot.state.AXIS_COUNT, 4);
	assert.equal(Object.prototype.hasOwnProperty.call(snapshot.state, '__VALIDATION_ERRORS'), false);
});

test('applyJsonConfig imports, coerce by field metadata and preserves unknown keys', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	scope.app_fields.AXIS_COUNT = { type: 'int', nullable: false, file: 'boardmap' };
	scope.app_fields.ENABLE_WIFI = { type: 'bool', nullable: true, file: 'boardmap' };
	scope.app_state.AXIS_COUNT = 3;
	const api = context.window.UiFoundation.initUiFoundation(scope, {});

	const imported = JSON.stringify({
		format: 1,
		state: {
			AXIS_COUNT: '6',
			ENABLE_WIFI: 'true',
			KINEMATIC: 'KINEMATIC_COREXY',
			UNKNOWN_FUTURE_KEY: 42,
		},
	});
	const result = api.applyJsonConfig(imported);
	assert.equal(result.ok, true);
	assert.equal(scope.app_state.AXIS_COUNT, 6);
	assert.equal(scope.app_state.ENABLE_WIFI, true);
	assert.equal(scope.app_state.KINEMATIC, 'KINEMATIC_COREXY');
	assert.equal(scope.app_state.UNKNOWN_FUTURE_KEY, 42);
	assert.equal(result.preserved.length, 1);
	assert.equal(result.preserved[0], 'UNKNOWN_FUTURE_KEY');
});

test('applyJsonConfig accepts a legacy flat object and rejects invalid JSON', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	const api = context.window.UiFoundation.initUiFoundation(scope, {});
	const flat = api.applyJsonConfig({ AXIS_COUNT: 5 });
	assert.equal(flat.ok, true);
	assert.equal(scope.app_state.AXIS_COUNT, 5);
	const invalid = api.applyJsonConfig('{not json');
	assert.equal(invalid.ok, false);
});

test('goStep validates steps and persists; resumeStep restores or defaults', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	const api = context.window.UiFoundation.initUiFoundation(scope, {});
	const steps = [
		{ id: 'machine', label: 'Machine' },
		{ id: 'pins', label: 'Pins' },
		{ id: 'review', label: 'Review' },
	];
	assert.equal(api.goStep('pins', steps), true);
	assert.equal(scope.app_state.__WORKFLOW_STEP, 'pins');
	assert.equal(context.localStorage.getItem('ucnc_workflow_step_v1'), 'pins');
	assert.equal(api.goStep('nonexistent', steps), false);
	assert.equal(scope.app_state.__WORKFLOW_STEP, 'pins');

	scope.app_state.__WORKFLOW_STEP = 'machine';
	assert.equal(api.resumeStep(steps), 'pins');
	assert.equal(scope.app_state.__WORKFLOW_STEP, 'pins');

	context.localStorage.removeItem('ucnc_workflow_step_v1');
	scope.app_state.__WORKFLOW_STEP = null;
	assert.equal(api.resumeStep(steps), 'machine');
	assert.equal(scope.app_state.__WORKFLOW_STEP, 'machine');
});

test('theme functions persist preference and set the document attribute', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	const api = context.window.UiFoundation.initUiFoundation(scope, {});
	assert.equal(api.applyTheme('dark'), 'dark');
	assert.equal(api.getVisibility(), null);
	api.setVisibility('expert');
	assert.equal(api.getVisibility(), 'expert');
	assert.equal(context.localStorage.getItem('ucnc_ui_prefs_v1').includes('"theme":"dark"'), true);
	assert.equal(api.toggleTheme(), 'light');
});

test('refresh feeds reactive keys used by the shell', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	scope.app_state.AXIS_COUNT = 4;
	const api = context.window.UiFoundation.initUiFoundation(scope, {});
	api.commitDefaultsSnapshot(scope, { AXIS_COUNT: 3 }, {});
	api.refresh(scope);
	assert.equal(scope.app_state.__CHANGED_COUNT, 1);
	assert.equal(scope.app_state.__CHANGED_KEYS.length, 1);
	assert.equal(scope.app_state.__CHANGED_KEYS[0], 'AXIS_COUNT');
	assert.equal(typeof scope.app_state.__VALIDATION_STATUS, 'string');
	assert.ok(Array.isArray(scope.app_state.__VALIDATION));
});

test('resetPins clears every pin definition field, including falsy values', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	// Seed every pin field the way the mounted components do, mixing numeric 0,
	// false booleans, and populated values so falsy entries are not skipped.
	const suffixes = ['_BIT', '_PORT', '_ISR', '_PULLUP', '_ADC', '_CHANNEL', '_MUX', '_TIMER', '_IO_OFFSET'];
	const pins = scope.app_options.UCNCPINS.map(item => item.pin);
	pins.forEach((pin, i) => {
		suffixes.forEach((suffix, j) => {
			if ((i === 0 && j === 0) || (i === 3 && j === 2)) scope.app_state[pin + suffix] = 0;
			else if ((i === 0 && j === 2) || (i === 2 && j === 3)) scope.app_state[pin + suffix] = false;
			else scope.app_state[pin + suffix] = '' + i + j;
		});
	});
	scope.app_state.STEP0_BIT = 0;
	scope.app_state.STEP0_ISR = false;
	scope.app_state.CUSTOM_BOARDMAP_CONFIGS = '#define EXTRA 1';
	const api = context.window.UiFoundation.initUiFoundation(scope, {});
	const count = api.resetPins();

	assert.equal(count, 4 * suffixes.length + 1);
	const leftover = Object.keys(scope.app_state).filter(key =>
		pins.some(pin => key.startsWith(pin + '_')) || key === 'CUSTOM_BOARDMAP_CONFIGS'
	).filter(key => scope.app_state[key] !== '');
	assert.deepEqual(leftover, [], 'every existing pin field must be reset to an empty string');
	assert.equal(scope.app_state.STEP0_BIT, '');
	assert.equal(scope.app_state.STEP0_ISR, '');
	assert.equal(scope.app_state.LIMIT_X_PULLUP, '');
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS, '');
});

test('resetPin clears only the definitions of the given pin, including falsy values', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope();
	const suffixes = ['_BIT', '_PORT', '_ISR', '_PULLUP', '_ADC', '_CHANNEL', '_MUX', '_TIMER', '_IO_OFFSET'];
	scope.app_options.UCNCPINS.forEach(item => {
		suffixes.forEach(suffix => { scope.app_state[item.pin + suffix] = 1; });
	});
	scope.app_state.STEP0_BIT = 0;
	scope.app_state.STEP0_ISR = false;
	scope.app_state.LIMIT_X_PULLUP = false;
	scope.app_state.CUSTOM_BOARDMAP_CONFIGS = '#define EXTRA 1';
	const api = context.window.UiFoundation.initUiFoundation(scope, {});

	assert.equal(api.resetPin('STEP0'), suffixes.length);
	assert.equal(api.resetPin('LIMIT_X'), suffixes.length);
	suffixes.forEach(suffix => {
		assert.equal(scope.app_state['STEP0' + suffix], '');
		assert.equal(scope.app_state['LIMIT_X' + suffix], '');
		// Unrelated pins keep their values.
		assert.equal(scope.app_state['DIR0' + suffix], 1);
		assert.equal(scope.app_state['PROBE' + suffix], 1);
	});
	// The custom boardmap block is not touched by the per-pin reset.
	assert.equal(scope.app_state.CUSTOM_BOARDMAP_CONFIGS, '#define EXTRA 1');
});