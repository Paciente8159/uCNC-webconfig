window.WebPendantComponent = {
	template: `
<toggle name="web_pendant" label="Enable Web Pendant module"
tooltip="Enables the Web Pendant module. This requires the board to have WiFi. A web page is available to control the machine and execute GCode files" configfile="module">
</toggle>

<buttoncb if="app_state.web_pendant" enable="ENABLE_IO_MODULES,WIFI">Fix requirements!</buttoncb>
`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('web_pendant', window.WebPendantComponent);
	window.ModuleLoaderComponent.template += `<web_pendant v-if="(modfilter=='' || modfilter=='pendants')"></web_pendant>`;
});

