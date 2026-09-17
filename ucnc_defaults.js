(function (root, factory) {
	const moduleValue = factory(root?.UcncPreprocessor);
	if (typeof module === 'object' && module.exports) module.exports = moduleValue;
	if (root) root.UcncDefaults = moduleValue;
})(typeof window !== 'undefined' ? window : globalThis, function (preprocessor) {
	'use strict';

	function safeKey(value) {
		return String(value).replace(/[^A-Za-z0-9._-]+/g, '__');
	}

	function normalizeMacroValue(value) {
		if (value === true || value === false || typeof value === 'number') return value;
		return String(value).trim();
	}

	function coerceForField(value, field) {
		const normalized = normalizeMacroValue(value);
		if (!field) return normalized;
		switch (field.type) {
			case 'bool': {
				if (normalized === true || normalized === false) return normalized;
				const lower = String(normalized).toLowerCase();
				if (['false', '0', 'off', 'no'].includes(lower)) return false;
				if (['true', '1', 'on', 'yes', ''].includes(lower)) return true;
				return Boolean(normalized);
			}
			case 'int': {
				const parsed = parseInt(String(normalized).replace(/[uUlL]+$/g, ''), 0);
				return Number.isNaN(parsed) ? normalized : parsed;
			}
			case 'float': {
				const parsed = parseFloat(String(normalized).replace(/[fFlL]+$/g, ''));
				return Number.isNaN(parsed) ? normalized : parsed;
			}
			case 'string':
				return String(normalized).replace(/^"|"$/g, '');
			default:
				return normalized;
		}
	}

	async function fetchJson(url, fetchImpl) {
		const response = await fetchImpl(url);
		if (!response.ok) throw new Error(`Manifest request failed (${response.status})`);
		return response.json();
	}

	function rawLoader(fetchImpl) {
		return async url => {
			const response = await fetchImpl(url);
			if (!response.ok) throw new Error(`Unable to load ${url} (${response.status})`);
			return response.text();
		};
	}

	function manifestUrl(ref, baseUrl) {
		return `${baseUrl.replace(/\/$/, '')}/${safeKey(ref)}/defaults.json`;
	}

	async function loadManifest(ref, { fetchImpl, manifestBaseUrl }) {
		return fetchJson(manifestUrl(ref, manifestBaseUrl), fetchImpl);
	}

	async function loadBoardDefaults({ ref, board, mcuPath, fetchImpl = fetch, manifestBaseUrl = './manifests' }) {
		try {
			const manifest = await loadManifest(ref, { fetchImpl, manifestBaseUrl });
			const entry = manifest.boards?.[board];
			if (entry) return { ...entry, metadata: manifest.metadata, source: 'manifest', diagnostics: entry.diagnostics || [] };
		} catch (_error) {
			// An absent manifest is expected for arbitrary tags, branches, and commits.
		}
		if (!preprocessor) throw new Error('UcncPreprocessor is required when no manifest is available');
		const rootUrl = `https://raw.githubusercontent.com/Paciente8159/uCNC/${encodeURI(ref)}/uCNC/`;
		const loader = rawLoader(fetchImpl);
		const boardResult = await preprocessor.preprocess({ entryFile: new URL(board, rootUrl).href, loadFile: loader });
		const mcuResult = await preprocessor.preprocess({ entryFile: new URL(mcuPath, rootUrl).href, predefinedMacros: boardResult.macros, loadFile: loader });
		return {
			macros: mcuResult.macros,
			boardMacros: boardResult.macros,
			metadata: { requestedRef: ref, generator: 'browser-fallback' },
			source: 'browser-fallback',
			diagnostics: [...boardResult.diagnostics, ...mcuResult.diagnostics],
		};
	}

	async function loadHalDefaults({ ref, fetchImpl = fetch, manifestBaseUrl = './manifests' }) {
		try {
			const manifest = await loadManifest(ref, { fetchImpl, manifestBaseUrl });
			if (manifest.hal) return { macros: manifest.hal.macros, metadata: manifest.metadata, source: 'manifest', diagnostics: manifest.hal.diagnostics || [] };
		} catch (_error) {
			// Fall through to browser preprocessing.
		}
		if (!preprocessor) throw new Error('UcncPreprocessor is required when no manifest is available');
		const rootUrl = `https://raw.githubusercontent.com/Paciente8159/uCNC/${encodeURI(ref)}/uCNC/`;
		const result = await preprocessor.preprocess({ entryFile: new URL('cnc_hal_config.h', rootUrl).href, loadFile: rawLoader(fetchImpl) });
		return {
			macros: result.macros,
			metadata: { requestedRef: ref, generator: 'browser-fallback' },
			source: 'browser-fallback',
			diagnostics: result.diagnostics,
		};
	}

	function replaceDefaults(scope, macros, layerName) {
		const state = scope.app_state;
		const previousKeys = scope[layerName] || [];
		const protectedKeys = new Set(['VERSION', 'MCU', 'BOARD', 'CUSTOM_BOARDMAP_CONFIGS', 'CUSTOM_HAL_CONFIGS']);
		for (const key of previousKeys) {
			if (!protectedKeys.has(key)) delete state[key];
		}
		const keys = Object.keys(macros);
		for (const key of keys) state[key] = coerceForField(macros[key], scope.app_fields[key]);
		scope[layerName] = keys;
	}

	const LAYER_CUSTOM_BLOCK_MAP = {
		'__boardDefaultKeys': 'CUSTOM_BOARDMAP_CONFIGS',
		'__halDefaultKeys': 'CUSTOM_HAL_CONFIGS',
	};

	const MACHINE_IDENTITY = new Set(['KINEMATIC', 'MP_SCARA', 'AXIS_COUNT', 'BAUDRATE']);

	function filterCustomBlock(text, baselineMacros, mode) {
		if (!text) return '';
		return text.split('\n')
			.map(line => line.trim())
			.filter(line => {
				if (!line) return false;
				const match = line.match(/^#\s*define\s+(\w+)/);
				if (!match) return true;
				const name = match[1];
				if (mode === 'keep-filter') {
					return Object.prototype.hasOwnProperty.call(baselineMacros, name);
				} else {
					return !Object.prototype.hasOwnProperty.call(baselineMacros, name);
				}
			})
			.join('\n');
	}

	/**
	 * keepFilter — VERSION change mode (applied to both board and HAL layers).
	 *
	 * Keeps every state value whose key is present in the new baseline (never overwrites),
	 * deletes state keys absent from the baseline, writes coerced defaults for baseline
	 * keys not currently in state. Custom-block defines absent from the baseline are dropped.
	 * Protected keys (VERSION, MCU, BOARD, CUSTOM_*) are never touched.
	 *
	 * Returns the array of dropped (deleted) key names.
	 */
	function keepFilter(scope, macros, layerName) {
		const state = scope.app_state;
		const previousKeys = scope[layerName] || [];
		const dropped = [];
		const fields = scope.app_fields || {};
		const customBlockKey = LAYER_CUSTOM_BLOCK_MAP[layerName];
		const baselineKeySet = new Set(Object.keys(macros));
		const PROTECTED_KEYS = new Set(['VERSION', 'MCU', 'BOARD', 'CUSTOM_BOARDMAP_CONFIGS', 'CUSTOM_HAL_CONFIGS']);

		// Phase 1: delete state keys absent from the new baseline (except protected)
		for (const key of previousKeys) {
			if (PROTECTED_KEYS.has(key)) continue;
			if (!baselineKeySet.has(key)) {
				delete state[key];
				dropped.push(key);
			}
		}

		// Phase 2: ensure every baseline key is present in state (write coerced default if missing)
		for (const key of Object.keys(macros)) {
			if (PROTECTED_KEYS.has(key)) continue;
			if (!Object.prototype.hasOwnProperty.call(state, key)) {
				state[key] = coerceForField(macros[key], fields[key]);
			}
		}

		// Phase 3: reconcile the key list
		scope[layerName] = Object.keys(macros);

		// Phase 4: filter the layer's custom block (version mode — drop defines absent from baseline)
		if (customBlockKey && Object.prototype.hasOwnProperty.call(state, customBlockKey)) {
			state[customBlockKey] = filterCustomBlock(state[customBlockKey], macros, 'keep-filter');
		}

		return dropped;
	}

	/**
	 * resetFilter — BOARD/MCU change mode (applied to the board layer only).
	 *
	 * Replaces the layer values with the new baseline, then lets user values that still
	 * exist in the new baseline survive. Machine identity fields (KINEMATIC, MP_SCARA,
	 * AXIS_COUNT, BAUDRATE) are exempt from deletion. Custom-block defines are dropped
	 * only when the new baseline re-defines them (collision). Protected keys are never touched.
	 *
	 * Returns the array of dropped key names.
	 */
	function resetFilter(scope, macros, layerName) {
		const state = scope.app_state;
		const previousKeys = scope[layerName] || [];
		const dropped = [];
		const fields = scope.app_fields || {};
		const customBlockKey = LAYER_CUSTOM_BLOCK_MAP[layerName];
		const baselineKeySet = new Set(Object.keys(macros));
		const PROTECTED_KEYS = new Set(['VERSION', 'MCU', 'BOARD', 'CUSTOM_BOARDMAP_CONFIGS', 'CUSTOM_HAL_CONFIGS']);

		// Phase 0: save user values for keys that exist in the new baseline
		const savedUserValues = {};
		for (const key of previousKeys) {
			if (PROTECTED_KEYS.has(key)) continue;
			if (key in state) {
				if (MACHINE_IDENTITY.has(key)) {
					// Machine identity always survives
					savedUserValues[key] = state[key];
				} else if (baselineKeySet.has(key)) {
					// User value exists in new baseline — save for restoration
					savedUserValues[key] = state[key];
				}
			}
		}
		// Also capture any non-layer keys (set via UI after defaults loaded) that are in the baseline
		for (const key of Object.keys(macros)) {
			if (PROTECTED_KEYS.has(key) || MACHINE_IDENTITY.has(key)) continue;
			if (!(key in savedUserValues) && key in state) {
				savedUserValues[key] = state[key];
			}
		}

		// Phase 1: delete previous layer keys (except protected and machine identity)
		for (const key of previousKeys) {
			if (PROTECTED_KEYS.has(key)) continue;
			if (MACHINE_IDENTITY.has(key)) continue;
			delete state[key];
		}

		// Phase 2: write new baseline values
		for (const key of Object.keys(macros)) {
			if (PROTECTED_KEYS.has(key)) continue;
			state[key] = coerceForField(macros[key], fields[key]);
		}

		// Phase 3: restore saved user values (kept + baseline-present)
		for (const [key, value] of Object.entries(savedUserValues)) {
			state[key] = value;
		}

		// Phase 4: reconcile key list (baseline keys + machine identity not in baseline)
		const newKeys = Object.keys(macros);
		for (const key of MACHINE_IDENTITY) {
			if (key in state && !newKeys.includes(key)) {
				newKeys.push(key);
			}
		}
		scope[layerName] = newKeys;

		// Compute dropped: old layer keys absent from new baseline (excl. protected + machine identity)
		for (const key of previousKeys) {
			if (PROTECTED_KEYS.has(key)) continue;
			if (MACHINE_IDENTITY.has(key)) continue;
			if (!baselineKeySet.has(key)) {
				dropped.push(key);
			}
		}

		// Phase 5: filter the layer's custom block (reset mode — drop only collisions)
		if (customBlockKey && Object.prototype.hasOwnProperty.call(state, customBlockKey)) {
			state[customBlockKey] = filterCustomBlock(state[customBlockKey], macros, 'reset-filter');
		}

		return dropped;
	}

	return { coerceForField, keepFilter, loadBoardDefaults, loadHalDefaults, replaceDefaults, resetFilter, safeKey };
});
