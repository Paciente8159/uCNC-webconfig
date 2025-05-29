window.SpindleBESCComponent = {
	props: {
		tool: { type: String, default: "TOOL0" }
	},
	computed: {
		toolMatch() {
			return (this.$root.app_state[this.tool] == 'spindle_besc');
		}
	},
	template: `<div v-if="toolMatch">
				<pin name="SPINDLE_BESC_SERVO" label="Select the Spindle Servo pin" filter="item.type.includes('servo')" configfile="hal"></pin>
			<pin name="SPINDLE_BESC_POWER_RELAY" label="Select the Spindle power relay pin" filter="item.type.includes('generic_output')" configfile="hal"></pin>
			<pin name="SPINDLE_BESC_COOLANT_FLOOD" label="Select the Spindle coolant flood pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			<pin name="SPINDLE_BESC_COOLANT_MIST" label="Select the Spindle coolant mist pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			</div>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('spindle_besc', window.SpindleBESCComponent);
	window.ToolsLoaderComponent.template += `<spindle_besc :tool="tool"></spindle_besc>`;
});

