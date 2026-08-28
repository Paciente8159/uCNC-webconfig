# µCNC Configurator — New UI Specification

## Goal

Transform the configurator from firmware-oriented tabs into a guided, board-aware workflow that helps users configure faster, exposes only relevant options, validates choices continuously, and makes the generated result easy to review before export.

The existing generation functions, `configfile` routing, reset/override behavior, custom configuration, default loader, and GitHub Pages deployment remain the foundation. This is primarily an information-architecture and component redesign, not a firmware-format rewrite.

The first delivery covers **Foundation** and **Workflow shell**. Focused pin selectors, feature cards, templates, recent boards, and automatic pin assignment remain later phases.

## Experience principles

- Guide beginners without limiting expert users.
- Prefer machine concepts over firmware file names.
- Derive and hide values whenever the selected board provides them.
- Show defaults, modifications, dependencies, and conflicts where decisions are made.
- Keep configuration recoverable through local autosave and JSON import/export.
- Never make essential information available only through color, hover, or a tooltip.

## Application shell

### Header

- Product name: **µCNC Configurator**.
- Firmware version selector, always visible.
- **Load** imports a configuration JSON file.
- **Save** downloads the current versioned editable JSON configuration.
- Theme control uses an accessible button or checkbox and persists the preference.

### Workflow navigation

Replace the top-level tabs with five ordered steps:

1. **Machine** — template, kinematics, axes, steppers, and communication basics.
2. **Board & MCU** — MCU selection, an MCU-filtered board selection, and advanced board properties.
3. **Pins** — pin assignments grouped by purpose with compatibility and collision checks.
4. **Features** — tools, modules, networking, motion, storage, displays, and advanced HAL features.
5. **Review & Export** — summary, validation, generated-file changes, build target, and downloads.

Desktop uses a persistent left step rail. Mobile uses a compact step header with Back/Continue controls. Users may revisit completed steps at any time. Expert mode may expose direct firmware-oriented navigation.

### Configuration summary

A sticky desktop sidebar and collapsible mobile panel displays:

- Firmware version, machine template, board, MCU, kinematics, and axis count.
- Enabled tools and modules.
- Number of settings changed from board defaults.
- Error and warning counts.
- Overall status: **Ready to export**, **Warnings**, or **Action required**.

Each summary item links to its owning setting. The panel updates immediately after every change.

## Core flows

### Start or resume

Offer three clear entry points:

- **Start from a machine template**: router, laser, plasma, lathe, CoreXY, or minimal/custom.
- **Start by selecting an MCU and compatible board**.
- **Load an existing configuration**.

Restore an autosaved draft when available, with explicit **Restore** and **Discard** choices.

### MCU and board selection

- Firmware version is selected first, MCU second, and board third.
- Board choices are filtered by the selected MCU, preserving current behavior. Known boards do not derive or lock MCU.
- A custom-board option uses the selected MCU and exposes low-level configuration.
- Loading state is local to the selector and reports whether defaults came from a manifest or live-source fallback.
- Changing MCU or board requires confirmation, clears every boardmap pin definition, and loads clean board defaults. Pin definitions are never migrated between boards.
- New defaults must load successfully before the destructive change is committed; failure leaves the prior configuration intact.
- Importing editable JSON restores its saved pin values and does not invoke the clean-board reset.

### Pins

- Group assignments into motion, limits/probe, controls, communications, tools, and auxiliary I/O.
- Each pin selector shows capability, current assignment, and board label.
- Prevent or flag duplicate assignments in real time.
- Filter incompatible pins by default; expert mode can reveal them with explanations.
- Provide **Auto-assign available pins**, **Reset group**, and per-setting **Reset to board default** actions.
- Provide a boardmap-only **Clear all pins** action and a per-row **Clear this pin** action. These actions do not modify HAL, tool, or module references; existing undefined-pin warnings remain responsible for those references.

### Features

- Present selectable tools/modules as compact cards with description, compatibility, dependencies, and enabled state.
- Use **Basic**, **Advanced**, and **Expert** visibility levels.
- Search matches user labels, descriptions, and macro names.
- Enabling a feature reveals only its dependent settings and clearly lists automatically enabled prerequisites.

### Review and export

The final step contains:

1. Readiness status and grouped errors/warnings.
2. Human-readable configuration summary.
3. Changed-from-default list with source default and selected value.
4. Generated-file preview/diff for `boardmap_overrides.h`, `cnc_hal_overrides.h`, reset files, and `platformio.ini` when applicable.
5. Build-tool selection and matching source-code download.
6. Primary **Download configuration ZIP** action.
7. Secondary copy/download action for each generated file.

Warnings and errors do not block export. Export with errors requires explicit confirmation; warnings alone do not.

