const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const fieldsByFile = {
  boardmap: [{ id: 'BOARD_BOOL_TRUE' }, { id: 'BOARD_BOOL_FALSE' }],
  hal: [{ id: 'HAL_BOOL_TRUE' }, { id: 'HAL_BOOL_FALSE' }],
  module: [],
};

const context = {
  console,
  fetch: async () => ({ ok: false }),
  navigator: {},
  document: {
    querySelectorAll(selector) {
      const match = selector.match(/^\[config-file="([^"]+)"\]$/);
      return match ? fieldsByFile[match[1]] ?? [] : [];
    },
  },
  window: {},
};
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'configs.js'), 'utf8'),
  context,
  { filename: 'configs.js' },
);

const rootscope = {
  app_state: {
    BOARD_BOOL_TRUE: true,
    BOARD_BOOL_FALSE: false,
    HAL_BOOL_TRUE: true,
    HAL_BOOL_FALSE: false,
    CUSTOM_BOARDMAP_CONFIGS: '',
    CUSTOM_HAL_CONFIGS: '',
  },
  app_fields: {
    BOARD_BOOL_TRUE: { type: 'bool', nullable: true, file: 'boardmap' },
    BOARD_BOOL_FALSE: { type: 'bool', nullable: true, file: 'boardmap' },
    HAL_BOOL_TRUE: { type: 'bool', nullable: true, file: 'hal' },
    HAL_BOOL_FALSE: { type: 'bool', nullable: true, file: 'hal' },
  },
};

const boardmap = context.generateBoardmapOverrides(rootscope);
assert.match(boardmap, /^#define BOARD_BOOL_TRUE true$/m);
assert.match(boardmap, /^#define BOARD_BOOL_FALSE false$/m);

const hal = context.generateHalOverrides(rootscope);
assert.match(hal, /^#define HAL_BOOL_TRUE true$/m);
assert.match(hal, /^#define HAL_BOOL_FALSE false$/m);

console.log('Boolean override macros are explicitly emitted for true and false.');
