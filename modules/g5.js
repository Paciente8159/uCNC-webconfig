window.G5Component = {
	template: `
<toggle name="g5" label="Enable G5 module" tooltip="Enables the G5 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.g5 && !app_state.ENABLE_PARSER_MODULES" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>
<controlgroup if="app_state.g5" label="G5 options">
<range configfile="hal" name="G5_MAX_SEGMENT_LENGTH" label="G5 segment maximum length: " units="mm" min="0" max="10" step="0.1" vartype="float" initial="1"></range>
</controlgroup>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g5', window.G5Component);
	window.ModuleLoaderComponent.template += `<g5 v-if="(modfilter=='' || modfilter=='parser')"></g5>`;
});

