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

// Processes a conditional block starting with a "#if" line.
// It collects branches for the #if and any corresponding
// #elif/#else until the matching #endif is reached.
// Each branch has a condition and an array of lines.
// function processConditionalBlock(lines, startIndex, settings) {
// 	let branches = [];
// 	// Capture the condition from the #if.
// 	let ifLine = lines[startIndex];
// 	let matchIf = ifLine.match(/^#if\s+(.*)/);
// 	let currentCondition = matchIf[1].trim();
// 	let branchContent = [];
// 	let i = startIndex + 1;
// 	let nesting = 1;

// 	// Process lines until the matching #endif is found.
// 	while (i < lines.length) {
// 		let line = lines[i];
// 		// If we see another #if, increase nesting and include it as is.
// 		if (/^#if\s+/.test(line)) {
// 			nesting++;
// 			branchContent.push(line);
// 			i++;
// 			continue;
// 		}
// 		// When we encounter an #endif, decrease nesting.
// 		// At nesting level 1 this ends the current conditional block.
// 		if (/^#endif\b/.test(line)) {
// 			nesting--;
// 			if (nesting === 0) {
// 				branches.push({ condition: currentCondition, content: branchContent });
// 				i++; // move past the #endif
// 				break;
// 			} else {
// 				branchContent.push(line);
// 				i++;
// 				continue;
// 			}
// 		}
// 		// At nesting level 1, a new branch begins with #elif.
// 		if (nesting === 1 && /^#elif\s+/.test(line)) {
// 			branches.push({ condition: currentCondition, content: branchContent });
// 			let m = line.match(/^#elif\s+(.*)/);
// 			currentCondition = m[1].trim();
// 			branchContent = [];
// 			i++;
// 			continue;
// 		}
// 		// Similarly, at nesting level 1, #else starts a new branch.
// 		if (nesting === 1 && /^#else\b/.test(line)) {
// 			branches.push({ condition: currentCondition, content: branchContent });
// 			currentCondition = "else"; // marker for unconditional branch
// 			branchContent = [];
// 			i++;
// 			continue;
// 		}
// 		branchContent.push(line);
// 		i++;
// 	}
// 	// If the last branch was an #else branch, add its content.
// 	if (currentCondition === "else") {
// 		branches.push({ condition: "else", content: branchContent });
// 	}

// 	// Evaluate each branch in order and choose the first branch whose condition evaluates to true.
// 	// For branches other than "else", we dynamically build an eval string that declares all current settings.
// 	// If none of the conditions are true, then if there is an "else" branch it will be processed.
// 	let activeContent = [];
// 	for (let branch of branches) {
// 		if (branch.condition === "else") {
// 			activeContent = branch.content;
// 			break;
// 		} else {
// 			let declarations = "";
// 			for (let key in settings) {
// 				// It is assumed that the settings values are numbers / strings that evaluate correctly.
// 				declarations += `var ${key} = ${settings[key]}; `;
// 			}
// 			let evalStr = declarations + `return (${branch.condition});`;
// 			try {
// 				let func = new Function(evalStr);
// 				if (func()) {
// 					activeContent = branch.content;
// 					break;
// 				}
// 			} catch (e) {
// 				// If evaluation fails, treat as false and move to the next branch
// 			}
// 		}
// 	}

// 	// Process the chosen branch recursively in case it contains nested conditionals.
// 	let processed = processBlock(activeContent);
// 	return { blockLines: processed.resultLines, newIndex: i };
// }
function isValidSyntax(code) {
	try {
		new Function(code); // Attempt to create a new function
		return true; // No syntax errors
	} catch (error) {
		return false; // Syntax error occurred
	}
}

function syncFetchText(url) {
	const xhr = new XMLHttpRequest();
	xhr.open('GET', url, false);  // third param = false → synchronous
	xhr.send(null);
	if (xhr.status >= 200 && xhr.status < 300) {
		return xhr.responseText;
	}
	throw new Error(`Failed to load ${url}: ${xhr.status}`);
}

