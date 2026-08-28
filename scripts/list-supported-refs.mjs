import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(repositoryRoot, 'options.js'), 'utf8'), context, { filename: 'options.js' });
const refs = context.window.app_vars.app_options.VERSIONS.map(version => version.id);
process.stdout.write(refs.join('\n'));
