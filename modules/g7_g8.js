window.G7G8Component = {
	template: `
<toggle name="g7_g8" label="Enable G7/G8 module"
tooltip="Enables the G7/G8 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.g7_g8" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g7_g8', window.G7G8Component);
	window.ModuleLoaderComponent.template += `<g7_g8 v-if="(modfilter=='' || modfilter=='parser')"></g7_g8>`;
});

