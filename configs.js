var pioinicontent = "";
function getPIOContent() {
	var response = fetch("https://raw.githubusercontent.com/Paciente8159/uCNC/refs/heads/master/platformio.ini").then((response) => {
		if (response.ok) {
			return response.text();
		}
	}).then(text => pioinicontent = text);
}

getPIOContent();

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

function is_empty(val) {
	if (val === undefined) {
		return true;
	}
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
		try {
			let val = window.app_vars.app_state[options[i]];
			let field = window.app_vars.app_fields[options[i]];
			if (val != undefined) {
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
		catch (e) {
			debugger;
		}
	}

	if (close) {
		gentext += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	}

	return gentext;
}

function generateBoardmapOverrides(rootscope = window.app_vars) {
	// var exclude = [...document.querySelectorAll('[config-file="boardmap"]')].map(x => x.id);
	var overrides = generate_user_config(Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('boardmap')).map(([k]) => k), 'BOADMAP_OVERRIDES_H', "boardmap_reset", false);
	overrides += "//Custom configurations\n" + rootscope.app_state.CUSTOM_BOARDMAP_CONFIGS + '\n\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	return overrides;
}

function generateBoardmapReset(rootscope = window.app_vars) {
	var overrides = generate_user_config(Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('boardmap')).map(([k]) => k), 'BOADMAP_RESET_H', '', false);
	var customs = rootscope.app_state.CUSTOM_BOARDMAP_CONFIGS;
	var defs = [...customs.matchAll(/#define[\s]+(?<def>[\w_]+)/gm)];
	defs.forEach((e) => {
		overrides += "#undef " + e[1] + "\n";
	});
	overrides += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	return overrides;
}

function generateHalReset(rootscope = window.app_vars) {
	var overrides = generate_user_config(Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('hal')).map(([k]) => k), 'CNC_HAL_RESET_H', '', false);
	var customs = rootscope.app_state.CUSTOM_HAL_CONFIGS;
	var defs = [...customs.matchAll(/#define[\s]+(?<def>[\w_]+)/gm)];
	defs.forEach((e) => {
		overrides += "#undef " + e[1] + "\n";
	});
	overrides += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	return overrides;
}

function generateHalOverrides(rootscope = window.app_vars) {
	var overrides = generate_user_config(Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('hal')).map(([k]) => k), 'CNC_HAL_OVERRIDES_H', "cnc_hal_reset", false);

	var modules = Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('module')).map(([k]) => k);
	var active_modules = Object.entries(rootscope.app_state).filter(([k, v]) => modules.includes(k) && v).map(([k]) => k);

	overrides += "//Custom configurations\n" + rootscope.app_state.CUSTOM_HAL_CONFIGS + "\n";

	if (active_modules.length) {
		overrides += "\n#define LOAD_MODULES_OVERRIDE() ({"
		for (var i = 0; i < active_modules.length; i++) {
			overrides += "LOAD_MODULE(" + active_modules[i] + ");";
		}
		overrides += "})\n"
	}

	overrides += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	return overrides;
}

