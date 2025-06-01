window.SingleAxisHomingComponent = {
	template: `
<toggle name="ENABLE_SINGLE_AXIS_HOME_MODULE" label="Enable Single Axis Homing module"
tooltip="Enables the Single Axis Homing parser extension module.">
</toggle>
<buttoncb if="app_state.ENABLE_SINGLE_AXIS_HOME_MODULE" enable="ENABLE_PARSER_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('single_axis_home', window.SingleAxisHomingComponent);
	window.ModuleLoaderComponent.template += `<single_axis_home v-if="(modfilter=='' || modfilter=='parser')"></single_axis_home>`;
});

