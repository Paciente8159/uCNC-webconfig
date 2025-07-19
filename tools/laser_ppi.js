window.LaserPPIComponent = {
	props: {
		tool: { type: String, default: "TOOL0" }
	},
	computed: {
		toolMatch() {
			return (this.$root.app_state[this.tool] == 'laser_ppi');
		}
	},
	template: `<div v-if="toolMatch && this.$root.app_state.ENABLE_LASER_PPI">
				<pin name="LASER_PPI" label="Select the Spindle Servo pin" filter="item.type.includes('generic_output') || item.type.includes('pwm')"></pin>
				<toggle name="INVERT_LASER_PPI_LOGIC" label="Invert PPI laser signal logic" configfile="hal"
								tooltip="Inverts the output signal logic for the PPI control pin"></toggle>
<pin name="LASER_PPI_AIR_ASSIST" label="Select the Spindle coolant flood pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT"></pin>
			<pin name="SPINDLE_BESC_COOLANT_MIST" label="Select the Spindle coolant mist pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT"></pin>
			</div>
			<alert v-if="toolMatch && !this.$root.app_state.ENABLE_LASER_PPI" label="Laser PPI">You must enable Laser PPI mode in the Tool basic settings.</alert>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('laser_ppi', window.LaserPPIComponent);
	window.ToolsLoaderComponent.template += `<laser_ppi :tool="tool"></laser_ppi>`;
});

