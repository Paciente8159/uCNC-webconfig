# AGENTS.md

Browser-based configuration generator for [µCNC](https://github.com/Paciente8159/uCNC). Users answer
questions about their CNC machine; the app downloads the firmware's C headers at runtime, resolves
`#define` macros, and renders a downloadable ZIP of override files
(`boardmap_overrides.h`, `cnc_hal_overrides.h`, reset files, `platformio.ini`) plus an editable
`ucnc_build.json`.

**There is no build step, no package.json, and no node_modules.** The app is plain browser JS loaded
from CDNs (Vue 3 global build, Bootstrap 5, showdown, JSZip) and served as a static site via GitHub
Pages. Open `index.html` in a browser to run it; use the `node --test` suite and the `scripts/`
CLI tools for verification and manifest generation.

## Commands

| Command | Purpose |
| --- | --- |
| `node --test` | Run the regression tests in `test/` (7 tests across `preprocessor.test.js`, `ucnc_defaults.test.js`, `configs_overrides.test.js`). Tests read the browser files directly and mock `window`/`document`/`fetch` via `node:vm`. |
| `node scripts/list-supported-refs.mjs` | Print the firmware refs from `options.js` `VERSIONS` (used by CI). |
| `node scripts/generate-manifests.mjs --ucnc-dir ../uCNC --ref master --output manifests` | Generate a compiler-resolved defaults manifest. Requires a local checkout of uCNC. Set `CPP` or `CC` to choose the preprocessor (default `cc`). Writes `manifests/<sanitized-ref>/defaults.json`. See README. |

The GitHub Actions workflow (`.github/workflows/pages.yml`) clones uCNC, generates manifests for
every ref in `options.js`, runs `node --test`, then deploys the whole repo to Pages. The `manifests/`
directory is generated output, currently not committed. Tests: currently 18 (7 core + 10
`ui_foundation` + 1 sandbox-load).

## UI shell (new-ui.md implementation)

The app has been restructured from firmware-oriented `tabgroup/tab` components into a **workflow
shell** (`index.html` + `style.css` + `workflow.css`) with 8 step panels (Machine, Board & MCU, HAL,
Tools, Modules, Custom, Review & Export, Files) driven by
`v-show="app_state.__WORKFLOW_STEP==='<step>'"`. **All step panels stay mounted and behind `v-show`,
never `v-if`, so the generation DOM queries in `configs.js` still find every field.** The five core
tab bodies were moved verbatim into panels 1-4 and 6; the Config-files card went into panel 8 and
Review & Export (panel 6) is new. The former Features panel was split into separate Tools and Modules
panels.

The shell is a three-column grid (`.workflow-layout`): a left step rail (`.workflow-nav`), the
workspace (`.workflow-workspace`) holding the 8 mounted panels plus Back/Continue controls, and a
sticky summary sidebar (`.workflow-summary`). The header (`.app-header`) shows the product name, a
firmware version button that jumps to the Machine step, and Load/Save/Theme actions. Panels are plain
`<section class="workflow-panel" data-workflow-panel="<step>" v-show=...>` elements in index.html; the
`workflow-tabs` component in `tabs.js` is a passthrough kept only for load-order stability.

New file **`ui_foundation.js`** (`window.UiFoundation`, UMD, UcncPreprocessor-style): provides
`initUiFoundation(rootScope, api)` returning an object used by the inline bootstrap in
`index.html`. Key responsibilities:

- **Modified vs default tracking**: `commitDefaultsSnapshot(boardDefaults, halDefaults)` stores the
  loaded manifest/fallback macros; `isKeyModified`/`changedKeyList`/`countChanged`/`changedDetails`
  compare `app_state` values against the committed defaults (falling back to a hardcoded
  `BUSINESS_RELATED_DEFAULTS` set for `ENABLE_*` toggles, and treating `__`-prefixed and
  `VERSION/MCU/BOARD/CUSTOM_*` as protected). It never rewrites generated output - it only reads.
  `resetKey`/`resetAllModified` write only `app_state`, never the committed defaults.
- **Validation**: `runValidation` returns `[{severity, setting, message}]` (errors: no MCU/board/
  kinematic, duplicate physical pins, unmet module prerequisites, board/MCU mismatch; warnings:
  version-gated modules, non-integer values, malformed custom `#define`s).
- **Autosave**: debounced `autosave()` writes `app_state` (minus `__` keys) to localStorage key
  `ucnc_config_draft_v1`; `checkDraft`/`restoreDraft`/`discardDraft` complement it.
- **Save/Load**: `saveCompleteSnapshot` downloads `ucnc_build.json` (versioned `{format, state}`);
  `applyJsonConfig` imports a saved state with type coercion per `app_fields`, preserving unknown keys.
- **Step persistence**: `goStep`/`resumeStep` store `ucnc_workflow_step_v1`.
- **Theme**: `initTheme`/`applyTheme`/`toggleTheme` read/write `ucnc_ui_prefs_v1` and drive the
  `data-bs-theme` attribute; `setVisibility`/`getVisibility` store the visibility level.
- **Idempotent refresh**: `refresh()` recomputes `__CHANGED_COUNT/__CHANGED_KEYS/__VALIDATION_*` and
  only writes a key when its value actually changed. This prevents the deep Vue watcher from looping
  (the watcher calls `refresh()` + `autosave()` on every `app_state` mutation).

The inline bootstrap (`index.html`) initializes `window.ucncfoundation`, seeds
`__WORKFLOW_STEP/__WORKFLOW_INDEX/__CHANGED_COUNT/__CHANGED_KEYS/__VALIDATION_*` on `app_state`, and
attaches a deep Vue watcher on `app_state` calling `refresh()` + `autosave()`. The workflow rail
buttons, summary sidebar, and Review panel bind to these `__`-prefixed reactive keys. `ui_foundation.js`
uses the same `protected-keys` and `__`-prefix conventions as `ucnc_defaults.js`; keep those in sync.

The review step exposes a readiness status, grouped findings, a configuration summary, the
changed-from-default list, "Reset all modified settings", and Download ZIP / Download JSON actions that
call the existing `window.loadGenerateConfig` and `saveCompleteSnapshot`. `new-ui.md` also describes
speculative later phases (pin groups, feature cards, templates, diff preview) that are NOT implemented.

**Gotchas discovered during the shell rework:**
- Vue 3 hard-errors on duplicate attributes and on commas inside attribute values. The original
  `accept=".json,.txt"` and a duplicated `configfile="hal"` on `ENABLE_LINACT_COLD_START` were fixed.
- The source uses `configfile=` (no hyphen) on pseudo-components; Vue maps it to the `config-file`
  attribute that `configs.js` generation queries. Keep writing `configfile=` in index.html/modules/tools.
- Named-slot (`v-slot:`) wrappers break when slot content contains `<template #default>` children
  (Vue drops everything but the last named slot). Panels must be plain `<section v-show>` elements.
- CRLF/CR corruption in hand-edited files produces literal commas inside tags that break Vue's in-DOM
  template compiler. Keep index.html line endings consistent (LF).

## Architecture and flow

Script load order in `index.html` is significant; components, events, and globals depend on it:

```
options.js → containers.js → tabs.js → controls.js → component_loader.js → preprocessor.js →
ucnc_defaults.js → ui_foundation.js → configs.js → inline Vue bootstrap
```

**Boot sequence** (event-driven, also a common place for onboarding bugs):
1. `ucnc_component_loader()` (component_loader.js) fetches every `tools/*.js` and `modules/*.js`
   listed in `TOOL_OPTIONS`/`MODULES_OPTIONS`, executes each via `new Function`, then dispatches
   `ucnc_components_loaded`.
2. The inline script in `index.html` dispatches `ucnc_load_components`; each file's load-time
   listener registers its components with `window.ucnc_app` (Vue). `containers.js`/`controls.js` do
   the same via their own top-level listeners.
3. Vue mounts; `ucnc_app_ready` is dispatched last.

**State (the "vuex-less" store):** everything lives in `window.app_vars` (`options.js`), made
reactive via `reactive()` in the inline bootstrap:
- `app_state` - every selected value, keyed by firmware macro name (e.g. `app_state.STEP0_BIT`).
  `VERSION`, `MCU`, `BOARD` are encoded as integers/flags (e.g. `VERSION === 11606` for v1.16.6).
- `app_fields` - per-key metadata `{ type: 'bool'|'int'|'float'|'string', nullable, file }`.
- `app_options` - hardcoded lookup tables: `VERSIONS` (firmware refs + zip URLs), `BOARDS`
  (paths relative to the uCNC repo), `MCUS`, `MODULES_OPTIONS`, `TOOL_OPTIONS`, `UCNCPINS`, etc.

**Fields are self-registering:** components write their own `app_fields`/`app_state` entries in
`created()` when the key is absent. `name` (the macro) becomes the DOM element id with
`config-file="<file>"` attributes. Never re-register existing keys.

**Defaults loading (ucnc_defaults.js):** `boardChanged`/`halChanged` (configs.js) call
`loadBoardDefaults` / `loadHalDefaults`, which first try `./manifests/<ref>/defaults.json`
(compiler-generated, deterministic), then fall back to browser-side preprocessing of the raw GitHub
headers (`https://raw.githubusercontent.com/Paciente8159/uCNC/<ref>/uCNC/...`). `replaceDefaults`
replaces the previous layer entirely (tracked in `__boardDefaultKeys` / `__halDefaultKeys`) and
protects `VERSION`, `MCU`, `BOARD`, `CUSTOM_BOARDMAP_CONFIGS`, `CUSTOM_HAL_CONFIGS`.

**Generator (configs.js):** `loadGenerateConfig` zips the output of `generateBoardmapOverrides`,
`generateBoardmapReset`, `generateHalOverrides`, `generateHalReset`, `generatePIOOverrides`, and the
JSON state. `generate*Overrides` collect settings by querying the **live DOM** for
`[config-file="boardmap"]` / `[config-file="hal"]` / `[config-file="module"]`, which is why
generation depends on all fields being mounted.

## C-preprocessor implementation (two versions!)

There are **two independent preprocessor implementations**; do not confuse them:

- **`preprocessor.js`** (`UcncPreprocessor`): the current, safe, async implementation. UMD-style
  (works in Node via `module.exports` and in the browser via `window.UcncPreprocessor`). Tokenizes
  and evaluates expressions itself - it never uses `eval`, so hostile `#if` expressions get a
  diagnostic instead of executing (see `preprocessor.test.js`). Handles `#if/#ifdef/#ifndef/#elif/
  #else/#endif`, `#define`/`#undef`, quoted `#include` with cycle detection, line continuations,
  comment stripping, `defined()`. Integer division truncates, div-by-zero returns 0. Identifier
  resolution is recursive with cycle protection; `#define FOO` (empty) evaluates as truthy 1.
- **`configs.js`**: contains the **legacy** sync/async iterator-based parser
  (`parsePreprocessorAdvancedSync`, `processConditionalBlockSync`, etc.) which evaluates conditions
  by string-building `new Function('...')`. Large commented-out blocks reference its old behavior.
  The legacy code is still loaded and used to fetch `platformio.ini` (`getPIOContent`); the async
  variants are dead code kept from the pre-manifest era. Prefer `preprocessor.js` for anything new.

Known preprocessor limitations (don't "fix" without checking): `#include <...>` (system includes)
are skipped with an info diagnostic; macros are never expanded inside replacement text; only
function-like macro definitions are recorded, never invoked.

## Modules and tools pseudo-components

`modules/*.js` and `tools/*.js` are **not** real Vue components. Each file:
1. Defines a component object (`window.XxxComponent`) whose `template` is a string of `<toggle>`,
   `<combobox>`, `<pin>`, `<repeater>`, `<controlgroup>` etc. pseudo-elements - these map to the
   real Vue components registered in `controls.js`/`containers.js`.
2. At load time registers itself and **appends its `<xxx v-if="modfilter==''||modfilter=='<category>'">`
   to `window.ModuleLoaderComponent.template`** (tools append to `ToolsLoaderComponent.template`),
   which is how `<modulesloader>`/`<toolsloader>` in `index.html` render them.

Categories seen in the append patterns: `parser`, `display`, `storage`, `pendants`, `tool`, `other`.
When adding a module, match this pattern exactly; the component name must equal the macro toggle
name (e.g. `tmc_driver` turns on `app_state.tmc_driver`, `configfile="module"`).

Module "Fix requirements!" buttons (`<buttoncb>`) set/clear listed `app_state` flags
(e.g. `ENABLE_MAIN_LOOP_MODULES`); module `requires`/`condition` metadata in `MODULES_OPTIONS`
drives PIO generation (deps, lib_deps, build_flags) but is not auto-validated at runtime.

## Key gotchas

- **Version conditions:** firmware versions are encoded as integers (v1.16.6 = `11606`), and
  `MODULES_OPTIONS` entries carry `condition: 'VERSION>011680'` strings that are only used to
  filter `platformio.ini` entry lists, not to gate the module in the UI. "VERSION" appears as
  `app_state.VERSION` (numeric) but `options.js` initializes it to `99999` (master).
- **`show` vs `if` semantics:** `show=false` hides a field but it remains part of the mounted DOM
  and its value is still generated (per `new-ui.md` this contract must be preserved); `if=false`
  unmounts it so it is excluded from generated output.
- **Field values are always written as explicit `#define` lines:** bools emit `true`/`false`
  explicitly (fixed in `e66dd1c`); nullable false values are skipped only by `generate_user_config`
  when `is_empty` sees `false + nullable`.
- **Type conversion quirks:** `typeConverter` (controls.js) treats empty string/`{}` as truthy for
  `bool`; `coerceForField` (ucnc_defaults.js) has its own stricter conversion used for defaults.
  `app_state` values written by components go through `typeConverter`; defaults go through
  `coerceForField`. Keep both in sync when types change.
- **`window.resetPins` (configs.js)** wipes every `UCNCPINS` entry: `<pin>_BIT`, `_PORT`, `_ISR`,
  `_PULLUP`, `_ADC`, `_CHANNEL`, `_MUX`, `_TIMER`, `_IO_OFFSET` and `CUSTOM_BOARDMAP_CONFIGS`. It
  runs on every board/MCU change (pins are intentionally not migrated between boards).
- **Formatting:** source uses tabs for indentation; HTML attribute style is a mix of lowercase and
  kebab-case; pseudo-component attrs use `configfile`, `vartype`, `changecb`, `clickcb`,
  `keyname`, `valname` (not camelCase). Match surrounding style.
- The `manifests/` dir is ignored by git; expect regeneration on feature branches. The Page CI
  deploys the repo as-is (no bundling), so any new `.js` file added to root/modules/tools is
  fetched from the raw `./` path - keep files plain scripts assigning to `window`.
- `new-ui.md` describes a planned redesign (workflow steps, validation, autosave) that is
  **speculative** - guard against rewriting the current architecture to match it unless explicitly
  asked.