window.SmoothieClustComponent = {
	template: `
<toggle name="ENABLE_SMOOTHIE_MODULE" label="Enable Smoothie Clustering module"
tooltip="Enables the Smoothie Clustering parser extension module.">
</toggle>
<buttoncb if="app_state.ENABLE_SMOOTHIE_MODULE" enable="ENABLE_PARSER_MODULES,ENABLE_MOTION_CONTROL_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('smoothiecluster', window.SmoothieClustComponent);
	window.ModuleLoaderComponent.template += `<smoothiecluster v-if="(modfilter=='' || modfilter=='parser')"></smoothiecluster>`;
});

