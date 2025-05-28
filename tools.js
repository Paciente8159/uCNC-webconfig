async function loadTools() {
	debugger;
	for (let tool of TOOL_OPTIONS) {
		try {
			const response = await fetch(`./tools/${tool.id}.js`);
			if (!response.ok) throw new Error(`Failed to fetch ${tool.id}.js`);

			const scriptContent = await response.text();
			const toolFunction = new Function(scriptContent);
			toolFunction();
		} catch (error) {
			console.error(`Error loading ${tool.id}.js:`, error.message);
		}
	}

	window.dispatchEvent(new CustomEvent("ucnc_tools_loaded", { detail: ucnc_app }));
}

(async () => {
    await loadTools();
    console.log("All scripts executed sequentially.");
})();
