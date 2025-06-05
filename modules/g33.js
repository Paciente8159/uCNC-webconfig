window.G33Component = {
	template: `
<toggle name="g33" label="Enable G33 module"
tooltip="Enables the G33 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.g33" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g33', window.G33Component);
	window.ModuleLoaderComponent.template += `<g33 v-if="(modfilter=='' || modfilter=='parser')"></g33>`;
});