## Component specification

### Configuration field

Every field provides:

- Short user-facing label.
- Optional macro name as muted secondary text.
- Input and unit, when applicable.
- Concise persistent helper text for important guidance.
- Explicit info button for extended documentation.
- State indicator: default, modified, warning, or error.
- **Reset to default** when modified.

Do not attach popovers to the entire control. Tooltips must be keyboard accessible and supplementary.

### Boolean and nullable values

- Normal booleans use an accessible switch with visible Enabled/Disabled state.
- Nullable booleans use an explicit three-state control: **Use default / Enabled / Disabled**.
- Never overload unchecked to mean both false and undefined.

### Numeric values

- Exact values use number inputs with min, max, step, and unit.
- A range slider may supplement, but never replace, the number input.
- Invalid values show an inline explanation and correction range.

### Selectors

- Use searchable comboboxes for long lists such as boards and pins.
- Nullable selectors display **Use default** or **Not assigned**, never an empty unexplained option.
- Loading, empty, and failure states are shown inside the component.

### Validation

Validation produces structured results with severity, setting key, message, and optional fix action:

- **Error**: likely cannot safely generate or compile, but remains advisory.
- **Warning**: valid but potentially unintended or hardware-dependent.
- **Info**: derived value, migration, or optimization opportunity.

Minimum rules cover duplicate pins, missing required assignments, board/MCU mismatch, unsupported firmware features, invalid ranges, unmet module dependencies, incompatible features, and unavailable communication peripherals.

## State and behavior

- Track source defaults separately from user overrides; never copy defaults into the modified set.
- Compute a single derived list of changed settings for summary and reset actions. Do not use it to change established generated output.
- Autosave configuration state to local storage after debouncing changes.
- Store UI preferences separately: theme, visibility level, and last step.
- MCU or board changes run a mandatory clean-pin reset after confirmation and retain one pre-reset recovery snapshot.
- Browser history/back should navigate workflow steps without losing configuration.
- Loading one board/version must not block interaction with unrelated UI.
- Keep all workflow steps mounted so navigation does not alter the live-DOM field set used by generation.
- Preserve current conditional semantics: `show=false` hides a field but keeps it in generated output; `if=false` excludes it from generated output while a prior value remains in editable JSON.

## Responsive and accessibility requirements

- Target WCAG 2.2 AA contrast and keyboard operation.
- Use semantic buttons, labels, fieldsets, legends, tabs/steps, status regions, and dialogs.
- Maintain correct `aria-selected`, `aria-expanded`, `aria-current`, and error associations.
- Announce async loading and validation changes through polite live regions.
- Minimum interactive target: 44×44 CSS pixels on touch layouts.
- Desktop: three-column shell (steps, workspace, summary).
- Tablet: collapsible steps and summary drawer.
- Mobile: single column, sticky Back/Continue bar, no horizontal tab overflow.
- Never rely only on color, icons, hover, or spatial position to convey status.

## Visual direction

- Restrained engineering-tool aesthetic compatible with Bootstrap.
- White/cool-gray surfaces, dark navy text, µCNC green primary accent, muted blue secondary actions.
- Compact controls, strong section hierarchy, subtle borders, minimal shadows.
- Reserve green for success/primary progress, amber for warnings, and red for errors.
- The concept mockup is directional: preserve its step rail, focused workspace, sticky summary, and clear continuation action; exact typography and iconography may follow the existing brand assets.

## Delivery phases

1. **Foundation** — changed/default tracking, advisory structured validation, autosave, editable-configuration migration, generator compatibility tests, and accessibility fixes.
2. **Workflow shell** — five mounted step panels, sticky summary, responsive layout, search and visibility levels.
3. **Focused flows** — board-first selection, grouped pin assignment, feature cards, dependency handling.
4. **Review/export** — readiness report, diff preview, consolidated downloads, version migration preview.
5. **Polish** — templates, recent boards, automatic pin suggestions, keyboard/mobile usability testing.

## Acceptance criteria

- A first-time user can configure a common three-axis board without opening Expert mode.
- Selecting an MCU filters the board list; selecting a known board resolves its source defaults without changing the MCU.
- Search can locate a setting by friendly label or firmware macro.
- Duplicate or unsupported pins are identified before export.
- Every modified setting can be identified and reset individually.
- A reload restores the unfinished draft without losing edits.
- MCU/board changes disclose the mandatory clean boardmap-pin reset before application and never mix pins from different boards.
- Export is available from one review screen and includes the editable JSON state.
- The complete flow is usable by keyboard and at a 320 CSS-pixel viewport width.
- Existing generation semantics continue to pass; new tests cover reset/override compatibility, validation, migration, autosave, navigation, pin clearing, and accessibility state.
