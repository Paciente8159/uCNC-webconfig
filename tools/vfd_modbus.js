window.SpindleVFDModbusComponent = {
	props: {
		tool: { type: String, default: "TOOL0" }
	},
	computed: {
		toolMatch() {
			return (this.$root.app_state[this.tool] == 'vfd_modbus');
		},
		baudOptions() {
			return this.$root.app_options.BAUDRATES.filter((b) => (b.id <= 115200));
		}
	},
	template: `<div v-if="toolMatch">
				<pin name="VFD_TX_PIN" label="Select the VFD softport communications TX pin" filter="item.type.includes('generic_output')" configfile="hal"></pin>
			<pin name="VFD_RX_PIN" label="Select the VFD softport communications RX pin" filter="item.type.includes('generic_input')" configfile="hal"></pin>
						<combobox name="VFD_BAUDRATE" label="What is your VFD softport baudrate" :opts="baudOptions"
								keyname="id" valname="id" configfile="hal"></combobox>
			<pin name="VFD_COOLANT_FLOOD" label="Select the VFD coolant flood pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			<pin name="VFD_COOLANT_MIST" label="Select the VFD coolant mist pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			</div>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('vfd_modbus', window.SpindleVFDModbusComponent);
	window.ToolsLoaderComponent.template += `<vfd_modbus :tool="tool"></vfd_modbus>`;
});

