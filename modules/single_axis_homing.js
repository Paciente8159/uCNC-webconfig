window.SingleAxisHomingComponent = {
	template: `
<toggle name="single_axis_homing" label="Enable Single Axis Homing module"
tooltip="Enables the Single Axis Homing parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.single_axis_homing" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('single_axis_homing', window.SingleAxisHomingComponent);
	window.ModuleLoaderComponent.template += `<single_axis_homing v-if="(modfilter=='' || modfilter=='parser')"></single_axis_homing>`;
});

