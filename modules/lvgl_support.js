window.LvGLComponent = {
    template: `
		<toggle name="lvgl_support" label="Enable LVGL Support for displays module"
tooltip="Enables LVGL Support for displays." configfile="module">
</toggle>

<buttoncb if="app_state.lvgl_support" enable="ENABLE_MAIN_LOOP_MODULES">Fix requirements!</buttoncb>

<alert alerttype="info" labelcolor="var(--bs-alert-color)" label="Advanced configurations"
if="app_state.lvgl_support">
This module requires external libraries. Download and use the platformio.ini for PlatformIO.
</alert>
`
};

window.addEventListener("ucnc_load_components", () => {
    window.ucnc_app.component('lvgl_support', window.LvGLComponent);
    window.ModuleLoaderComponent.template += `<lvgl_support v-if="(modfilter=='' || modfilter=='display')"></lvgl_support>`;
});