window.SmoothieClustComponent = {
	template: `
<toggle name="smoothie_clustering" label="Enable Smoothie Clustering module"
tooltip="Enables the Smoothie Clustering parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.smoothie_clustering" enable="ENABLE_PARSER_MODULES,ENABLE_MOTION_CONTROL_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('smoothie_clustering', window.SmoothieClustComponent);
	window.ModuleLoaderComponent.template += `<smoothie_clustering v-if="(modfilter=='' || modfilter=='parser')"></smoothie_clustering>`;
});

