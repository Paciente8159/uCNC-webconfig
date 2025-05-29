window.PenServoComponent = {
	props: {
		tool: { type: String, default: "TOOL0" }
	},
	computed: {
		toolMatch() {
			return (this.$root.app_state[this.tool] == 'pen_servo');
		}
	},
	template: `<div v-if="toolMatch">
				<pin name="PEN_SERVO" label="Select the Pen servo pin" filter="item.type.includes('servo')" configfile="hal"></pin>
			<range name="PEN_SERVO_LOW" label="Select the Pen low position servo value" min="0" max="255" initial="50" configfile="hal"
			tooltip="Sets the servo value to lower the pen to the desired height"></range>
			<range name="PEN_SERVO_MID" label="Select the Pen middle position servo value" min="0" max="255" initial="127" configfile="hal"
			tooltip="Sets the servo value to place the pen in an intermediate position"></range>
			<range name="PEN_SERVO_HIGH" label="Select the Pen low position servo value" min="0" max="255" initial="255" configfile="hal"
			tooltip="Sets the servo value to place the pen in an high position"></range>
			</div>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('pen_servo', window.PenServoComponent);
	window.ToolsLoaderComponent.template += `<pen_servo :tool="tool"></pen_servo>`;
});

