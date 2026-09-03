const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

test('index.html keeps every firmware field mounted inside workflow panels', () => {
	const panels = html.match(/data-workflow-panel="([a-z0-9-]+)"/g) || [];
	assert.ok(panels.length >= 7, `expected at least 7 workflow panels, got ${panels.length}`);

	const workflowSteps = ['machine', 'board-mcu', 'pins', 'tools', 'modules', 'custom', 'review'];
	for (const step of workflowSteps) {
		assert.ok(html.includes(`data-workflow-panel="${step}"`), `missing panel ${step}`);
	}

	// The generation contract reads the mounted DOM for config-file attributes.
	// In the source these are written as configfile (Vue maps them to config-file).
	const fieldElements = html.match(/configfile=/g) || [];
	assert.ok(fieldElements.length > 100, `expected many configfile elements, got ${fieldElements.length}`);
});

test('index.html hides workflow panels with v-show, keeping fields mounted', () => {
	const panelVIf = html.match(/v-if="[^"]*__WORKFLOW_STEP[^"]*"/g) || [];
	assert.equal(panelVIf.length, 0, 'workflow panels must stay mounted via v-show, not v-if');
	const panelVShow = html.match(/v-show="app_state.__WORKFLOW_STEP === '[a-z0-9-]+'"/g) || [];
	assert.equal(panelVShow.length, 7, 'each workflow panel must be hidden with v-show');
});

test('index.html wires the workflow shell and ui_foundation', () => {
	assert.ok(html.includes('UiFoundation.initUiFoundation'), 'bootstraps ui_foundation');
	const scripts = html.match(/<script src="([^"]+)">/g) || [];
	const names = scripts.map(s => s.match(/src="([^"]+)"/)[1]).filter(n => !/^https?:/.test(n));
	for (const required of ['tabs.js', 'ui_foundation.js']) {
		assert.ok(names.includes(required), `script ${required} must be loaded`);
	}
	const orderIndexes = ['options.js', 'containers.js', 'tabs.js', 'controls.js', 'component_loader.js', 'preprocessor.js', 'ucnc_defaults.js', 'ui_foundation.js', 'configs.js']
		.map(name => names.indexOf(name));
	for (let i = 0; i < orderIndexes.length - 1; i++) {
		assert.ok(orderIndexes[i] !== -1 && orderIndexes[i] < orderIndexes[i + 1], 'script load order must be preserved');
	}
});

test('index.html review step offers download, reset and findings', () => {
	assert.ok(html.includes('data-workflow-panel="review"'), 'review panel exists');
	assert.ok(html.includes('downloadZip'), 'review offers the configuration ZIP download');
	assert.ok(html.includes('resetAllModified'), 'review offers reset of changed settings');
	assert.ok(html.includes('__VALIDATION'), 'review binds validation findings');
	assert.ok(html.includes('window.loadGenerateConfig'), 'ZIP download uses the existing generator');
});

test('index.html board-mcu panel has a full-clear button and per-pin bin buttons', () => {
	const panel = html.match(/data-workflow-panel="board-mcu"[\s\S]*?<\/section>/)[0];
	assert.ok(panel.includes('Clear all pin definitions'), 'board-mcu offers the full pin clear button');
	assert.ok(panel.includes('resetPins'), 'full clear button is wired');
	assert.ok(panel.includes('resetPin(rowitem.pin)'), 'per-pin clear buttons are wired');
	const binButtons = panel.match(/class="[^"]*pin-clear-btn[^"]*"/g) || [];
	assert.ok(binButtons.length >= 7, `expected a bin button per pin table, got ${binButtons.length}`);
});

test('encoder configuration exposes every firmware encoder type and its inputs', () => {
	const options = fs.readFileSync(path.join(ROOT, 'options.js'), 'utf8');
	for (const type of ['ENC_TYPE_PULSE', 'ENC_TYPE_I2C', 'ENC_TYPE_SSI', 'ENC_TYPE_CUSTOM']) {
		assert.ok(options.includes(type), `missing encoder type ${type}`);
	}
	assert.ok(html.includes("item.id+'_TYPE'"), 'each encoder has a type selector');
	assert.ok(html.includes("item.id+'_FREQ'"), 'serial encoders have a bus frequency override');
	assert.ok(html.includes("item.id+'_IS_INCREMENTAL'"), 'read-based encoders expose incremental mode');
	assert.ok(html.includes("item.id+'_NO_WRAP_CORRECTION'"), 'incremental encoders expose wrap correction control');
	assert.ok(html.includes('I²C SCL pin'), 'I²C pin roles are labelled');
	assert.ok(html.includes('SSI clock pin'), 'SSI pin roles are labelled');
	for (const type of ['ENC_TYPE_PULSE', 'ENC_TYPE_I2C', 'ENC_TYPE_SSI']) {
		assert.ok(html.includes(`v-if="app_state[item.id+'_TYPE']==='${type}'"`), `${type} controls use reactive Vue visibility`);
	}
	assert.ok(!html.includes(":if=\"'app_state.'+item.id+'_TYPE"), 'encoder visibility does not use generated condition strings');
	assert.ok(html.includes("v-if=\"app_state[item.id+'_IS_INCREMENTAL']\""), 'wrap correction follows incremental mode reactively');
});

test('index.html header exposes version, Load, Save and Theme controls', () => {
	assert.ok(html.includes('header-version'), 'header holds the firmware version selector');
	assert.ok(html.includes('loadConfig'), 'header Load action');
	assert.ok(html.includes('saveConfig'), 'header Save action');
	assert.ok(html.includes('toggleTheme'), 'Theme control');
	assert.ok(html.includes('µCNC Configurator'), 'product name in header');
});

test('index.html inline bootstrap wires refresh, autosave, step resume and draft', () => {
	const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
	const inline = scripts[scripts.length - 1][1];
	assert.ok(inline.includes('ucncfoundation.refresh()'), 'refresh attached to the app');
	assert.ok(inline.includes('ucncfoundation.autosave()'), 'autosave attached to the app');
	assert.ok(inline.includes('resumeStep'), 'restores the last step');
	assert.ok(inline.includes('checkDraft'), 'draft banner wired');
	assert.ok(inline.includes('commitDefaultsSnapshot'), 'defaults snapshot committed');
});

test('workflow.css defines the responsive shell with accessibility sizing', () => {
	const css = fs.readFileSync(path.join(ROOT, 'workflow.css'), 'utf8');
	assert.ok(css.includes('workflow-layout'), 'three-column layout grid');
	assert.ok(css.includes('@media (max-width: 767px)'), 'mobile breakpoint');
	assert.ok(css.includes('44px'), 'touch interactive target sizing');
	assert.ok(css.includes('data-bs-theme'), 'dark theme variables');
});

test('tabs.js registers a passthrough component without unmounting content', () => {
	const tabs = fs.readFileSync(path.join(ROOT, 'tabs.js'), 'utf8');
	assert.ok(tabs.includes('workflow-tabs'), 'registers workflow-tabs');
	assert.ok(tabs.includes('<slot></slot>'), 'renders children without filtering');
	assert.ok(!tabs.includes('v-if='), 'no panel is conditionally unmounted');
});

test('ui_foundation.js is loadable in Node and exposes the expected API', () => {
	const ui = require(path.join(ROOT, 'ui_foundation.js'));
	assert.equal(typeof ui.initUiFoundation, 'function');
	assert.equal(typeof ui.BUSINESS_RELATED_DEFAULTS, 'object');
});
