window.M17M18Component = {
	template: `
<toggle name="m17_m18" label="Enable M17/M18 module"
tooltip="Enables the M17/M18 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.m17_m18" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('m17_m18', window.M17M18Component);
	window.ModuleLoaderComponent.template += `<m17_m18 v-if="(modfilter=='' || modfilter=='parser')"></m17_m18>`;
});

