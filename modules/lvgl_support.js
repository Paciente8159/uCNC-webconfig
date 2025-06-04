window.LvGLComponent = {
    template: `
		<toggle name="ENABLE_LVGL_SUPPORT_MODULE" label="Enable LVGL Support for displays module"
tooltip="Enables LVGL Support for displays.">
</toggle>

<buttoncb if="app_state.ENABLE_LVGL_SUPPORT_MODULE" enable="ENABLE_MAIN_LOOP_MODULES">Fix requirements!</buttoncb>

<alert alerttype="info" labelcolor="var(--bs-alert-color)" label="Advanced configurations"
if="app_state.ENABLE_LVGL_SUPPORT_MODULE">
This module requires external libraries. Download and use the platformio.ini for PlatformIO.
</alert>
`
};

window.addEventListener("ucnc_load_components", () => {
    window.ucnc_app.component('lvgl_support', window.LvGLComponent);
    window.ModuleLoaderComponent.template += `<lvgl_support v-if="(modfilter=='' || modfilter=='display')"></lvgl_support>`;
});