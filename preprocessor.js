(function (root, factory) {
	const moduleValue = factory();
	if (typeof module === 'object' && module.exports) module.exports = moduleValue;
	if (root) root.UcncPreprocessor = moduleValue;
})(typeof window !== 'undefined' ? window : globalThis, function () {
	'use strict';

	function spliceLines(source) {
		return source.replace(/\\\r?\n/g, '');
	}

	function removeComments(source) {
		let result = '';
		let state = 'code';
		for (let i = 0; i < source.length; i++) {
			const current = source[i];
			const next = source[i + 1];
			if (state === 'line') {
				if (current === '\n') { result += current; state = 'code'; }
				continue;
			}
			if (state === 'block') {
				if (current === '*' && next === '/') { i++; state = 'code'; }
				else if (current === '\n') result += '\n';
				continue;
			}
			if (state === 'string' || state === 'char') {
				result += current;
				if (current === '\\' && next !== undefined) result += source[++i];
				else if ((state === 'string' && current === '"') || (state === 'char' && current === "'")) state = 'code';
				continue;
			}
			if (current === '/' && next === '/') { i++; state = 'line'; continue; }
			if (current === '/' && next === '*') { i++; state = 'block'; continue; }
			if (current === '"') state = 'string';
			else if (current === "'") state = 'char';
			result += current;
		}
		return result;
	}

	function tokenize(expression) {
		const tokens = [];
		let index = 0;
		while (index < expression.length) {
			const rest = expression.slice(index);
			const whitespace = rest.match(/^\s+/);
			if (whitespace) { index += whitespace[0].length; continue; }
			const number = rest.match(/^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[0-7]+|\d+)(?:[uUlL]+)?/);
			if (number) { tokens.push({ type: 'number', value: number[0] }); index += number[0].length; continue; }
			const char = rest.match(/^'(?:\\.|[^'\\])+'/);
			if (char) { tokens.push({ type: 'char', value: char[0] }); index += char[0].length; continue; }
			const identifier = rest.match(/^[A-Za-z_]\w*/);
			if (identifier) { tokens.push({ type: 'identifier', value: identifier[0] }); index += identifier[0].length; continue; }
			const operator = rest.match(/^(?:\|\||&&|==|!=|<=|>=|<<|>>|[()!~+\-*/%<>&^|?:])/);
			if (operator) { tokens.push({ type: 'operator', value: operator[0] }); index += operator[0].length; continue; }
			throw new Error(`Unsupported token near "${rest.slice(0, 20)}"`);
		}
		return tokens;
	}

	const precedence = new Map([
		['||', 1], ['&&', 2], ['|', 3], ['^', 4], ['&', 5],
		['==', 6], ['!=', 6], ['<', 7], ['<=', 7], ['>', 7], ['>=', 7],
		['<<', 8], ['>>', 8], ['+', 9], ['-', 9], ['*', 10], ['/', 10], ['%', 10],
	]);

	function parseNumber(value) {
		const clean = value.replace(/[uUlL]+$/g, '');
		if (/^0[bB]/.test(clean)) return parseInt(clean.slice(2), 2);
		if (/^0[xX]/.test(clean)) return parseInt(clean.slice(2), 16);
		if (/^0[0-7]+$/.test(clean) && clean.length > 1) return parseInt(clean, 8);
		return Number(clean);
	}

	function charValue(token) {
		const content = token.slice(1, -1);
		if (content.startsWith('\\')) {
			const escapes = { n: 10, r: 13, t: 9, 0: 0, "'": 39, '"': 34, '\\': 92 };
			return escapes[content[1]] ?? content.charCodeAt(content.length - 1);
		}
		return content.charCodeAt(0) || 0;
	}

	function applyOperator(operator, left, right) {
		switch (operator) {
			case '||': return left || right ? 1 : 0;
			case '&&': return left && right ? 1 : 0;
			case '|': return left | right;
			case '^': return left ^ right;
			case '&': return left & right;
			case '==': return left === right ? 1 : 0;
			case '!=': return left !== right ? 1 : 0;
			case '<': return left < right ? 1 : 0;
			case '<=': return left <= right ? 1 : 0;
			case '>': return left > right ? 1 : 0;
			case '>=': return left >= right ? 1 : 0;
			case '<<': return left << right;
			case '>>': return left >> right;
			case '+': return left + right;
			case '-': return left - right;
			case '*': return left * right;
			case '/': return right === 0 ? 0 : Math.trunc(left / right);
			case '%': return right === 0 ? 0 : left % right;
			default: throw new Error(`Unsupported operator ${operator}`);
		}
	}

	function evaluate(expression, macros, resolving = new Set()) {
		const definedExpanded = expression.replace(/\bdefined\s*(?:\(\s*([A-Za-z_]\w*)\s*\)|([A-Za-z_]\w*))/g,
			(_match, parenthesized, plain) => macros.has(parenthesized || plain) ? '1' : '0');
		const tokens = tokenize(definedExpanded);
		let position = 0;

		function primary() {
			const token = tokens[position++];
			if (!token) throw new Error('Unexpected end of expression');
			if (token.value === '(') {
				const value = binary(0);
				if (tokens[position++]?.value !== ')') throw new Error('Missing closing parenthesis');
				return value;
			}
			if (['!', '~', '+', '-'].includes(token.value)) {
				const value = primary();
				return token.value === '!' ? (!value ? 1 : 0) : token.value === '~' ? ~value : token.value === '-' ? -value : value;
			}
			if (token.type === 'number') return parseNumber(token.value);
			if (token.type === 'char') return charValue(token.value);
			if (token.type === 'identifier') {
				const macro = macros.get(token.value);
				if (!macro || macro.kind === 'function' || resolving.has(token.value)) return 0;
				if (!macro.replacement.trim()) return 1;
				const nextResolving = new Set(resolving);
				nextResolving.add(token.value);
				return evaluate(macro.replacement, macros, nextResolving);
			}
			throw new Error(`Unexpected token ${token.value}`);
		}

		function binary(minimum) {
			let left = primary();
			while (position < tokens.length) {
				const operator = tokens[position].value;
				const priority = precedence.get(operator);
				if (priority === undefined || priority < minimum) break;
				position++;
				const right = binary(priority + 1);
				left = applyOperator(operator, left, right);
			}
			return left;
		}

		const result = binary(0);
		if (position !== tokens.length) throw new Error(`Unexpected token ${tokens[position].value}`);
		return result;
	}

	function macroObject(macros) {
		const result = Object.create(null);
		for (const [name, macro] of macros) {
			if (macro.kind !== 'function') result[name] = macro.replacement.trim() === '' ? true : macro.replacement.trim();
		}
		return result;
	}

	async function preprocess({ entryFile, predefinedMacros = {}, loadFile, include = true }) {
		if (typeof loadFile !== 'function') throw new TypeError('preprocess requires a loadFile adapter');
		const macros = new Map();
		const diagnostics = [];
		const includedFiles = [];
		const activeFiles = new Set();
		for (const [name, replacement] of Object.entries(predefinedMacros)) {
			macros.set(name, { name, kind: 'object', replacement: replacement === true ? '' : String(replacement), sourceFile: '<predefined>', sourceLine: 0 });
		}

		async function processFile(file) {
			if (activeFiles.has(file)) {
				diagnostics.push({ level: 'warning', file, line: 0, message: 'Cyclic include skipped' });
				return;
			}
			activeFiles.add(file);
			includedFiles.push(file);
			let source;
			try { source = await loadFile(file); }
			catch (error) {
				diagnostics.push({ level: 'error', file, line: 0, message: error.message });
				activeFiles.delete(file);
				return;
			}
			const lines = removeComments(spliceLines(source)).split(/\r?\n/);
			const frames = [];
			const isActive = () => frames.every(frame => frame.active);

			for (let index = 0; index < lines.length; index++) {
				const lineNumber = index + 1;
				const directive = lines[index].match(/^\s*#\s*([A-Za-z]+)\b(.*)$/);
				if (!directive) continue;
				const command = directive[1];
				const argument = directive[2].trim();
				if (command === 'if' || command === 'ifdef' || command === 'ifndef') {
					const parentActive = isActive();
					let condition = false;
					if (parentActive) {
						try {
							condition = command === 'ifdef' ? macros.has(argument) : command === 'ifndef' ? !macros.has(argument) : Boolean(evaluate(argument, macros));
						} catch (error) {
							diagnostics.push({ level: 'warning', file, line: lineNumber, message: `Condition treated as false: ${error.message}` });
						}
					}
					frames.push({ parentActive, active: parentActive && condition, branchTaken: parentActive && condition, elseSeen: false });
					continue;
				}
				if (command === 'elif') {
					const frame = frames[frames.length - 1];
					if (!frame || frame.elseSeen) { diagnostics.push({ level: 'error', file, line: lineNumber, message: 'Unexpected #elif' }); continue; }
					let condition = false;
					if (frame.parentActive && !frame.branchTaken) {
						try { condition = Boolean(evaluate(argument, macros)); }
						catch (error) { diagnostics.push({ level: 'warning', file, line: lineNumber, message: `Condition treated as false: ${error.message}` }); }
					}
					frame.active = frame.parentActive && !frame.branchTaken && condition;
					frame.branchTaken ||= frame.active;
					continue;
				}
				if (command === 'else') {
					const frame = frames[frames.length - 1];
					if (!frame || frame.elseSeen) { diagnostics.push({ level: 'error', file, line: lineNumber, message: 'Unexpected #else' }); continue; }
					frame.elseSeen = true;
					frame.active = frame.parentActive && !frame.branchTaken;
					frame.branchTaken ||= frame.active;
					continue;
				}
				if (command === 'endif') {
					if (!frames.pop()) diagnostics.push({ level: 'error', file, line: lineNumber, message: 'Unexpected #endif' });
					continue;
				}
				if (!isActive()) continue;
				if (command === 'define') {
					const match = argument.match(/^([A-Za-z_]\w*)(\(([^)]*)\))?(?:\s+(.*))?$/);
					if (!match) { diagnostics.push({ level: 'warning', file, line: lineNumber, message: 'Unsupported #define' }); continue; }
					macros.set(match[1], { name: match[1], kind: match[2] ? 'function' : 'object', parameters: match[3]?.split(',').map(value => value.trim()), replacement: match[4] || '', sourceFile: file, sourceLine: lineNumber });
				} else if (command === 'undef') {
					macros.delete(argument.match(/^[A-Za-z_]\w*/)?.[0]);
				} else if (command === 'include' && include) {
					const match = argument.match(/^["<]([^">]+)[">]/);
					if (!match || argument.startsWith('<')) {
						diagnostics.push({ level: 'info', file, line: lineNumber, message: `System or computed include skipped: ${argument}` });
					} else {
						let included;
						try { included = new URL(match[1], file).href; }
						catch (_error) { included = match[1]; }
						await processFile(included);
					}
				} else if (command === 'error') {
					diagnostics.push({ level: 'error', file, line: lineNumber, message: argument || '#error' });
				}
			}
			if (frames.length) diagnostics.push({ level: 'error', file, line: lines.length, message: 'Unterminated conditional block' });
			activeFiles.delete(file);
		}

		await processFile(entryFile);
		return { macros: macroObject(macros), macroDefinitions: macros, diagnostics, includedFiles };
	}

	return { preprocess, evaluateExpression: evaluate, removeComments, spliceLines };
});
