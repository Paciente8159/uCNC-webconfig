window.M80M81Component = {
	template: `
<toggle name="ENABLE_M80M81_MODULE" label="Enable M80/M81 module"
tooltip="Enables the M80/M81 parser extension module.">
</toggle>
<buttoncb if="app_state.ENABLE_M80M81_MODULE" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('m80_m81', window.M80M81Component);
	window.ModuleLoaderComponent.template += `<m80_m81 v-if="(modfilter=='' || modfilter=='parser')"></m80_m81>`;
});

