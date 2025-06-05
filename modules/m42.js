window.M42Component = {
	template: `
<toggle name="m42" label="Enable M42 module"
tooltip="Enables the M42 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.m42" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('m42', window.M42Component);
	window.ModuleLoaderComponent.template += `<m42 v-if="(modfilter=='' || modfilter=='parser')"></m42>`;
});

