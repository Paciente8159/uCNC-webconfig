window.G5Component = {
	template: `
	<toggle name="ENABLE_G5_MODULE" label="Enable G5 module" tooltip="Enables the G5 parser extension module.">
							</toggle>
							<controlgroup if="app_state.ENABLE_G5_MODULE" label="G5 options">
							
			</controlgroup>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g5', window.G5Component);
	window.ModuleLoaderComponent.template += `<g5></g5>`;
});

