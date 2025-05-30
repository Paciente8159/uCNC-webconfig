window.G33Component = {
	template: `
<toggle name="ENABLE_G33_MODULE" label="Enable G33 module"
tooltip="Enables the G33 parser extension module.">
</toggle>
<buttoncb if="app_state.ENABLE_G33_MODULE" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g33', window.G33Component);
	window.ModuleLoaderComponent.template += `<g33 v-if="(modfilter=='' || modfilter=='parser')"></g33>`;
});

