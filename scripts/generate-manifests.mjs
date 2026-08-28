import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

function argument(name, fallback) {
	const index = process.argv.indexOf(name);
	return index === -1 ? fallback : process.argv[index + 1];
}

const ucncDir = path.resolve(argument('--ucnc-dir', 'ucnc-upstream'));
const requestedRef = argument('--ref', 'master');
const outputDir = path.resolve(argument('--output', 'manifests'));
const compiler = process.env.CPP || process.env.CC || 'cc';
const repositoryRoot = path.resolve(import.meta.dirname, '..');
const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucnc-preprocessor-stubs-'));
const stubbedHeaders = new Set();
process.on('exit', () => fs.rmSync(stubDir, { recursive: true, force: true }));

function loadOptions() {
	const context = { window: {} };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(repositoryRoot, 'options.js'), 'utf8'), context, { filename: 'options.js' });
	return context.window.app_vars.app_options;
}

function includePath(file) {
	return file.replaceAll('\\', '/').replaceAll('"', '\\"');
}

function parseDefines(output) {
	const macros = Object.create(null);
	for (const line of output.split(/\r?\n/)) {
		const match = line.match(/^#define\s+([A-Za-z_]\w*)(\([^)]*\))?\s*(.*)$/);
		if (!match || match[2] || match[1].startsWith('__')) continue;
		macros[match[1]] = match[3].trim() || true;
	}
	return macros;
}

function preprocess(files) {
	const wrapper = files.map(file => `#include "${includePath(file)}"`).join('\n');
	const args = ['-E', '-dM', '-undef', '-x', 'c', `-I${stubDir}`, `-I${path.join(ucncDir, 'uCNC')}`, `-I${path.join(ucncDir, 'uCNC', 'src')}`, '-'];
	for (let attempt = 0; attempt < 100; attempt++) {
		const result = spawnSync(compiler, args, { input: wrapper, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
		if (result.error) throw result.error;
		if (result.status === 0) return parseDefines(result.stdout);
		const missing = result.stderr.match(/fatal error:\s*([^:\r\n]+):\s*No such file or directory/);
		if (!missing) throw new Error(result.stderr.trim() || `${compiler} exited with ${result.status}`);
		const header = missing[1].trim().replaceAll('\\', '/');
		if (path.isAbsolute(header) || header.split('/').includes('..')) throw new Error(`Unsafe missing include path: ${header}`);
		const stub = path.resolve(stubDir, header);
		if (!stub.startsWith(path.resolve(stubDir) + path.sep) || stubbedHeaders.has(header)) throw new Error(result.stderr.trim());
		fs.mkdirSync(path.dirname(stub), { recursive: true });
		fs.writeFileSync(stub, '/* Generated preprocessing stub for an external SDK header. */\n');
		stubbedHeaders.add(header);
	}
	throw new Error('Too many missing external headers while preprocessing');
}

function gitCommit() {
	const result = spawnSync('git', ['-C', ucncDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
	return result.status === 0 ? result.stdout.trim() : null;
}

const options = loadOptions();
const mcuPaths = new Map(options.MCUS.map(mcu => [mcu.id, mcu.url]));
const manifest = {
	metadata: {
		requestedRef,
		commit: gitCommit(),
		generatedAt: new Date().toISOString(),
		generator: `${compiler} -E -dM -undef`,
		stubbedExternalHeaders: [],
		schemaVersion: 1,
	},
	boards: {},
	hal: null,
	diagnostics: [],
};

for (const board of options.BOARDS) {
	if (board.id === 'boardmap_overrides.h' || board.mcu.includes(',')) continue;
	const boardFile = path.join(ucncDir, 'uCNC', board.id);
	const mcuPath = mcuPaths.get(board.mcu);
	const mcuFile = mcuPath && path.join(ucncDir, 'uCNC', mcuPath);
	if (!fs.existsSync(boardFile) || !mcuFile || !fs.existsSync(mcuFile)) {
		manifest.diagnostics.push({ board: board.id, message: 'Board or MCU map does not exist in this ref' });
		continue;
	}
	try {
		manifest.boards[board.id] = {
			boardMacros: preprocess([boardFile]),
			macros: preprocess([boardFile, mcuFile]),
			diagnostics: [],
		};
	} catch (error) {
		manifest.diagnostics.push({ board: board.id, message: error.message });
	}
}

const halFile = path.join(ucncDir, 'uCNC', 'cnc_hal_config.h');
if (fs.existsSync(halFile)) {
	try { manifest.hal = { macros: preprocess([halFile]), diagnostics: [] }; }
	catch (error) { manifest.diagnostics.push({ file: 'cnc_hal_config.h', message: error.message }); }
}

manifest.metadata.stubbedExternalHeaders = [...stubbedHeaders].sort();

const safeRef = requestedRef.replace(/[^A-Za-z0-9._-]+/g, '__');
const destination = path.join(outputDir, safeRef);
fs.mkdirSync(destination, { recursive: true });
fs.writeFileSync(path.join(destination, 'defaults.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${Object.keys(manifest.boards).length} board manifests for ${requestedRef} at ${manifest.metadata.commit || 'unknown commit'}.`);
if (manifest.diagnostics.length) console.warn(`${manifest.diagnostics.length} entries could not be generated; see diagnostics in the manifest.`);
