(function (root, factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory();
	} else if (root) {
		root.UiFoundation = factory();
	}
})(typeof window !== 'undefined' ? window : globalThis, function () {
	'use strict';

	var DRAFT_KEY = 'ucnc_config_draft_v1';
	var PREF_KEY = 'ucnc_ui_prefs_v1';
	var STEP_KEY = 'ucnc_workflow_step_v1';
	var FORMAT_VERSION = 1;

	var PROTECTED_DEFAULTS = ['VERSION', 'MCU', 'BOARD', 'CUSTOM_BOARDMAP_CONFIGS', 'CUSTOM_HAL_CONFIGS'];

	// Fallback "default" values for flags the configurator never exposes as fields.
	var BUSINESS_RELATED_DEFAULTS = {
		ENABLE_WIFI: false,
		USE_STATIC_IP: false,
		ENABLE_BLUETOOTH: false,
		ENABLE_STEPPERS_DISABLE_TIMEOUT: false,
		ENABLE_SKEW_COMPENSATION: false,
		SKEW_COMPENSATION_XY_ONLY: false,
		ENABLE_LINACT_PLANNER: false,
		ENABLE_LINACT_COLD_START: false,
		ENABLE_BACKLASH_COMPENSATION: false,
		ABC_INDEP_FEED_CALC: false,
		BRESENHAM_16BIT: false,
		ENABLE_BIT_DEBUG_EXTRA_CMD: false,
		ENABLE_EXTRA_SETTINGS_CMDS: false,
		RAM_ONLY_SETTINGS: false,
		ENABLE_G39_H_MAPPING: false,
		ENABLE_CANNED_CYCLES: false,
		ENABLE_RS274NGC_EXPRESSIONS: false,
		ENABLE_NAMED_PARAMETERS: false,
		ENABLE_O_CODES: false,
		ENABLE_COOLANT: false,
		ENABLE_LASER_PWM: false,
		ENABLE_LASER_PPI: false,
		ENABLE_PLASMA_THC: false,
		ENABLE_EMBROIDERY: false,
		ENABLE_MAIN_LOOP_MODULES: false,
		ENABLE_IO_MODULES: false,
		ENABLE_PARSER_MODULES: false,
		ENABLE_MOTION_CONTROL_MODULES: false,
		ENABLE_PLANNER_MODULES: false,
		DISABLE_SETTINGS_MODULES: false,
		ENABLE_ITP_FEED_TASK: false,
		ENABLE_ATC_HOOKS: false,
		ENABLE_RT_SYNC_MOTIONS: false,
		DISABLE_ALL_CONTROLS: false,
		DISABLE_ALL_LIMITS: false,
		DISABLE_PROBE: false,
		DISABLE_HAL_CONFIG_PROTECTION: false,
		FORCE_SOFT_POLLING: false,
		ENABLE_RT_LIMITS_CHECKING: false,
		ENABLE_RT_PROBE_CHECKING: false,
		ENABLE_MULTI_STEPPER_AXIS: false,
		ENABLE_AXIS_AUTOLEVEL: false,
		SOFT_SPI_ENABLED: false,
		ASSIGN_ENCODERS: false,
		ENABLE_ENCODER_RPM: false
	};

	function isProtectedKey(key) {
		return key.indexOf('__') === 0 || PROTECTED_DEFAULTS.indexOf(key) !== -1;
	}

	function sameValue(a, b) {
		if (typeof a === 'number' && typeof b === 'number') return a === b;
		return String(a) === String(b);
	}

	function commitDefaultsSnapshot(scope, boardDefaults, halDefaults) {
		scope.__boardDefaults = boardDefaults || {};
		scope.__halDefaults = halDefaults || {};
	}

	function knownDefaultFor(key, scope) {
		if (!scope.__boardDefaults || !scope.__halDefaults) return undefined;
		if (Object.prototype.hasOwnProperty.call(scope.__boardDefaults, key)) {
			return scope.__boardDefaults[key];
		}
		if (Object.prototype.hasOwnProperty.call(scope.__halDefaults, key)) {
			return scope.__halDefaults[key];
		}
		if (Object.prototype.hasOwnProperty.call(BUSINESS_RELATED_DEFAULTS, key)) {
			return BUSINESS_RELATED_DEFAULTS[key];
		}
		return undefined;
	}

	function isKeyModified(key, scope) {
		if (isProtectedKey(key)) return false;
		var defaultValue = knownDefaultFor(key, scope);
		if (defaultValue === undefined) return false;
		return !sameValue(scope.app_state[key], defaultValue);
	}

	function changedKeyList(scope) {
		return Object.keys(scope.app_state).filter(function (key) {
			return isKeyModified(key, scope);
		});
	}

	function countChanged(scope) {
		return changedKeyList(scope).length;
	}

	function runValidation(scope) {
		var state = scope.app_state;
		var options = scope.app_options || {};
		var findings = [];
		var seenGpio = {};
		var uintRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;

		function push(severity, setting, message) {
			findings.push({ severity: severity, setting: setting, message: message });
		}

		if (!state.MCU) {
			push('error', 'MCU', 'No MCU family selected. Select an MCU before generating the firmware configuration.');
		}
		if (!state.BOARD) {
			push('error', 'BOARD', 'No board selected. Select a board before generating the firmware configuration.');
		}
		if (!state.KINEMATIC) {
			push('error', 'KINEMATIC', 'No kinematic selected. Select the kinematic that matches your machine.');
		}

		// Duplicate physical pin detection: two µCNC pins must not reuse the same
		// port+bit (or IO offset) combination. Only boardmap _BIT entries count.
		var pins = (options.UCNCPINS || []).map(function (item) { return item.pin; });
		for (var i = 0; i < pins.length; i++) {
			var pin = pins[i];
			var bit = state[pin + '_BIT'];
			var port = state[pin + '_PORT'];
			var offset = state[pin + '_IO_OFFSET'];
			if (bit === '' || bit === undefined || bit === null) continue;
			if (offset !== '' && offset !== undefined && offset !== null) {
				// A pin defined through an IO extender offset must not collide with a
				// pin defined through a port+bit gpio.
			}
			// A physical pin is identified by its port+bit combination, not the bit
			// number alone: two pins on different ports may share the same bit.
			var key = offset !== '' && offset !== undefined ? 'offset:' + offset : 'gpio:' + (port || '?') + ':' + bit;
			if (Object.prototype.hasOwnProperty.call(seenGpio, key)) {
				push('error', pin + '_BIT', 'Physical pin ' + (offset !== '' && offset !== undefined ? offset : (port ? port + bit : bit)) + ' is assigned to more than one µCNC pin.');
			}
			seenGpio[key] = true;
		}

		// Board / MCU mismatch: the board list is already filtered by MCU, so a
		// mismatch can only happen through an imported JSON configuration.
		if (state.MCU && state.BOARD) {
			var boards = options.BOARDS || [];
			var match = boards.filter(function (item) { return item.id === state.BOARD; })[0];
			if (match && match.mcu && match.mcu.indexOf(state.MCU) === -1 && match.mcu !== 'MCU_AVR,MCU_SAMD21,MCU_STM32F0X,MCU_STM32F1X,MCU_STM32F4X,MCU_STM32H7X,MCU_LPC176X,MCU_ESP8266,MCU_ESP32,MCU_ESP32C3,MCU_ESP32S3,MCU_RP2040,MCU_RP2350') {
				push('error', 'BOARD', 'The selected board ' + (match.name || state.BOARD) + ' is not compatible with the selected MCU ' + state.MCU + '.');
			}
		}

		// Referenced but undefined pins: HAL, tool, and module pin fields point at a
		// µCNC pin name whose boardmap entry has no gpio, port, or offset assignment.
		var modules = options.MODULES_OPTIONS || [];
		for (var m = 0; m < modules.length; m++) {
			var mod = modules[m];
			if (!state[mod.id]) continue;
			if (mod.requires && mod.requires.length) {
				var unmet = mod.requires.split(',').map(function (s) { return s.trim(); }).filter(function (r) { return !state[r]; });
				for (var r = 0; r < unmet.length; r++) {
					push('error', mod.id, 'Module ' + mod.name + ' requires ' + unmet[r] + ' to be enabled first.');
				}
			}
			if (mod.pre_requires && mod.pre_requires.length) {
				var unmetPre = mod.pre_requires.split(',').map(function (s) { return s.trim(); }).filter(function (r) { return !state[r]; });
				for (var p = 0; p < unmetPre.length; p++) {
					push('error', mod.id, 'Module ' + mod.name + ' requires ' + unmetPre[p] + ' to be enabled first.');
				}
			}
		}

		var fieldKeys = Object.keys(scope.app_fields || {});
		for (var f = 0; f < fieldKeys.length; f++) {
			var key = fieldKeys[f];
			var field = scope.app_fields[key];
			if (field && field.type === 'int' && state[key] !== undefined && state[key] !== '' && state[key] !== null) {
				if (String(state[key]).length && !/^-?\d+$/.test(String(state[key]))) {
					push('warning', key, 'Expected an integer value.');
				}
			}
			if (key === 'CUSTOM_BOARDMAP_CONFIGS' || key === 'CUSTOM_HAL_CONFIGS') {
				if (typeof state[key] === 'string' && state[key].length) {
					var defs = state[key].match(/#define\s+([A-Za-z_][A-Za-z0-9_]*)/g) || [];
					for (var d = 0; d < defs.length; d++) {
						var macro = defs[d].replace(/^#define\s+/, '').trim();
						if (macro && !uintRegex.test(macro)) {
							push('warning', key, 'Custom ' + (key === 'CUSTOM_BOARDMAP_CONFIGS' ? 'boardmap' : 'HAL') + ' content contains a malformed #define.');
						}
					}
				}
			}
		}

		// Unsupported firmware features: MODULES_OPTIONS condition strings gate
		// platformio entry lists; when the selected version violates one, the
		// module would be compiled into the firmware but excluded from the build.
		var version = state.VERSION;
		for (var c = 0; c < modules.length; c++) {
			var candidate = modules[c];
			if (candidate.condition && state[candidate.id]) {
				var conditionOk = true;
				try {
					conditionOk = new Function('VERSION', 'return (' + candidate.condition.replace(/'/g, '"') + ');')(version);
				} catch (error) {
					conditionOk = true;
				}
				if (!conditionOk) {
					push('warning', candidate.id, 'Module ' + candidate.name + ' requires a newer firmware version. It may not build with the selected version.');
				}
			}
		}

		return findings;
	}

	function summarizeFindings(findings) {
		var errors = findings.filter(function (f) { return f.severity === 'error'; }).length;
		var warnings = findings.filter(function (f) { return f.severity === 'warning'; }).length;
		var status = errors > 0 ? 'action-required' : (warnings > 0 ? 'warnings' : 'ready');
		return { errors: errors, warnings: warnings, status: status };
	}

	function initUiFoundation(rootScope, api) {
		var scope = {
			__boardDefaults: {},
			__halDefaults: {},
			__board: api && api.board || '',
			__mcu: api && api.mcu || '',
			__draftAvailable: false,
			__lastStep: null
		};

		function readPreferences() {
			var prefs = {};
			try {
				prefs = JSON.parse(localStorage.getItem(PREF_KEY)) || {};
			} catch (error) {
				prefs = {};
			}
			return prefs;
		}

		function writePreferences(prefs) {
			try {
				localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
			} catch (error) {
				// Storage may be unavailable (private mode); preferences are non-essential.
			}
		}

		function refresh() {
			var findings = runValidation(rootScope);
			var summary = summarizeFindings(findings);
			var changedKeys = changedKeyList(rootScope);
			var previousKeys = rootScope.app_state.__CHANGED_KEYS || [];
			var keysEqual = previousKeys.length === changedKeys.length &&
				changedKeys.every(function (key, index) { return previousKeys[index] === key; });
			var count = changedKeys.length;
			var state = rootScope.app_state;
			if (state.__CHANGED_COUNT !== count) state.__CHANGED_COUNT = count;
			if (!keysEqual) state.__CHANGED_KEYS = changedKeys;
			if (state.__VALIDATION === undefined || JSON.stringify(state.__VALIDATION) !== JSON.stringify(findings)) state.__VALIDATION = findings;
			if (state.__VALIDATION_ERRORS !== summary.errors) state.__VALIDATION_ERRORS = summary.errors;
			if (state.__VALIDATION_WARNINGS !== summary.warnings) state.__VALIDATION_WARNINGS = summary.warnings;
			if (state.__VALIDATION_STATUS !== summary.status) state.__VALIDATION_STATUS = summary.status;
			if (state.__DIRTY !== (count > 0)) state.__DIRTY = count > 0;
		}

		var autosaveTimer = null;
		function autosave() {
			if (autosaveTimer) clearTimeout(autosaveTimer);
			autosaveTimer = setTimeout(function () {
				var draft = {};
				Object.keys(rootScope.app_state).forEach(function (key) {
					if (key.indexOf('__') === 0) return;
					draft[key] = rootScope.app_state[key];
				});
				try {
					localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
				} catch (error) {
					// Storage may be unavailable (private mode); autosave is best effort.
				}
			}, 500);
		}

		function restoreDraft() {
			try {
				var raw = localStorage.getItem(DRAFT_KEY);
				if (!raw) return false;
				var draft = JSON.parse(raw);
				Object.keys(draft).forEach(function (key) {
					if (key.indexOf('__') === 0) return;
					rootScope.app_state[key] = draft[key];
				});
				return true;
			} catch (error) {
				return false;
			}
		}

		function discardDraft() {
			try {
				localStorage.removeItem(DRAFT_KEY);
				return true;
			} catch (error) {
				return false;
			}
		}

		function saveCompleteSnapshot() {
			var snapshot = { format: FORMAT_VERSION, savedAt: new Date().toISOString(), state: {} };
			Object.keys(rootScope.app_state).forEach(function (key) {
				if (key.indexOf('__') === 0) return;
				snapshot.state[key] = rootScope.app_state[key];
			});
			var blob = new Blob([JSON.stringify(snapshot, null, '\t')], { type: 'application/json' });
			var a = document.createElement('a');
			var url = URL.createObjectURL(blob);
			a.href = url;
			a.download = 'ucnc_build.json';
			document.body.appendChild(a);
			a.click();
			setTimeout(function () {
				URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}, 100);
			return snapshot;
		}

		function coerceImportedValue(key, value, fields) {
			var field = fields[key];
			if (!field) return value;
			var type = field.type;
			if (value === null || value === undefined) return value;
			if (type === 'bool') {
				if (value === true || value === false) return value;
				return String(value).toLowerCase() !== 'false' && String(value) !== '0';
			}
			if (type === 'int') {
				var i = parseInt(value, 10);
				return Number.isNaN(i) ? value : i;
			}
			if (type === 'float') {
				var fl = parseFloat(value);
				return Number.isNaN(fl) ? value : fl;
			}
			return value;
		}

		function applyJsonConfig(json, options) {
			var parsed = null;
			if (typeof json === 'string') {
				try {
					parsed = JSON.parse(json);
				} catch (error) {
					return { ok: false, message: 'The selected file is not valid JSON.' };
				}
			} else {
				parsed = json;
			}
			if (!parsed || typeof parsed !== 'object') {
				return { ok: false, message: 'The selected file does not contain a configuration.' };
			}
			var imported = parsed.state || parsed;
			var preserved = [];
			Object.keys(imported).forEach(function (key) {
				if (key.indexOf('__') === 0) return;
				if (key in rootScope.app_state || key in rootScope.app_fields) {
					rootScope.app_state[key] = coerceImportedValue(key, imported[key], rootScope.app_fields);
				} else {
					preserved.push(key);
					rootScope.app_state[key] = imported[key];
				}
			});
			refresh();
			return { ok: true, preserved: preserved };
		}

		function checkDraft() {
			try {
				var raw = localStorage.getItem(DRAFT_KEY);
				scope.__draftAvailable = Boolean(raw);
			} catch (error) {
				scope.__draftAvailable = false;
			}
			return scope.__draftAvailable;
		}

		function defaultValueFor(key) {
			return knownDefaultFor(key, rootScope);
		}

		function changedDetails() {
			return Object.keys(rootScope.app_state)
				.filter(function (key) { return isKeyModified(key, rootScope); })
				.map(function (key) {
					return {
						key: key,
						defaultValue: knownDefaultFor(key, rootScope),
						currentValue: rootScope.app_state[key]
					};
				});
		}

		function resetKey(key) {
			var defaultValue = knownDefaultFor(key, rootScope);
			if (defaultValue === undefined) return false;
			rootScope.app_state[key] = defaultValue;
			return true;
		}

		function resetAllModified() {
			var keys = changedKeyList(rootScope);
			for (var i = 0; i < keys.length; i++) {
				resetKey(keys[i]);
			}
			return keys.length;
		}

		function goStep(stepId, steps) {
			var valid = (steps || []).some(function (s) { return s.id === stepId; });
			if (!valid) return false;
			rootScope.app_state.__WORKFLOW_STEP = stepId;
			try {
				localStorage.setItem(STEP_KEY, stepId);
			} catch (error) {
				// Storage may be unavailable; step persistence is best effort.
			}
			return true;
		}

		function resumeStep(steps) {
			try {
				var saved = localStorage.getItem(STEP_KEY);
				if (saved && (steps || []).some(function (s) { return s.id === saved; })) {
					rootScope.app_state.__WORKFLOW_STEP = saved;
					return saved;
				}
			} catch (error) {
				// Fall through to the default step.
			}
			if (steps && steps.length) {
				rootScope.app_state.__WORKFLOW_STEP = steps[0].id;
			}
			return rootScope.app_state.__WORKFLOW_STEP;
		}

		function initTheme() {
			var prefs = readPreferences();
			if (prefs.theme) {
				if (prefs.theme === 'dark') document.documentElement.setAttribute('data-bs-theme', 'dark');
				else document.documentElement.removeAttribute('data-bs-theme');
				return prefs.theme;
			}
			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				document.documentElement.setAttribute('data-bs-theme', 'dark');
				return 'dark';
			}
			return 'light';
		}

		function applyTheme(theme) {
			var prefs = readPreferences();
			prefs.theme = theme === 'dark' ? 'dark' : 'light';
			writePreferences(prefs);
			if (prefs.theme === 'dark') document.documentElement.setAttribute('data-bs-theme', 'dark');
			else document.documentElement.removeAttribute('data-bs-theme');
			return prefs.theme;
		}

		function toggleTheme() {
			var current = initTheme();
			return applyTheme(current === 'dark' ? 'light' : 'dark');
		}

		function setVisibility(level) {
			var prefs = readPreferences();
			prefs.visibility = level;
			writePreferences(prefs);
		}

		function getVisibility() {
			var prefs = readPreferences();
			return prefs.visibility || null;
		}

		return {
			applyJsonConfig: applyJsonConfig,
			applyTheme: applyTheme,
			autosave: autosave,
			changedDetails: changedDetails,
			changedKeyList: changedKeyList,
			checkDraft: checkDraft,
			commitDefaultsSnapshot: commitDefaultsSnapshot,
			countChanged: countChanged,
			defaultValueFor: defaultValueFor,
			discardDraft: discardDraft,
			getVisibility: getVisibility,
			goStep: goStep,
			initTheme: initTheme,
			isKeyModified: isKeyModified,
			refresh: refresh,
			resetAllModified: resetAllModified,
			resetKey: resetKey,
			restoreDraft: restoreDraft,
			resumeStep: resumeStep,
			runValidation: runValidation,
			saveCompleteSnapshot: saveCompleteSnapshot,
			setVisibility: setVisibility,
			summarizeFindings: summarizeFindings,
			toggleTheme: toggleTheme
		};
	}

	return {
		BUSINESS_RELATED_DEFAULTS: BUSINESS_RELATED_DEFAULTS,
		initUiFoundation: initUiFoundation
	};
});