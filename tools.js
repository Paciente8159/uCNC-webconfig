

window.ToolsLoaderComponent = {
	props: {
		tool: { type: String, default: "TOOL1" },
	},
	template: ``
};

async function ucnc_load_tools() {
	for (let tool of window.app_vars.app_options.TOOL_OPTIONS) {
		try {
			const response = await fetch(`./tools/${tool.id}.js`);
			if (!response.ok) throw new Error(`Failed to fetch ${tool.id}.js`);

			const scriptContent = await response.text();
			new Function(scriptContent)();
		} catch (error) {
			console.error(`Error loading ${tool.id}.js:`, error.message);
		}
	}

	window.addEventListener("ucnc_load_components", (e) => {
		window.ucnc_app.component('toolsloader', window.ToolsLoaderComponent);
	});

	window.dispatchEvent(new Event("ucnc_tools_loaded"));
}
