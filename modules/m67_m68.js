window.M67M68Component = {
	template: `
<toggle name="m67_m68" label="Enable M67/M68 module"
tooltip="Enables the M67/M68 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.m67_m68" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('m67_m68', window.M67M68Component);
	window.ModuleLoaderComponent.template += `<m67_m68 v-if="(modfilter=='' || modfilter=='parser')"></m67_m68>`;
});

