window.BLTouchComponent = {
	template: `
<toggle name="bltouch" label="Enable BLTouch module"
tooltip="Enables the BLTouch extension module." configfile="module">
</toggle>

<buttoncb if="app_state.bltouch" enable="ENABLE_IO_MODULES">Fix requirements!</buttoncb>

<controlgroup if="app_state.bltouch" label="BLTouch options">
<pin configfile="hal" name="BLTOUCH_PROBE_SERVO" label="BLTouch servo pin" units="mm" initial="SERVO0" filter="item.type.includes('servo')"></pin>
</controlgroup>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('bltouch', window.BLTouchComponent);
	window.ModuleLoaderComponent.template += `<bltouch v-if="(modfilter=='' || modfilter=='other')"></bltouch>`;
});

