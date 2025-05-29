window.VFDPWMComponent = {
	props: {
		tool: { type: String, default: "TOOL0" }
	},
	computed:{
		toolMatch(){
				return (this.$root.app_state[this.tool] == 'vfd_pwm');
		}
	},
	template: `<div v-if="toolMatch">
				<pin name="VFD_PWM" label="Select the VFD PWM pin" filter="item.type.includes('pwm')" configfile="hal"></pin>
			<pin name="VFD_PWM_DIR" label="Select the VFD dir pin" filter="item.type.includes('generic_output')" configfile="hal"></pin>
			<pin name="VFD_PWM_COOLANT_FLOOD" label="Select the VFD coolant flood pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			<pin name="VFD_PWM_COOLANT_MIST" label="Select the VFD coolant mist pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			</div>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('vfd_pwm', window.VFDPWMComponent);
	window.ToolsLoaderComponent.template += `<vfd_pwm :tool="tool"></vfd_pwm>`;
});

