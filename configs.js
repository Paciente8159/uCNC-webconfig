window.resetPins = function (scope) {
	const pins = scope.$root.app_options.UCNCPINS;
	const pindefs = ['_BIT', '_PORT', '_CHANNEL', '_MUX', '_TIMER', '_IO_OFFSET']
	for (let i = 0; i < pins.length; i++) {
		for (let j = 0; j < pindefs.length; j++) {
			if (scope.$root.app_state[pins[i].pin + pindefs[j]])
				scope.$root.app_state[pins[i].pin + pindefs[j]] = "";
		}
	}
	scope.$root.app_state['CUSTOM_BOARDMAP_CONFIGS'] = '';
}

async function parsePreprocessor(file, settings = [], recursive = false) {
	// if (loadingfile) {
	// 	return;
	// }
	// document.getElementById('reloading').style.display = "block";

	var response = await fetch(file);
	if (response.ok) {
		var allText = await response.text();
		// not correctly recursive but works well enough to get the base boards
		if (recursive) {
			const includeregex = /^[\s]*#include[^'"]*(?<inc>[\-\w\d\.]+|"[^"]+")?/gm
			const includefiles = [...allText.matchAll(includeregex)];
			for (var i = 0; i < includefiles.length; i++) {
				var basefile = file.substring(0, file.lastIndexOf('/') + 1) + includefiles[i][1].replace(/['"]+/g, '');
				settings = await parsePreprocessor(basefile, settings, recursive);
			}
		}
		const defineregex = (!recursive) ? /^[\s]*#(define)[\s]+(?<def>[\w\d]+)(?<val>[^\n]*)$/gm : /^[\s]*#(define|undef)[\s]+(?<def>[\w\d]+)(?<val>[^\n]*)$/gm;
		const matches = [...allText.matchAll(defineregex)];
		for (var i = 0; i < matches.length; i++) {
			settings[matches[i][2]] = (matches[i][1] == "define") ? matches[i][3].replace(/[\s]*\/\/.*/gm, '').replace(/\/\*.*?\*\//gsm, '').trim() : delete settings[matches[i][2]];
		}
	}

	return settings;
}

function is_empty(value) {
	if (!val) {
		return true;
	}

	if (val != "") {
		return true;
	}

	return false;
}

function generate_user_config(options, defguard, reset_file = "", close = true) {
	options = options.filter(y => y.length > 0);
	var gentext = '#ifndef ' + defguard + '\n#define ' + defguard + '\n#ifdef __cplusplus\nextern "C"\n{\n#endif\n\n';
	if (reset_file !== "") {
		gentext += "#include \"" + reset_file + ".h\"\n";
	}

	for (var i = 0; i < options.length; i++) {
		let val = window.app_vars.app_state[options[i]];
		let field = window.app_vars.app_fields[options[i]];
		if (val) {
			if (reset_file === "") {
				// gentext += "//undefine " + options[i] + "\n";
				// gentext += "#ifdef " + options[i] + "\n#undef " + options[i] + "\n#endif\n";
				gentext += "#undef " + options[i] + "\n";
			}
			else {
				switch (field.type) {
					case 'bool':
						if (field.nullable && is_empty(val)) {
							break;
						}
						gentext += "#define " + options[i] + ((val) ? " true" : "false");
						break;
					case 'string':
						gentext += `#define ${options[i]} "${val}"\n`;
						break;
					default:
						if (field.nullable && is_empty(val)) {
							break;
						}
						gentext += `#define ${options[i]} ${val}\n`;
						break;
				}
			}
		}

	}

	if (close) {
		gentext += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	}

	return gentext;
}

function generateBoardmapOverrides() {
	// var exclude = [...document.querySelectorAll('[config-file="boardmap"]')].map(x => x.id);
	var overrides = generate_user_config(Object.entries(window.app_vars.app_fields).filter(([k, v]) => v.file == 'boardmap').map(([k]) => k), 'BOADMAP_OVERRIDES_H', "boardmap_reset", false);
	overrides += "//Custom configurations\n" + document.getElementById('CUSTOM_BOARDMAP_CONFIGS').value + '\n\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	return overrides;
}

function startLoadAnimation() {
	document.getElementById('app_main').classList.add('d-none');
	document.getElementById('app_loader').classList.remove('d-none');
}

function endLoadAnimation() {
	document.getElementById('app_loader').classList.add('d-none');
	document.getElementById('app_main').classList.remove('d-none');
}


/**
 * Handle events
 * 
 */
window.boardChanged = async function (scope, target) {
	startLoadAnimation();
	window.resetPins(scope);
	await scope.$nextTick();
	const version_name = scope.$root.app_options.VERSIONS.filter(i => i.tag == scope.$root.app_state.VERSION)[0].id;
	const coreurl = "https://raw.githubusercontent.com/Paciente8159/uCNC/" + version_name;

	const mcuurl = coreurl + "/uCNC/" + scope.$root.app_options.MCUS.filter(i => i.id == scope.$root.app_state.MCU)[0].url;
	let settings = [];
	settings = await parsePreprocessor(mcuurl, [], false);
	Object.keys(scope.$root.app_state).forEach(element => {
		if (settings[element]) {
			scope.$root.app_state[element] = settings[element];
		}
	});

	const boardurl = coreurl + "/uCNC/" + scope.$root.app_state.BOARD;
	settings = await parsePreprocessor(boardurl, [], true);
	Object.keys(scope.$root.app_state).forEach(element => {
		if (settings[element]) {
			scope.$root.app_state[element] = settings[element];
		}
	});

	Object.keys(settings).forEach(element => {
		if (settings[element] && scope.$root.app_state[element] == undefined) {
			scope.$root.app_state['CUSTOM_BOARDMAP_CONFIGS'] = scope.$root.app_state['CUSTOM_BOARDMAP_CONFIGS'] + `#define ${element} ${settings[element]}\n`;
		}
	});

	await scope.$nextTick();
	endLoadAnimation();
}

window.mcuChanged = async function (scope, target) {
	startLoadAnimation();
	window.resetPins(scope);
	await scope.$nextTick();
	endLoadAnimation();
}

window.halChanged = async function (scope, target) {
	startLoadAnimation();
	scope.$root.app_state['CUSTOM_HAL_CONFIGS'] = '';
	var settings = [];
	const version_name = scope.$root.app_options.VERSIONS.filter(i => i.tag == scope.$root.app_state.VERSION)[0].id;
	const coreurl = "https://raw.githubusercontent.com/Paciente8159/uCNC/" + version_name;
	const hal = coreurl + "/uCNC/cnc_hal_config.h";

	settings = await parsePreprocessor(hal, settings);
	Object.keys(scope.$root.app_state).forEach(element => {
		if (settings[element]) {
			scope.$root.app_state[element] = settings[element];
		}
	});
	await scope.$nextTick();
	endLoadAnimation();
}