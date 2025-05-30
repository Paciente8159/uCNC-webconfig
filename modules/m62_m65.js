window.M62M65Component = {
	template: `
<toggle name="ENABLE_M62M65_MODULE" label="Enable M62/M63/M64/M65 module"
tooltip="Enables the M62/M63/M64/M65 parser extension module.">
</toggle>
<buttoncb if="app_state.ENABLE_M62M65_MODULE" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('m62_m65', window.M62M65Component);
	window.ModuleLoaderComponent.template += `<m62_m65 v-if="(modfilter=='' || modfilter=='parser')"></m62_m65>`;
});

