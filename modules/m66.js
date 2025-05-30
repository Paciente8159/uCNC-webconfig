window.M66Component = {
	template: `
<toggle name="ENABLE_M66_MODULE" label="Enable M66 module"
tooltip="Enables the M66 parser extension module.">
</toggle>
<buttoncb if="app_state.ENABLE_M66_MODULE" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g33', window.M66Component);
	window.ModuleLoaderComponent.template += `<m66 v-if="(modfilter=='' || modfilter=='parser')"></m66>`;
});

