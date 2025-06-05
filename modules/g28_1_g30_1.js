window.G28_G30_1Component = {
	template: `
<toggle name="g28_1_g30_1" label="Enable G28.1/G30.1 module"
tooltip="Enables the G28.1/G30.1 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.g28_1_g30_1" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g28_1_g30_1', window.G28_G30_1Component);
	window.ModuleLoaderComponent.template += `<g28_1_g30_1 v-if="(modfilter=='' || modfilter=='parser')"></g28_1_g30_1>`;
});

