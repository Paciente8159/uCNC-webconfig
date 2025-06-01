window.BLTouchComponent = {
	template: `
<toggle name="ENABLE_BLTOUCH_MODULE" label="Enable BLTouch module"
tooltip="Enables the BLTouch extension module.">
</toggle>

<buttoncb if="app_state.ENABLE_BLTOUCH_MODULE" enable="ENABLE_IO_MODULES">Fix requirements!</buttoncb>

<controlgroup if="app_state.ENABLE_BLTOUCH_MODULE" label="BLTouch options">
<pin name="BLTOUCH_PROBE_SERVO" label="BLTouch servo pin" units="mm" initial="SERVO0" filter="item.type.includes('servo')"></pin>
</controlgroup>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('bltouch', window.BLTouchComponent);
	window.ModuleLoaderComponent.template += `<bltouch v-if="(modfilter=='' || modfilter=='other')"></bltouch>`;
});

