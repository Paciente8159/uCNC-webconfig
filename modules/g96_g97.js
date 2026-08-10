window.G96G97Component = {
	template: `
<toggle name="g96_g97" label="Enable G96/G97 module"
tooltip="Enables the G96/G97 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.g96_g97" enable="ENABLE_PARSER_MODULES,ENABLE_MOTION_CONTROL_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g96_g97', window.G96G97Component);
	window.ModuleLoaderComponent.template += `<g96_g97 v-if="(modfilter=='' || modfilter=='parser')"></g96_g97>`;
});

