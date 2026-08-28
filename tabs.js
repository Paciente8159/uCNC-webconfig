// Workflow panels are rendered as plain <section v-show> elements in index.html.
// This component is kept as a no-op registration for backward compatibility so
// the script load order stays stable; nothing renders through it anymore.
window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('workflow-tabs', {
		props: {
			id: { type: String, default: "workflow-tabs" },
			steps: { type: Array, default: () => [] },
		},
		template: `<div class="workflow-tabs"><slot></slot></div>`,
	});
});