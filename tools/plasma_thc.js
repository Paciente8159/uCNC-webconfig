window.PlasmaTHCComponent = {
	props: {
		tool: { type: String, default: "TOOL0" }
	},
	computed: {
		toolMatch() {
			return (this.$root.app_state[this.tool] == 'plasma_thc');
		}
	},
	template: `<div v-if="toolMatch && this.$root.app_state.ENABLE_PLASMA_THC">
				<pin name="PLASMA_ON_OUTPUT" label="Select the Plasma on/off output pin" filter="item.type.includes('generic_output')" configfile="hal"></pin>
			<pin name="PLASMA_UP_INPUT" label="Select the Plasma THC Up input pin" filter="item.type.includes('generic_input')" configfile="hal"></pin>
			<pin name="PLASMA_DOWN_INPUT" label="Select the Plasma THC Down input pin" filter="item.type.includes('generic_input')" configfile="hal"></pin>
			<pin name="PLASMA_ARC_OK_INPUT" label="Select the Plasma THC Arc Ok input pin" filter="item.type.includes('generic_input')" configfile="hal"></pin>
			</div>
			<alert v-if="toolMatch && !this.$root.app_state.ENABLE_PLASMA_THC" label="Plasma THC">You must enable Plasma THC mode in the Tool basic settings.</alert>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('plasma_thc', window.PlasmaTHCComponent);
	window.ToolsLoaderComponent.template += `<plasma_thc :tool="tool"></plasma_thc>`;
});

