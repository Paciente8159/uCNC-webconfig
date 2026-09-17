# CONTEXT.md

Glossary for the µCNC web configuration generator. Terms are canonical project language; see `docs/agents/domain.md` for consumer rules.

## Terms

### Baseline config
The set of settings a firmware version + MCU + board combination ships with, as resolved from the uCNC headers (manifest or browser preprocessor). The value a field "should have" for the current selection.

### Loaded config
A `ucnc_build.json` a user imports. Its `state` is the source of truth for what the user's machine is actually configured as.

### User override
A loaded-config value (or later edit) that differs from the baseline.

### Board & MCU step
Workflow step holding boardmap-file settings (pins, ports, registers). Its baseline layer is the *board defaults* (board + MCU headers).

### HAL step
Workflow step holding hal-file settings. Its baseline layer is the *HAL defaults* (`cnc_hal_config.h`).

### Board defaults
Baseline layer keyed by (VERSION, MCU, BOARD). Replaced when any of the three changes.

### HAL defaults
Baseline layer keyed by VERSION only. Replaced when VERSION changes.

### Orphaned setting
A loaded-config (or state) setting that no longer exists in the current baseline config. Must be dropped on any baseline change.
### Baseline config (resolution)
"Reset to baseline" / "loaded baseline" means the baseline resolved for the current (VERSION, MCU, BOARD) — the *new* baseline, not the values the loaded config had. "Cleaned in favor of the baseline" means the baseline acts as a validity filter: settings absent from it are dropped; settings present in it keep the current (loaded or edited) value.

### Validity filter
On any baseline change, the new baseline decides which settings *exist*, never which value a kept setting has. A setting present in both the current state and the new baseline keeps its current value; a setting absent from the baseline is dropped.

### Baseline reset
Replacing a layer's state values with the new baseline for that layer, then filtering. Triggered only by MCU or BOARD changes for the board layer.

### Custom block
The free-form `CUSTOM_BOARDMAP_CONFIGS` / `CUSTOM_HAL_CONFIGS` text of user `#define`s. Colliding defines (same name as a baseline macro) are dropped in favor of the baseline; non-colliding defines survive.

### Machine identity fields
Boardmap-file settings that describe the machine rather than the board: `KINEMATIC`, `MP_SCARA`, `AXIS_COUNT`, `BAUDRATE`. They survive a board/MCU reset; a board change only flags them as validation findings when they conflict with the new board baseline.