function generatePIOOverrides(rootscope = window.app_vars) {
	var modules = Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('module')).map(([k]) => k);
	var active_modules = Object.entries(rootscope.app_state).filter(([k, v]) => modules.includes(k) && v).map(([k]) => k);

	var lib_deps = "lib_deps = \n";
	var build_flags = "build_flags = \n";
	var customflags = rootscope.app_state.CUSTOM_PIO_BUILDFLAGS;
	if (customflags && customflags.length) {
		var flags = [...customflags.split(/\n/)];
		for (var i = 0; i < flags.length; i++) {
			build_flags += "\t" + flags;
		}
	}
	if (active_modules && active_modules.length) {
		var includes = ""
		for (var i = 0; i < active_modules.length; i++) {
			var mod = rootscope.app_options.MODULES_OPTIONS.find((x) => { return x.id == active_modules[i] });
			if (mod.pre_requires && mod.pre_requires.length) {
				includes += mod.pre_requires.replace(/,\s*$/, "") + ", ";
			}
			includes += active_modules[i] + ", ";
			if (mod.requires && mod.requires.length) {
				includes += mod.requires.replace(/,\s*$/, "") + ", ";
			}

			if (mod.lib_deps && mod.lib_deps.length) { lib_deps += "\t" + mod.lib_deps + "\n"; }
			if (mod.build_flags && mod.build_flags.length) { build_flags += "\t" + mod.build_flags + "\n"; }
		}
		lib_deps = "custom_ucnc_modules = " + includes.replace(/,\s*$/, "") + "\n" + lib_deps;
		lib_deps = "custom_ucnc_modules_url = " + rootscope.app_options.VERSIONS.filter(obj => { return obj.tag === rootscope.app_state.VERSION; })[0].mods + "\n" + lib_deps;
	}
	else {
		lib_deps = "custom_ucnc_modules_url =\ncustom_ucnc_modules =\n" + lib_deps;
	}

	var customboard = rootscope.app_state.CUSTOM_PIO_BOARD;
	if (customboard && customboard.length) {
		customboard = "board = " + customboard + "\n";
	}
	customparams = rootscope.app_state.CUSTOM_PIO_CONFIGS;
	customparams = ((customboard) ? customboard : "board = \n") + ((customparams) ? customparams : "");
	var overrides = pioinicontent.trimEnd().substring(0, pioinicontent.indexOf(";user config"));
	overrides += ";µCNC web builder generated config\n";
	overrides += build_flags.trimEnd() + "\n" + lib_deps.trimEnd() + "\n" + customparams.trimEnd() + "\n";
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

window.loadConfigFile = async function (scope, event) {
	var file = event.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	startLoadAnimation();

	reader.onload = function (e) {
		scope.$root.app_state = JSON.parse(e.target.result);
		scope.$nextTick();
		endLoadAnimation();
	};

	reader.readAsText(file);
}

window.loadGenerateConfig = async function (scope, event) {
	event.preventDefault = true;
	const zip = new JSZip();

	// Create multiple files and add them to the ZIP file
	zip.file('uCNC/boardmap_overrides.h', generateBoardmapOverrides(scope.$root));
	zip.file('uCNC/boardmap_reset.h', generateBoardmapReset(scope.$root));
	zip.file('uCNC/cnc_hal_overrides.h', generateHalOverrides(scope.$root));
	zip.file('uCNC/cnc_hal_reset.h', generateHalReset(scope.$root));
	zip.file('platformio.ini', generatePIOOverrides(scope.$root));


	zip.file('ucnc_build.json', JSON.stringify(scope.$root.app_state));

	// Generate the zip file asynchronously
	zip.generateAsync({ type: "blob" }).then(function (content) {
		const a = document.createElement('a');
		const url = URL.createObjectURL(content);

		// Set the download attribute and href for the anchor
		a.href = url;
		a.download = 'uCNC config.zip';

		// Programmatically click the anchor to trigger the download
		a.click();

		// Clean up
		URL.revokeObjectURL(url);
		document.removeChild(a);
	});
}

window.copyBoardmapReset = async function (scope, event) {
	navigator.clipboard.writeText(generateBoardmapReset(scope.$root))
        .then(() => {
            alert('Code copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

window.copyBoardmapOverride = async function (scope, event) {
	navigator.clipboard.writeText(generateBoardmapOverrides(scope.$root))
        .then(() => {
            alert('Code copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

window.copyHalReset = async function (scope, event) {
	navigator.clipboard.writeText(generateHalReset(scope.$root))
        .then(() => {
            alert('Code copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

window.copyHalOverride = async function (scope, event) {
	navigator.clipboard.writeText(generateHalOverrides(scope.$root))
        .then(() => {
            alert('Code copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

window.copyPioOverride = async function (scope, event) {
	navigator.clipboard.writeText(generatePIOOverrides(scope.$root))
        .then(() => {
            alert('Code copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}
