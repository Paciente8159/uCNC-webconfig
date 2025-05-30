

window.ToolsLoaderComponent = {
	props: {
		tool: { type: String, default: "TOOL1" },
	},
	template: ``
};

window.ModuleLoaderComponent = {
	template: ``
};

async function ucnc_component_loader() {
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

	for (let module of window.app_vars.app_options.MODULES_OPTIONS) {
		try {
			const response = await fetch(`./modules/${module.id}.js`);
			if (!response.ok) throw new Error(`Failed to fetch ${module.id}.js`);

			const scriptContent = await response.text();
			new Function(scriptContent)();
		} catch (error) {
			console.error(`Error loading ${module.id}.js:`, error.message);
		}
	}

	window.addEventListener("ucnc_load_components", (e) => {
		window.ucnc_app.component('modulesloader', window.ModuleLoaderComponent);
	});

	window.dispatchEvent(new Event("ucnc_tools_loaded"));
}
