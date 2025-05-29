window.LaserPWMComponent = {
	components: { 'alert': window.AlertComponent },
	props: {
		tool: { type: String, default: "TOOL0" }
	},
	computed:{
		toolMatch(){
				return (this.$root.app_state[this.tool] == 'laser_pwm');
		}
	},
	template: `<div v-if="toolMatch">
				<pin name="LASER_PWM" label="Select the laser PWM pin" filter="item.type.includes('pwm')" configfile="hal"></pin>
			<range name="LASER_FREQ" label="Select the laser PWM Frequency" min="50" max="8000" initial="1000" configfile="hal"></range>
			<pin name="LASER_PWM_AIR_ASSIST" label="Select the laser air assist pin" filter="item.type.includes('generic_output')" if="app_state.ENABLE_COOLANT" configfile="hal"></pin>
			</div>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('laser_pwm', window.LaserPWMComponent);
	window.ToolsLoaderComponent.template += `<laser_pwm :tool="tool"></laser_pwm>`;
});

