window.SpindlePWMComponent = {
	props: {
		tool: { type: String, default: "TOOL0" }
	},
	computed:{
		toolMatch(){
				return (this.$root.app_state[this.tool] == 'spindle_pwm');
		}
	},
	template: `<div v-if="toolMatch">
				<pin name="SPINDLE_PWM" label="Select the Spindle PWM pin" filter="item.type.includes('pwm')" configfile="hal"></pin>
			<pin name="SPINDLE_PWM_DIR" label="Select the Spindle dir pin" filter="item.type.includes('generic_output')" configfile="hal"></pin>
			<pin name="SPINDLE_PWM_COOLANT_FLOOD" label="Select the Spindle coolant flood pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			<pin name="SPINDLE_PWM_COOLANT_MIST" label="Select the Spindle coolant mist pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			</div>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('spindle_pwm', window.SpindlePWMComponent);
	window.ToolsLoaderComponent.template += `<spindle_pwm :tool="tool"></spindle_pwm>`;
});

