window.M66Component = {
	template: `
<toggle name="m66" label="Enable M66 module"
tooltip="Enables the M66 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.m66" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('m66', window.M66Component);
	window.ModuleLoaderComponent.template += `<m66 v-if="(modfilter=='' || modfilter=='parser')"></m66>`;
});

