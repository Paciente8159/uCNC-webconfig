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

	return { coerceForField, loadBoardDefaults, loadHalDefaults, replaceDefaults, safeKey };
});
