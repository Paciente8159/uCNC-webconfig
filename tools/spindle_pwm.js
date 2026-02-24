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
			<toggle name="SPINDLE_PWM_RPM_ENCODER" label="Use an encoder to read the tool RPM" configfile="hal"
								tooltip="Selects an enconder to detect the spindle RPM"></toggle>
			<combobox name="SPINDLE_PWM_RPM_ENCODER" label="Use an encoder to read the tool RPM"
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
	window.ucnc_app.component('spindle_pwm', window.SpindlePWMComponent);
	window.ToolsLoaderComponent.template += `<spindle_pwm :tool="tool"></spindle_pwm>`;
});

