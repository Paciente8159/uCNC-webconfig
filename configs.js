async function parsePreprocessor(file, settings = [], recursive = false) {
	if (loadingfile) {
		return;
	}
	document.getElementById('reloading').style.display = "block";

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
			settings[matches[i][2]] = (matches[i][1] == "define") ? matches[i][3].replace(/[\s]*\/\/.*/gm, '').replace(/\/\*.*?\*\//gsm, '').trim() : '<undef>';
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
						if (field.nullable && is_empty(val)){
							break;
						}
						gentext += "#define " + options[i] + ((val) ? " true" : "false");
						break;
					case 'string':
						gentext += `#define ${options[i]} "${val}"\n`;
						break;
					default:
						if (field.nullable && is_empty(val)){
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
	var overrides = generate_user_config([...document.querySelectorAll('[config-file="boardmap"]')]/*.filter(y => !exclude.includes(y.id))*/.map(x => x.id), 'BOADMAP_OVERRIDES_H', "boardmap_reset", false);
	overrides += "//Custom configurations\n" + document.getElementById('CUSTOM_BOARDMAP_CONFIGS').value + '\n\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	return overrides;
}