function processConditionalBlockSync(file, lines, startIndex = 0, settings = [], recursive = false) {
	let branches = [];
	let ifLine = lines[startIndex];
	let currentCondition = "";

	// Convert the starting directive (#if, #ifdef, #ifndef) into a JS evaluable condition.
	if (/^#if\b/.test(ifLine)) {
		let match = ifLine.match(/^#if\s*(.*)/);
		currentCondition = match[1].trim();
	} else if (/^#ifdef\b/.test(ifLine)) {
		let match = ifLine.match(/^#ifdef\s*(\w+)/);
		// If defined means that the variable must exist in scope.
		currentCondition = "defined(" + match[1].trim() + ")";
	} else if (/^#ifndef\b/.test(ifLine)) {
		let match = ifLine.match(/^#ifndef\s*(\w+)/);
		currentCondition = "!defined(" + match[1].trim() + ")";
	}

	while (/defined\b[\s]*([a-zA-Z_][\w_]*)/.test(currentCondition)) {
		let match = currentCondition.match(/defined\b[\s]*([a-zA-Z_][\w_]*)/);
		let varName = match[1].trim();
		currentCondition = currentCondition.replace(match[0], `(typeof ${varName} !== 'undefined')`);
	}

	while (/defined\b[\s]*\((?:[^()]|\((?:[^()]*|\([^()]*\))*\))*\)/.test(currentCondition)) {
		let match = currentCondition.match(/defined\b[\s]*(\((?:[^()]|\((?:[^()]*|\([^()]*\))*\))*\))/);
		let varName = match[1].trim();
		currentCondition = currentCondition.replace(match[0], `(typeof ${varName} !== 'undefined')`);
	}

	let branchContent = [];
	let i = startIndex + 1;
	let nesting = 1;
	let conditionalBlockExit = 1;

	// Process each subsequent line until we get to the corresponding #endif.
	while (i < lines.length) {
		let line = lines[i];
		// If a new nested conditional starts (#if, #ifdef, or #ifndef), increase nesting.
		if (/^(#if|#ifdef|#ifndef)\b/.test(line)) {
			nesting++;
			branchContent.push(line);
			i++;
			continue;
		}
		// When encountering an #endif, decrement nesting.
		if (/^#endif\b/.test(line)) {
			nesting--;
			if (nesting === 0) {
				branches.push({ condition: currentCondition, content: branchContent });
				i++;  // Move past the #endif.
				conditionalBlockExit = i;
				break;
			} else {
				branchContent.push(line);
				i++;
				continue;
			}
		}
		// At nesting level 1, if an #elif appears then treat it as ending the current branch.
		if (nesting === 1 && /^#elif\b/.test(line)) {
			branches.push({ condition: currentCondition, content: branchContent });
			let match = line.match(/^#elif\s*(.*)/);
			currentCondition = match[1].trim();
			branchContent = [];
			i++;
			continue;
		}
		// At nesting level 1, handle an #else directive.
		if (nesting === 1 && /^#else\b/.test(line)) {
			branches.push({ condition: currentCondition, content: branchContent });
			currentCondition = "else"; // Special marker for the unconditional branch.
			branchContent = [];
			i++;
			continue;
		}
		branchContent.push(line);
		i++;
	}
	// For an #else branch add its content.
	if (currentCondition === "else") {
		branches.push({ condition: "else", content: branchContent });
	}

	// Evaluate the branches. For non-else branches, build an evaluation string that declares
	// all current settings as JavaScript variables.

	let activeContent = [];
	for (let branch of branches) {
		if (branch.condition === "else") {
			activeContent = branch.content;
			break;
		} else {
			let declarations = "";
			for (let key in settings) {
				let decl = `var ${key} = ${settings[key]}; `;
				if (isValidSyntax(decl)) {
					declarations += `var ${key} = ${settings[key]}; `;
				}
			}
			let evalStr = declarations + `return (${branch.condition});`;
			try {
				let func = new Function(evalStr);
				if (func()) {
					settings = processBlockSync(file, activeContent, settings, recursive);
					break;
				}
			} catch (e) {
				// If evaluation fails, continue to next branch.
			}
		}
	}

	// Recursively process the chosen branch for further nested conditionals.
	return processBlockSync(file, lines.slice(conditionalBlockExit), settings, recursive);
}

// Recursively process conditional blocks. We use a helper that
// processes normal lines until it finds a conditional directive.
function processBlockSync(file, lines, settings = [], recursive = false) {
	let i = 0;
	while (i < lines.length) {
		// Update the condition to handle #if, #ifdef, and #ifndef.
		if (/^(#ifndef|#ifdef|#if)\b/.test(lines[i])) {
			settings = processConditionalBlockSync(file, lines, i, settings, recursive);
		}
		// End-of-block markers should break processing.
		else if (/^#(elif|else|endif)\b/.test(lines[i])) {
			break;
		} else {
			settings = processLineSync(file, lines[i], settings, recursive);
		}
		i++;
	}
	return settings;
}

function processLineSync(file, line, settings = [], recursive = false) {
	// If recursive, process include files.
	if (recursive) {
		const includeregex = /^[\s]*#include[^'"]*(?<inc>[\-\w\d\.]+|"[^"]+")?/gm;
		const includefiles = [...line.matchAll(includeregex)];
		for (let i = 0; i < includefiles.length; i++) {
			// Remove quotes from the file name.
			let includedFile = includefiles[i][1].replace(/['"]+/g, '');
			let basefile = file.substring(0, file.lastIndexOf('/') + 1) + includedFile;
			// Recursively merge settings from the included file.
			settings = parsePreprocessorAdvancedSync(basefile, settings, recursive);
		}
	}

	// Finally, process the #define and #undef directives.
	// We also remove any inline comments that appear after the directive.
	const defineRegex = /^#(define|undef)\b\s*([\a-zA-Z_][\w\d_]*(\((?:[^()]|\((?:[^()]*|\([^()]*\))*\))*\))?)(\s+([^\n]*))?$/gm;
	let matches = [...line.matchAll(defineRegex)];
	for (let match of matches) {
		try {
			let directive = match[1];
			let def = match[2];
			// Remove inline single line (//) and multiline (/* */) comments from the value.
			// let val = match[3].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '').trim();
			let val = (match[4] == undefined) ? true : match[4].trim();
			if (directive === "define") {
				settings[def] = val;
			} else { // for undef
				delete settings[def];
			}
		} catch (e) {
			debugger;
			console.log('failed to define ' + line + '. Error: ' + e);
		}
	}

	return settings;
}

function parsePreprocessorAdvancedSync(file, settings = [], recursive = false) {
	let allText = syncFetchText(file);

	// multilines
	allText = allText.replace(/\\$/gm, '');

	// comments
	allText = allText
		.replace(/\/\*[\s\S]*?\*\//g, '')  // remove multiline comments
		.replace(/\/\/.*$/gm, '');

	// clean trailing spaces
	let lines = allText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

	let newsettings = processBlockSync(file, lines, settings, recursive);
	return newsettings;
}


async function processConditionalBlock(file, lines, startIndex = 0, settings = [], recursive = false) {
	let branches = [];
	let ifLine = lines[startIndex];
	let currentCondition = "";

	// Convert the starting directive (#if, #ifdef, #ifndef) into a JS evaluable condition.
	if (/^#if\b/.test(ifLine)) {
		let match = ifLine.match(/^#if\s*(.*)/);
		currentCondition = match[1].trim();
	} else if (/^#ifdef\b/.test(ifLine)) {
		let match = ifLine.match(/^#ifdef\s*(\w+)/);
		// If defined means that the variable must exist in scope.
		currentCondition = "defined(" + match[1].trim() + ")";
	} else if (/^#ifndef\b/.test(ifLine)) {
		let match = ifLine.match(/^#ifndef\s*(\w+)/);
		currentCondition = "!defined(" + match[1].trim() + ")";
	}

	while (/defined\b[\s]*([a-zA-Z_][\w_]*)/.test(currentCondition)) {
		try {
			let match = currentCondition.match(/defined\b[\s]*([a-zA-Z_][\w_]*)/);
			let varName = match[1].trim();
			currentCondition = currentCondition.replace(match[0], `(typeof ${varName} !== 'undefined')`);
		} catch (e) {
			console.log('failed to parse defined condition ' + currentCondition + '. Error: ' + e);
			break;
		}
	}

	while (/defined\b[\s]*\((?:[^()]|\((?:[^()]*|\([^()]*\))*\))*\)/.test(currentCondition)) {
		try {
			let match = currentCondition.match(/defined\b[\s]*(\((?:[^()]|\((?:[^()]*|\([^()]*\))*\))*\))/);
			let varName = match[1].trim();
			currentCondition = currentCondition.replace(match[0], `(typeof ${varName} !== 'undefined')`);
		} catch (e) {
			console.log('failed to parse defined condition ' + currentCondition + '. Error: ' + e);
			break;
		}
	}

	let branchContent = [];
	let i = startIndex + 1;
	let nesting = 1;
	let conditionalBlockExit = 1;

	// Process each subsequent line until we get to the corresponding #endif.
	while (i < lines.length) {
		let line = lines[i];
		// If a new nested conditional starts (#if, #ifdef, or #ifndef), increase nesting.
		if (/^(#if|#ifdef|#ifndef)\b/.test(line)) {
			nesting++;
			branchContent.push(line);
			i++;
			continue;
		}
		// When encountering an #endif, decrement nesting.
		if (/^#endif\b/.test(line)) {
			nesting--;
			if (nesting === 0) {
				branches.push({ condition: currentCondition, content: branchContent });
				i++;  // Move past the #endif.
				conditionalBlockExit = i;
				break;
			} else {
				branchContent.push(line);
				i++;
				continue;
			}
		}
		// At nesting level 1, if an #elif appears then treat it as ending the current branch.
		if (nesting === 1 && /^#elif\b/.test(line)) {
			branches.push({ condition: currentCondition, content: branchContent });
			let match = line.match(/^#elif\s*(.*)/);
			currentCondition = match[1].trim();
			branchContent = [];
			i++;
			continue;
		}
		// At nesting level 1, handle an #else directive.
		if (nesting === 1 && /^#else\b/.test(line)) {
			branches.push({ condition: currentCondition, content: branchContent });
			currentCondition = "else"; // Special marker for the unconditional branch.
			branchContent = [];
			i++;
			continue;
		}
		branchContent.push(line);
		i++;
	}
	// For an #else branch add its content.
	if (currentCondition === "else") {
		branches.push({ condition: "else", content: branchContent });
	}

	// Evaluate the branches. For non-else branches, build an evaluation string that declares
	// all current settings as JavaScript variables.
	let activeContent = [];
	for (let branch of branches) {
		if (branch.condition === "else") {
			activeContent = branch.content;
			break;
		} else {
			let declarations = "";
			for (let key in settings) {
				let decl = `var ${key} = ${settings[key]}; `;
				if (isValidSyntax(decl)) {
					declarations += `var ${key} = ${settings[key]}; `;
				}
			}
			let evalStr = declarations + `return (${branch.condition});`;
			try {
				let func = new Function(evalStr);
				if (func()) {
					settings = await processBlock(file, activeContent, settings, recursive);
					break;
				}
			} catch (e) {
				// If evaluation fails, continue to next branch.
			}
		}
	}

	// Recursively process the chosen branch for further nested conditionals.
	return await processBlock(file, lines.slice(conditionalBlockExit), settings, recursive);
}

// Recursively process conditional blocks. We use a helper that
// processes normal lines until it finds a conditional directive.
async function processBlock(file, lines, settings = [], recursive = false) {
	let i = 0;
	while (i < lines.length) {
		// Update the condition to handle #if, #ifdef, and #ifndef.
		if (/^(#if|#ifdef|#ifndef)\b/.test(lines[i])) {
			settings = await processConditionalBlock(file, lines, i, settings, recursive);
		}
		// End-of-block markers should break processing.
		else if (/^#(elif|else|endif)\b/.test(lines[i])) {
			break;
		} else {
			settings = await processLine(file, lines[i], settings, recursive);
		}
		i++;
	}
	return settings;
}

async function processLine(file, line, settings = [], recursive = false) {
	// If recursive, process include files.
	if (recursive) {
		const includeregex = /^[\s]*#include[^'"]*(?<inc>[\-\w\d\.]+|"[^"]+")?/gm;
		const includefiles = [...line.matchAll(includeregex)];
		for (let i = 0; i < includefiles.length; i++) {
			// Remove quotes from the file name.
			let includedFile = includefiles[i][1].replace(/['"]+/g, '');
			let basefile = file.substring(0, file.lastIndexOf('/') + 1) + includedFile;
			// Recursively merge settings from the included file.
			settings = await parsePreprocessorAdvanced(basefile, settings.slice(), recursive);
		}
	}

	// Finally, process the #define and #undef directives.
	// We also remove any inline comments that appear after the directive.
	const defineRegex = /^#(define|undef)\b\s*([\a-zA-Z_][\w\d_]*(\((?:[^()]|\((?:[^()]*|\([^()]*\))*\))*\))?)(\s+([^\n]*))?$/gm;
	let matches = [...line.matchAll(defineRegex)];
	for (let match of matches) {
		try {
			let directive = match[1];
			let def = match[2];
			// Remove inline single line (//) and multiline (/* */) comments from the value.
			// let val = match[3].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '').trim();
			let val = (match[4] == undefined) ? true : match[4].trim();
			if (directive === "define") {
				settings[def] = val;
			} else { // for undef
				delete settings[def];
			}
		} catch (e) {
			debugger;
			console.log('failed to define ' + line + '. Error: ' + e);
		}
	}

	return settings;
}

async function parsePreprocessorAdvanced(file, settings = [], recursive = false) {
	let response = await fetch(file);
	if (!response.ok) {
		return settings;
	}
	let allText = await response.text().then();

	// multilines
	allText = allText.replace(/\\$/gm, '');

	// comments
	allText = allText
		.replace(/\/\*[\s\S]*?\*\//g, '')  // remove multiline comments
		.replace(/\/\/.*$/gm, '');

	// clean trailing spaces
	let lines = allText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

	return processBlock(file, lines, settings, recursive);
}

async function parsePreprocessor(file, settings = [], recursive = false) {
	var response = await fetch(file);
	if (response.ok) {
		var allText = await response.text();
		// not correctly recursive but works well enough to get the base boards
		if (recursive) {
			const includeregex = /^[\s]*#include[^'"]*(?<inc>[\-\w\d\.]+|"[^"]+")?/gm
			const includefiles = [...allText.matchAll(includeregex)];
			for (var i = 0; i < includefiles.length; i++) {
				var basefile = file.substring(0, file.lastIndexOf('/') + 1) + includefiles[i][1].replace(/['"]+/g, '');
				settings = await parsePreprocessor(basefile, settings.slice(), recursive);
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

function is_empty(val, field) {
	if (val === undefined) {
		return true;
	}

	if (val === "") {
		return true;
	}

	if (val === false && field.nullable) {
		return true;
	}

	return false;
}

function generate_user_config(rootscope = window.app_vars, options, defguard, reset_file = "", close = true) {
	options = options.filter(y => y.length > 0);
	var gentext = '#ifndef ' + defguard + '\n#define ' + defguard + '\n#ifdef __cplusplus\nextern "C"\n{\n#endif\n\n';
	if (reset_file !== "") {
		gentext += "#include \"" + reset_file + ".h\"\n";
	}

	for (var i = 0; i < options.length; i++) {
		try {
			let val = rootscope.app_state[options[i]];
			let field = rootscope.app_fields[options[i]];
			if (val != undefined) {
				if (reset_file === "") {
					// gentext += "//undefine " + options[i] + "\n";
					// gentext += "#ifdef " + options[i] + "\n#undef " + options[i] + "\n#endif\n";
					gentext += "#undef " + options[i] + "\n";
				}
				else {
					if (field === undefined) { debugger; }
					switch (field.type) {
						case 'bool':
							if (is_empty(val, field)) {
								break;
							}
							gentext += "#define " + options[i] + ((val) ? " true" : " false") + "\n";
							break;
						case 'string':
							gentext += `#define ${options[i]} "${val.replace(/^"+|"+$/g, '')}"\n`;
							break;
						default:
							if (is_empty(val, field)) {
								break;
							}
							if (val !== true) {
								gentext += `#define ${options[i]} ${val}\n`;
							} else {
								gentext += `#define ${options[i]}\n`;
							}
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
	let fields = [...document.querySelectorAll('[config-file="boardmap"]')].map(x => x.id);
	// let fields = Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('boardmap')).map(([k]) => k);
	var overrides = generate_user_config(rootscope, fields, 'BOADMAP_OVERRIDES_H', "boardmap_reset", false);
	overrides += "//Custom configurations\n" + rootscope.app_state.CUSTOM_BOARDMAP_CONFIGS + '\n\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	return overrides;
}

function generateBoardmapReset(rootscope = window.app_vars) {
	let fields = [...document.querySelectorAll('[config-file="boardmap"]')].map(x => x.id);
	// let fields = Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('boardmap')).map(([k]) => k);
	var overrides = generate_user_config(rootscope, fields, 'BOADMAP_RESET_H', '', false);
	var customs = (rootscope.app_state.CUSTOM_BOARDMAP_CONFIGS != null) ? rootscope.app_state.CUSTOM_BOARDMAP_CONFIGS : '';
	var defs = [...customs.matchAll(/#define[\s]+(?<def>[\w_]+)/gm)];
	defs.forEach((e) => {
		overrides += "#undef " + e[1] + "\n";
	});
	overrides += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	return overrides;
}

function generateHalReset(rootscope = window.app_vars) {
	let fields = [...document.querySelectorAll('[config-file="hal"]')].map(x => x.id);
	// let fields = Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('hal')).map(([k]) => k);
	var overrides = generate_user_config(rootscope, fields, 'CNC_HAL_RESET_H', '', false);
	var customs = (rootscope.app_state.CUSTOM_HAL_CONFIGS != null) ? rootscope.app_state.CUSTOM_HAL_CONFIGS : '';
	var defs = [...customs.matchAll(/#define[\s]+(?<def>[\w_]+)/gm)];
	defs.forEach((e) => {
		overrides += "#undef " + e[1] + "\n";
	});
	overrides += '\n#ifdef __cplusplus\n}\n#endif\n#endif\n';
	return overrides;
}

function generateHalOverrides(rootscope = window.app_vars) {
	let fields = [...document.querySelectorAll('[config-file="hal"]')].map(x => x.id);
	// let fields = Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('hal')).map(([k]) => k);
	var overrides = generate_user_config(rootscope, fields, 'CNC_HAL_OVERRIDES_H', "cnc_hal_reset", false);

	let modules = [...document.querySelectorAll('[config-file="module"]')].map(x => x.id);
	// let modules = Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('module')).map(([k]) => k);
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
	let modules = [...document.querySelectorAll('[config-file="module"]')].map(x => x.id);
	// var modules = Object.entries(rootscope.app_fields).filter(([k, v]) => v.file.split(',').includes('module')).map(([k]) => k);
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
	const boardurl = coreurl + "/uCNC/" + scope.$root.app_state.BOARD;

	let board_settings = parsePreprocessorAdvancedSync(boardurl, [], true);
	let mcu_settings = parsePreprocessorAdvancedSync(mcuurl, board_settings.slice(), false);

	/**
	 * Old version
	 */

	// let mcu_settings = await parsePreprocessor(mcuurl, [], false);
	// let board_settings = await parsePreprocessor(boardurl, [], true);

	let elems = Object.keys(board_settings);
	for (let i = 0; i < elems.length; i++) {
		scope.$root.app_state[elems[i]] = board_settings[elems[i]];
		await scope.$nextTick();
	}

	Object.keys(board_settings).forEach(element => {
		if (!document.getElementById(element)) {
			scope.$root.app_state['CUSTOM_BOARDMAP_CONFIGS'] = scope.$root.app_state['CUSTOM_BOARDMAP_CONFIGS'] + `#define ${element} ${board_settings[element]}\n`;
		}
	});

	elems = Object.keys(mcu_settings);
	for (let i = 0; i < elems.length; i++) {
		scope.$root.app_state[elems[i]] = mcu_settings[elems[i]];
		await scope.$nextTick();
	}

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

	settings = await parsePreprocessorAdvanced(hal, [], false);
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
	let configs = generateBoardmapReset(scope.$root);
	navigator.clipboard.writeText(configs)
		.then(() => {
			alert('Code copied to clipboard!');
		})
		.catch(err => {
			console.error('Failed to copy text: ', err);
		});
}

window.copyBoardmapOverride = async function (scope, event) {
	let configs = generateBoardmapOverrides(scope.$root);
	navigator.clipboard.writeText(configs)
		.then(() => {
			alert('Code copied to clipboard!');
		})
		.catch(err => {
			console.error('Failed to copy text: ', err);
		});
}

window.copyHalReset = async function (scope, event) {
	let configs = generateHalReset(scope.$root);
	navigator.clipboard.writeText(configs)
		.then(() => {
			alert('Code copied to clipboard!');
		})
		.catch(err => {
			console.error('Failed to copy text: ', err);
		});
}

window.copyHalOverride = async function (scope, event) {
	let configs = generateHalOverrides(scope.$root);
	navigator.clipboard.writeText(configs)
		.then(() => {
			alert('Code copied to clipboard!');
		})
		.catch(err => {
			console.error('Failed to copy text: ', err);
		});
}

window.copyPioOverride = async function (scope, event) {
	let configs = generatePIOOverrides(scope.$root);
	navigator.clipboard.writeText(configs)
		.then(() => {
			alert('Code copied to clipboard!');
		})
		.catch(err => {
			console.error('Failed to copy text: ', err);
		});
}
