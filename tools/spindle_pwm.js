window.SpindlePWMComponent = {
	components: { 'alert': window.AlertComponent },
	props: {
		if: { type: String, default: "true" }
	},
	computed: {
		showCondition() {
			try {
				return new Function('app_state', `return ${this.show};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true;
			}
		},
		ifCondition() {
			try {
				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true;
			}
		},
	},
	updated() {
		debugger;
	},
	template: `<div v-if="ifCondition" v-show="showCondition">
	<alert label="" alerttype="danger">
								Coolant is disabled! Some options might be ommited.
							</alert></div>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('spindlepwm', window.SpindlePWMComponent);
});

