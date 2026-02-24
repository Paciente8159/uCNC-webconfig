window.SpindleRelayComponent = {
	props: {
		tool: { type: String, default: "TOOL0" }
	},
	computed: {
		toolMatch() {
			return (this.$root.app_state[this.tool] == 'spindle_relay');
		}
	},
	template: `<div v-if="toolMatch">
				<pin name="SPINDLE_RELAY_FWD" label="Select the Spindle FWD relay pin" filter="item.type.includes('generic_output')" configfile="hal"></pin>
			<pin name="SPINDLE_RELAY_REV" label="Select the Spindle REV relay pin" filter="item.type.includes('generic_output')" configfile="hal"></pin>
			<pin name="SPINDLE_BESC_COOLANT_FLOOD" label="Select the Spindle coolant flood pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			<pin name="SPINDLE_BESC_COOLANT_MIST" label="Select the Spindle coolant mist pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			<combobox name="SPINDLE_RELAY_RPM_ENCODER" label="Use an encoder to read the tool RPM"
									:opts="[
			{ id: 'ENC0', enccount: 0 },
			{ id: 'ENC1', enccount: 1 },
			{ id: 'ENC2', enccount: 2 },
			{ id: 'ENC3', enccount: 3 },
			{ id: 'ENC4', enccount: 4 },
			{ id: 'ENC5', enccount: 5 },
			{ id: 'ENC6', enccount: 6 },
			{ id: 'ENC7', enccount: 7 }
		]" valname="id" configfile="hal" nullable
									tooltip="Assign an encoder to the tool RPM counter."></combobox>
			</div>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('spindle_relay', window.SpindleRelayComponent);
	window.ToolsLoaderComponent.template += `<spindle_relay :tool="tool"></spindle_relay>`;
});

