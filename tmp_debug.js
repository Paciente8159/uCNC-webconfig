const fs = require('fs');
const vm = require('vm');
const ROOT = 'C:/Users/JCEM/Documents/GitHub/uCNC-webconfig';
function load(ctx, file) {
	vm.runInContext(fs.readFileSync(ROOT + '/' + file, 'utf8'), ctx, { filename: file });
}
const events = {};
const windowObj = {
	addEventListener: (t, f) => { events[t] = f; },
	dispatchEvent: () => {},
	alert: (m) => console.log('ALERT:', m),
	confirm: () => true,
};
const ctx = {
	console,
	window: windowObj,
	Vue: { createApp() { return { component() { return this; }, mount() {} }; } },
	localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
	navigator: {},
	setTimeout,
	clearTimeout,
	Blob: function () {},
	FileReader: function () {},
	URL: { createObjectURL() { return ''; }, revokeObjectURL() {} },
	fetch: async () => ({ ok: true, text: async () => '' }),
	document: {
		createElement: () => ({ style: {}, setAttribute() {}, click() {} }),
		body: { appendChild() {}, removeChild() {} },
		documentElement: { setAttribute() {}, removeAttribute() {} },
	},
};
windowObj.window = windowObj;
vm.createContext(ctx);
load(ctx, 'options.js');
load(ctx, 'containers.js');
load(ctx, 'controls.js');
load(ctx, 'component_loader.js');
load(ctx, 'preprocessor.js');
load(ctx, 'ucnc_defaults.js');
load(ctx, 'ui_foundation.js');
load(ctx, 'configs.js');
const app = ctx.window.app_vars.app_state;
app.STEP0_BIT = 'A3';
app.STEP0_PORT = 'C';
console.log('STEP0 before:', app.STEP0_BIT, app.STEP0_PORT);
// Now instantiate foundation exactly like index.html does
const found = ctx.window.UiFoundation.initUiFoundation(ctx.window.app_vars, {});
console.log('found.resetPin type:', typeof found.resetPin);
console.log('found.resetPins type:', typeof found.resetPins);
if (typeof found.resetPin === 'function') {
	const c = found.resetPin('STEP0');
	console.log('count:', c);
	console.log('STEP0 after:', JSON.stringify([app.STEP0_BIT, app.STEP0_PORT]));
}