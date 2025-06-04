window.WebPendantComponent = {
	template: `
<toggle name="ENABLE_WEB_PENDANT_MODULE" label="Enable Web Pendant module"
tooltip="Enables the Web Pendant module. This requires the board to have WiFi. A web page is available to control the machine and execute GCode files">
</toggle>

<buttoncb if="app_state.ENABLE_WEB_PENDANT_MODULE" enable="ENABLE_IO_MODULES,WIFI">Fix requirements!</buttoncb>
`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('webpendant', window.WebPendantComponent);
	window.ModuleLoaderComponent.template += `<webpendant v-if="(modfilter=='' || modfilter=='pendants')"></webpendant>`;
});

