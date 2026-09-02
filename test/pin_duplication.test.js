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
			VERSIONS: [{ id: 'master', tag: 99999 }, { id: 'v1.17.0', tag: 11700 }],
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
			MODULES_OPTIONS: [],
			TOOL_OPTIONS: [],
		},
	};
	return scope;
}

function matching(findings, setting, severity, re) {
	return findings.some(f => f.setting === setting && f.severity === severity && re.test(f.message));
}

test('pin duplication: same port+bit on AVR flags duplicate', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope({ STEP0_BIT: 5, STEP0_PORT: 'A', DIR0_BIT: 5, DIR0_PORT: 'A' });
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	const findings = api.runValidation(scope);
	const match = findings.find(f => f.setting === 'DIR0_BIT' && f.severity === 'error');
	assert.ok(match, 'expected a DIR0_BIT duplicate error');
	assert.match(match.message, /more than one/);
	assert.match(match.message, /STEP0/);
	// target is built inside the vm context (different realm), so compare fields instead of deepEqual
	assert.equal(match.target.step, 'board-mcu');
	assert.equal(match.target.setting, 'DIR0_BIT');
});

test('pin duplication: same bit on different port is NOT a duplicate', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope({ STEP0_BIT: 5, STEP0_PORT: 'A', DIR0_BIT: 5, DIR0_PORT: 'B' });
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	const findings = api.runValidation(scope);
	assert.ok(!matching(findings, 'DIR0_BIT', 'error', /more than one/));
});

test('pin duplication: same IO offset used by two pins flags duplicate', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope({ STEP0_BIT: '', STEP0_IO_OFFSET: 5, DIR0_BIT: '', DIR0_IO_OFFSET: 5 });
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	const findings = api.runValidation(scope);
	const match = findings.find(f => f.setting === 'DIR0_IO_OFFSET' && f.severity === 'error');
	assert.ok(match, 'expected a DIR0_IO_OFFSET duplicate error');
	assert.match(match.message, /more than one/);
	assert.match(match.message, /STEP0/);
	assert.equal(match.target.step, 'board-mcu');
	assert.equal(match.target.setting, 'DIR0_IO_OFFSET');
});

test('pin duplication: one pin on IO offset, another with same bit is NOT a duplicate', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope({ STEP0_BIT: 5, STEP0_PORT: 'A', DIR0_IO_OFFSET: 5 });
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	const findings = api.runValidation(scope);
	assert.ok(!matching(findings, 'DIR0_IO_OFFSET', 'error', /more than one/));
	assert.ok(!matching(findings, 'STEP0_BIT', 'error', /more than one/));
});

test('pin duplication: no port on CPU (bit only) allows same bit as IO offset', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope({ STEP0_BIT: 5, DIR0_BIT: 5, DIR0_IO_OFFSET: 5 });
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	const findings = api.runValidation(scope);
	assert.ok(!matching(findings, 'STEP0_BIT', 'error', /more than one/));
	assert.ok(!matching(findings, 'DIR0_IO_OFFSET', 'error', /more than one/));
});

test('pin duplication: bit only duplicated on CPU without port flags duplicate', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope({ STEP0_BIT: 5, DIR0_BIT: 5 });
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	const findings = api.runValidation(scope);
	const match = findings.find(f => f.setting === 'DIR0_BIT' && f.severity === 'error');
	assert.ok(match, 'expected a DIR0_BIT duplicate error');
	assert.match(match.message, /STEP0/);
	assert.equal(match.target.step, 'board-mcu');
	assert.equal(match.target.setting, 'DIR0_BIT');
});

test('pin duplication: empty-port pin and ported pin with same bit on different ports are NOT duplicates', () => {
	const context = createContext();
	loadUiFoundation(context);
	const scope = makeRootScope({ STEP0_BIT: 5, STEP0_PORT: '', DIR0_BIT: 5, DIR0_PORT: 'A' });
	api = context.window.UiFoundation.initUiFoundation(scope, {});
	const findings = api.runValidation(scope);
	// Duplicate detection keys on the port+bit combination, so a pin without a
	// port and a pin on port A sharing bit 5 live on different physical pins.
	assert.ok(!matching(findings, 'DIR0_BIT', 'error', /more than one/));
});