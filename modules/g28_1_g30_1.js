window.G28_G30_1Component = {
	template: `
<toggle name="ENABLE_G28_G30_1_MODULE" label="Enable G28.1/G30.1 module"
tooltip="Enables the G28.1/G30.1 parser extension module.">
</toggle>
<buttoncb if="app_state.ENABLE_G28_G30_1_MODULE" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g28_1_g30_1', window.G28_G30_1Component);
	window.ModuleLoaderComponent.template += `<g28_1_g30_1 v-if="(modfilter=='' || modfilter=='parser')"></g28_1_g30_1>`;
});

