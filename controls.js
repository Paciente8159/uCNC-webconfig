window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('toggle', window.ToggleComponent);
	window.ucnc_app.component('check', window.CheckComponent);
	window.ucnc_app.component('combobox', window.ComboBoxComponent);
	window.ucnc_app.component('range', window.RangeComponent);
	window.ucnc_app.component('alert', window.AlertComponent);
	window.ucnc_app.component('textfield', window.TextFieldComponent);
	window.ucnc_app.component('bitfield', window.BitFieldComponent);
	window.ucnc_app.component('message', window.MessageComponent);
	window.ucnc_app.component('pin', window.PinComponent);
	window.ucnc_app.component('buttoncb', window.ButtonComponent);
	window.ucnc_app.component('textareafield', window.TextAreaFieldComponent);
	window.ucnc_app.component('inputctrl', window.InputComponent);
});

function typeConverter(type = 'default', value) {

	if (value === undefined) {
		return '';
	}

	if ((typeof value == "string" || typeof value == "object") && !value.length) {
		if (type == 'bool') {
			return true;
		}
		return value;
	}

	switch (type) {
		case 'bool':
			return Boolean(value);
		case 'int':
			return parseInt(value);
		case 'float':
			return parseFloat(value);
	}
	return value;
}

// Initialize Bootstrap popovers with markdown support
function componentTooltip(comp) {
	if (!comp.ifCondition || !comp.tooltip.length) {
		return;
	}
	const el = comp.$el;
	let content = comp.tooltip;
	var converter = new showdown.Converter({ openLinksInNewWindow: true });
	var htmlContent = converter.makeHtml(content);
	let popover = bootstrap.Popover.getOrCreateInstance(el, {
		trigger: 'hover focus',
		content: htmlContent,
		html: true
	});
}

window.ToggleComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "" },
		label: { type: String, default: "Enables/Disables control" },
		vartype: { type: String, default: "" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: String, default: "false" },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" },
		nullable: { type: Boolean, default: true },
		alias: { type: String }
	},
	computed: {
		modelValue: {
			get() {
				let aliasstate = false;
				// if(this.alias=='IC74HC595_CUSTOM_SHIFT_IO'){debugger;}
				if (this.alias && this.alias.length) {
					aliasstate = typeConverter('bool', this.$root.app_state[this.alias]);
				}
				return typeConverter('bool', this.$root.app_state[this.name] | aliasstate);
			},
			set(newValue) {
				// if(this.alias=='IC74HC595_CUSTOM_SHIFT_IO'){debugger;}
				if (this.alias && this.alias.length) {
					this.$root.app_state[this.alias] = typeConverter('bool', newValue);
				}
				this.$root.app_state[this.name] = typeConverter('bool', newValue);
			}
		},
		showCondition() {
			try {
				return new Function('app_state', `return ${this.show};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		},
		ifCondition() {
			try {
				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		}
	},
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_fields, JSON.parse(`{"${this.name}":{"type":"${this.vartype}", "nullable":${this.nullable}, "file":"${this.configfile}"}}`));
			if (this.alias && this.alias.length) {
				Object.assign(this.$root.app_fields, JSON.parse(`{"${this.alias}":{"type":"${this.vartype}", "nullable":${this.nullable}, "file":"${this.configfile}"}}`));
			}
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":${this.initial}}`));
			if (this.alias && this.alias.length) {
				Object.assign(this.$root.app_state, JSON.parse(`{"${this.alias}":${this.initial}}`));
			}
		}
	},
	mounted() {
		componentTooltip(this);
	},
	updated() {
		componentTooltip(this);
	},
	template: `<div class="form-check form-switch" v-if="ifCondition" v-show="showCondition"
		data-bs-toggle="popover" :data-bs-title="tooltiptitle">
		<input class="form-check-input" type="checkbox"
		v-model="modelValue" :id="name" :name="name" :config-file="configfile" :var-type="vartype">
		<label class="form-check-label" :for="name" v-if="label.length">{{ label }}</label>
		</div>`
};

window.CheckComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "" },
		label: { type: String, default: "Enables/Disables control" },
		vartype: { type: String, default: "" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: String, default: "false" },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" },
		nullable: { type: Boolean, default: true },
		alias: { type: String }
	},
	computed: {
		modelValue: {
			get() {
				let aliasstate = false;
				
				if (this.alias && this.alias.length) {
					aliasstate = typeConverter('bool', this.$root.app_state[this.alias]);
				}
				return typeConverter('bool', this.$root.app_state[this.name] | aliasstate);
			},
			set(newValue) {
				if (this.alias && this.alias.length) {
					this.$root.app_state[this.alias] = typeConverter('bool', newValue);
				}
				this.$root.app_state[this.name] = typeConverter('bool', newValue);
			}
		},
		showCondition() {
			try {
				return new Function('app_state', `return ${this.show};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		},
		ifCondition() {
			try {
				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		}
	},
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_fields, JSON.parse(`{"${this.name}":{"type":"${this.vartype}", "nullable":${this.nullable}, "file":"${this.configfile}"}}`));
			if (this.alias && this.alias.length) {
				Object.assign(this.$root.app_fields, JSON.parse(`{"${this.alias}":{"type":"${this.vartype}", "nullable":${this.nullable}, "file":"${this.configfile}"}}`));
			}
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":${Boolean(this.initial)}}`));
			if (this.alias && this.alias.length) {
				Object.assign(this.$root.app_state, JSON.parse(`{"${this.alias}":${Boolean(this.initial)}}`));
			}
		}
	},
	mounted() {
		componentTooltip(this);
	},
	updated() {
		componentTooltip(this);
	},
	template: `<div class="form-check form-check-inline" v-if="ifCondition" v-show="showCondition"
		data-bs-toggle="popover" :data-bs-title="tooltiptitle">
		<input class="form-check-input" type="checkbox"
		v-model="modelValue" :id="name" :name="name" :config-file="configfile" :var-type="vartype">
		<label class="form-check-label" :for="name" v-if="label.length">{{ label }}</label>
		</div>`
};

window.ComboBoxComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "" },
		label: { type: String, default: "Combobox" },
		vartype: { type: String, default: "" },
		opts: { type: Array, default: [{ id: 1, value: 'option1' }] },
		keyname: { type: String, default: "id" },
		valname: { type: String, default: "value" },
		filter: { type: String, default: "true" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: String, default: "" },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" },
		nullable: { type: Boolean, default: false },
		changecb: { type: String }
	},
	computed: {
		modelValue: {
			get() {
				return typeConverter(this.vartype, this.$root.app_state[this.name]);
			},
			set(newValue) {
				this.$root.app_fields[this.name] = { type: this.vartype, nullable: this.nullable, file: this.configfile };
				this.$root.app_state[this.name] = typeConverter(this.vartype, newValue);
			}
		},
		filteredOpts() {
			return this.opts.filter(item => {
				try {
					return new Function('item', 'app_state', `return ${this.filter};`)(item, this.$root.app_state);
				} catch (error) {
					console.error("Invalid expression:", error);
					return true; // Default to returning all items if there's an error
				}
			});
		},
		showCondition() {
			try {
				return new Function('app_state', `return ${this.show};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		},
		ifCondition() {
			try {
				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		}
	},
	methods: {
		async handleChange(event) {
			if (this.changecb) {
				const asyncFunc = new Function('app_scope', 'target', `return ${this.changecb}(app_scope, target);`);
				await asyncFunc(this, event.target.value);
			}
		},
	},
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_fields, JSON.parse(`{"${this.name}":{"type":"${this.vartype}", "nullable":${this.nullable}, "file":"${this.configfile}"}}`));
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":"${this.initial}"}`));
		}
	},
	mounted() {
		componentTooltip(this);
		if (this.changecb) {
			const asyncFunc = new Function('app_scope', 'target', `return ${this.changecb}(app_scope, target);`);
			asyncFunc(this, new Event('component_init'));
		}
	},
	updated() {
		componentTooltip(this);
	},
	template: `<div :class="label.length ? 'mb-3':''" v-if="ifCondition" v-show="showCondition"
		data-bs-toggle="popover" :data-bs-title="tooltiptitle">
		<label class="form-check-label" :for="name"  v-if="label.length">{{ label }}</label>
		<select class="form-select form-select-md" :name="name" :id="name" v-model="modelValue"
		:config-file="configfile" :var-type="vartype" :class="nullable ? 'nullable':''" @change="handleChange">
		<option v-if="nullable"></option>
		<option v-for="o in filteredOpts" :key="o[keyname]" :value="o[keyname]">
		{{ o[valname] }}
		</option>
		</select>
		</div>`
};

window.RangeComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "" },
		label: { type: String, default: "Enables/Disables control" },
		min: { type: String },
		max: { type: String },
		step: { type: String },
		vartype: { type: String, default: "float" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: String, default: "0" },
		units: { type: String, default: "" },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" }
	},
	computed: {
		modelValue: {
			get() {
				return typeConverter(this.vartype, this.$root.app_state[this.name]);
			},
			set(newValue) {
				this.$root.app_state[this.name] = typeConverter(this.vartype, newValue);
			}
		},
		showCondition() {
			try {
				return new Function('app_state', `return ${this.show};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		},
		ifCondition() {
			try {
				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		}
	},
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_fields, JSON.parse(`{"${this.name}":{"type":"${this.vartype}", "nullable":false, "file":"${this.configfile}"}}`));
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":${this.initial}}`));
		}
	},
	mounted() {
		componentTooltip(this);
	},
	updated() {
		componentTooltip(this);
	},
	template: `<div :class="label.length ? 'mb-3':''" v-if="ifCondition" v-show="showCondition"
		data-bs-toggle="popover"
		:data-bs-title="tooltiptitle">
		<label class="form-check-label" :for="name" v-if="label.length">{{ label }} <span>{{modelValue}}</span>{{units}}</label>
		<input type="range" class="form-range" :min="min" :max="max" :step="step" :name="name"
		:id="name" v-model="modelValue"
		:config-file="configfile" :var-type="vartype">
		</div>`
};

window.AlertComponent = {
	props: {
		label: { type: String, default: "Alert" },
		labelcolor: { type: String, default: "" },
		alerttype: { type: String, default: "danger" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		noclose: { type: Boolean, default: false }
	},
	data() {
		return {
			convertedContent: '',
		};
	},
	mounted() {
		this.convertSlotContent();
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
		classVal() {
			return `alert alert-${this.alerttype} left-align alert-dismissible fade show`;
		},
		titleColor() {
			return (this.labelcolor.length) ? `color:${this.labelcolor}` : `color:${this.alerttype}`;
		}
	},
	methods: {
		convertSlotContent() {
			let slotNode = this.$slots.default?.()[0]; // Access slot content
			let rawText = slotNode?.children?.trim() || ''; // Extract raw text

			let converter = new showdown.Converter({
				openLinksInNewWindow: true,
				simpleLineBreaks: true
			});
			converter.setOption('simpleLineBreaks', true);
			this.convertedContent = converter.makeHtml(rawText); // Convert Markdown to HTML
		}
	},
	template: `<div :class="classVal" role="alert" v-if="ifCondition" v-show="showCondition">
    <h2 :style="titleColor" v-if="label.length">{{label}}</h2>
    <p v-html="convertedContent"></p>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" v-if="!noclose"></button>
  </div>`
};

window.MessageComponent = {
	props: {
		label: { type: String, default: "Alert" },
		labelcolor: { type: String, default: "red" },
		alerttype: { type: String, default: "danger" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" }
	},
	data() {
		return {
			convertedContent: '',
		};
	},
	mounted() {
		this.convertSlotContent();
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
	methods: {
		convertSlotContent() {
			let slotNode = this.$slots.default?.()[0]; // Access slot content
			let rawText = slotNode?.children?.trim() || ''; // Extract raw text

			let converter = new showdown.Converter({
				openLinksInNewWindow: true,
				simpleLineBreaks: true
			});
			converter.setOption('simpleLineBreaks', true);
			this.convertedContent = converter.makeHtml(rawText); // Convert Markdown to HTML

			const toast = new bootstrap.Toast(this.$el, {
				delay: 5000,
			});
			toast.show();
		}
	},
	template: `<div class="toast" role="alert" aria-live="assertive" aria-atomic="true"  v-if="ifCondition" v-show="showCondition">
		<div :class="'toast-header text-bg-' + alerttype">
		<strong class="me-auto">{{label}}</strong>
		<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
		</div>
		<div class="toast-body" v-html="convertedContent">
		</div>
		</div>`
};

// window.MessageComponent = {
// 	props: {
// 		name: { type: String, required: true },
// 		label: { type: String, default: "Alert" },
// 		labelcolor: { type: String, default: "red" },
// 		alerttype: { type: String, default: "danger" },
// 		if: { type: String, default: "true" },
// 		hiden: { type: Boolean, default: false }
// 	},
// 	data() {
// 		return {
// 			convertedContent: '',
// 			toastInstance: null,
// 		};
// 	},
// 	created() {
// 		if (!window.messageComponents) {
// 			window.messageComponents = {};
// 		}
// 		window.messageComponents[this.name] = this; // Register the component globally
// 	},
// 	mounted() {
// 		this.convertSlotContent();
// 		this.initializeToast();
// 		if (!Boolean(this.hiden)) {
// 			this.showToast();
// 		}
// 		// else{
// 		// 	if (this.toastInstance) {
// 		// 		this.toastInstance.hide();
// 		// 	}
// 		// }
// 		this.hiden = false;
// 	},
// 	computed: {
// 		ifCondition() {
// 			try {
// 				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
// 			} catch (error) {
// 				console.error("Invalid expression:", error);
// 				return true;
// 			}
// 		},
// 	},
// 	methods: {
// 		initializeToast() {
// 			this.toastInstance = new bootstrap.Toast(this.$el, {
// 				delay: 5000
// 			});
// 		},
// 		showToast(timeout = 5000) {
// 			if (this.toastInstance) {
// 				this.toastInstance._config.delay = timeout;
// 				this.toastInstance.show();
// 			}
// 		},
// 		convertSlotContent() {
// 			let slotNode = this.$slots.default?.()[0];
// 			let rawText = slotNode?.children?.trim() || '';

// 			let converter = new showdown.Converter({
// 				openLinksInNewWindow: true,
// 				simpleLineBreaks: true
// 			});
// 			converter.setOption('simpleLineBreaks', true);
// 			this.convertedContent = converter.makeHtml(rawText);
// 		},
// 	},
// 	template: `<div :id="name" class="toast" role="alert" aria-live="assertive" aria-atomic="true" v-if="ifCondition">
//         <div :class="'toast-header text-bg-' + alerttype">
//             <strong class="me-auto">{{label}}</strong>
//             <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
//         </div>
//         <div class="toast-body" v-html="convertedContent"></div>
//     </div>`
// };


window.TextFieldComponent = {
	props: {
		name: { type: String, required: true },
		label: { type: String, default: "Input text" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		configfile: { type: String, default: "" },
		placeholder: { type: String, default: "" },
		initial: { type: String, default: "" },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" },
		pattern: { type: String, default: ".*" }
	},
	computed: {
		modelValue: {
			get() {
				return typeConverter(this.vartype, this.$root.app_state[this.name]);
			},
			set(newValue) {
				this.$root.app_state[this.name] = typeConverter(this.vartype, newValue);
			}
		},
		showCondition() {
			try {
				return new Function('app_state', `return ${this.show};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		},
		ifCondition() {
			try {
				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		}
	},
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_fields, JSON.parse(`{"${this.name}":{"type":"${this.vartype}", "nullable":false, "file":"${this.configfile}"}}`));
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":"${this.initial}"}`));
		}
	},
	mounted() {
		componentTooltip(this);
		const input = this.$el;
		const regex = new RegExp(this.pattern);
		regex.test(input.value) ? input.classList.remove("is-invalid") : input.classList.add("is-invalid");
	},
	updated() {
		componentTooltip(this);
	},
	methods: {
		validateInput(event) {
			const input = event.target;
			const regex = new RegExp(this.pattern);
			regex.test(input.value) ? input.classList.remove("is-invalid") : input.classList.add("is-invalid");
		}
	},
	template: `<div :class="label.length ? 'mb-3':''"  v-if="ifCondition" v-show="showCondition"
		data-bs-toggle="popover"
		:data-bs-title="tooltiptitle">
		<label for="" class="form-label" v-if="label.length">{{label}}</label>
		<input type="text" class="form-control" :name="name" :id="name" v-model="modelValue"
		:placeholder="placeholder" :config-file="configfile" :pattern="pattern" @input="validateInput">
		</div>`
};

window.TextAreaFieldComponent = {
	props: {
		name: { type: String, required: true },
		label: { type: String, default: "Input text" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		configfile: { type: String, default: "" },
		placeholder: { type: String, default: "" },
		initial: { type: String, default: "" },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" },
		pattern: { type: String, default: ".*" }
	},
	computed: {
		modelValue: {
			get() {
				return this.$root.app_state[this.name];
			},
			set(newValue) {
				this.$root.app_state[this.name] = newValue;
			}
		},
		showCondition() {
			try {
				return new Function('app_state', `return ${this.show};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		},
		ifCondition() {
			try {
				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		}
	},
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_fields, JSON.parse(`{"${this.name}":{"type":"${this.vartype}", "nullable":false, "file":"${this.configfile}"}}`));
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":"${this.initial}"}`));
		}
	},
	mounted() {
		componentTooltip(this);
		const input = this.$el;
		const regex = new RegExp(this.pattern);
		regex.test(input.value) ? input.classList.remove("is-invalid") : input.classList.add("is-invalid");
	},
	updated() {
		componentTooltip(this);
	},
	methods: {
		validateInput(event) {
			const input = event.target;
			const regex = new RegExp(this.pattern);
			regex.test(input.value) ? input.classList.remove("is-invalid") : input.classList.add("is-invalid");
		}
	},
	template: `<div :class="label.length ? 'mb-3':''"  v-if="ifCondition" v-show="showCondition"
		data-bs-toggle="popover"
		:data-bs-title="tooltiptitle">
		<label for="" class="form-label" v-if="label.length">{{label}}</label>
		<textarea class="form-control" :name="name" :id="name" v-model="modelValue"
		:placeholder="placeholder" :config-file="configfile" :pattern="pattern" @input="validateInput"></textarea>
		</div>`
};

window.BitFieldComponent = {
	props: {
		name: { type: String, required: true },
		decval: { type: String, default: "0" },
		bitval: { type: Array, default: () => Array(8).fill(false) },
		label: { type: String, default: "Bit mask" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		configfile: { type: String, default: "" },
		initial: { type: String, default: "0" },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" },
		bitprefix: { type: String, default: "" },
		bitsufix: { type: String, default: "" },
	},
	computed: {
		modelValue: {
			get() {
				return typeConverter('int', this.$root.app_state[this.name]);
			},
			set(newValue) {
				this.$root.app_state[this.name] = typeConverter('int', newValue);
				updateBits();
			}
		},
		showCondition() {
			try {
				return new Function('app_state', `return ${this.show};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		},
		ifCondition() {
			try {
				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		}
	},
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_fields, JSON.parse(`{"${this.name}":{"type":"${this.vartype}", "nullable":false, "file":"${this.configfile}"}}`));
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":${this.initial}}`));
		}
	},
	mounted() {
		this.updateBits();
		componentTooltip(this);
		const input = this.$el;
		const regex = new RegExp(this.pattern);
		regex.test(input.value) ? input.classList.remove("is-invalid") : input.classList.add("is-invalid");
	},
	updated() {
		componentTooltip(this);
	},
	methods: {
		updateBits() {
			const value = Number(this.modelValue);
			for (let i = 0; i < 8; i++) {
				this.bitval[i] = Boolean(value & (1 << i));
			}
			this.$forceUpdate();
		},

		updateDecimal() {
			let value = 0;
			this.bitval.forEach((bit, index) => {
				if (bit) value |= (1 << index);
			});
			this.modelValue = value.toString();
		}
	},
	template: `<div class="p-1" v-if="ifCondition" v-show="showCondition" data-bs-toggle="popover" :data-bs-title="tooltiptitle">
		<label class="form-check-label" :for="name"  v-if="label.length">{{ label }}</label>
		<div class="d-flex align-items-center flex-wrap">
		<label v-for="(bit, index) in bitval" :key="index" class="d-inline-flex p-1">
		<input class="form-check-input" type="checkbox"	v-model="bitval[index]" @change="updateDecimal"><div class="d-flex ml-2">{{bitprefix}}{{index}}{{bitsufix}}</div>
		</label>
		<input type="number" min="0" max="255" class="form-control w-25" style="min-width:70px;" v-model="modelValue" @change="updateBits">
		</div>
		</div>`,
};

window.PinComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "hal" },
		label: { type: String, default: "Combobox" },
		vartype: { type: String, default: "" },
		filter: { type: String, default: "true" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: String, default: "" },
		tooltip: { type: String, default: "" },
	},
	computed: {
		isPinUndefined() {

			if (this.$root.app_state[this.name] == undefined || !this.$root.app_state[this.name].length) {
				return false;
			}

			if (this.$root.app_state[this.$root.app_state[this.name] + '_BIT'] != undefined && this.$root.app_state[this.$root.app_state[this.name] + '_BIT'].length) {
				switch (window.app_vars.app_state) {
					case 'MCU_ESP8266':
					case 'MCU_ESP32':
					case 'MCU_RP2040':
					case 'MCU_RP2350':
						return false;
					default:
						if (this.$root.app_state[this.$root.app_state[this.name] + '_PORT'] != undefined && this.$root.app_state[this.$root.app_state[this.name] + '_PORT'].length) {
							return false;
						}
						break;
				}
			}

			if (this.$root.app_state[this.$root.app_state[this.name] + '_IO_OFFSET'] != undefined && this.$root.app_state[this.$root.app_state[this.name] + '_IO_OFFSET'].length) {
				return false;
			}

			return true;
		},
		showCondition() {
			try {
				return new Function('app_state', `return ${this.show};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		},
		ifCondition() {
			try {
				return new Function('app_state', `return ${this.if};`)(this.$root.app_state);
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		}
	},
	template: `<div v-if="ifCondition" v-show="showCondition">
	<combobox :name="name" :label="label"
	:opts="this.$root.app_options.UCNCPINS" keyname="pin" valname="pin"
	:filter="filter" nullable :initial="initial" :tooltip="tooltip"
	:vartype="vartype" :configfile="configfile">
	</combobox>
	<alert alerttype="warning" labelcolor="warning" label="" v-if="isPinUndefined" noclose>**WARNING:** Pin {{this.$root.app_state[name]}} is not defined.</alert>
	</div>`
}

window.ButtonComponent = {
	props: {
		label: { type: String, default: "Clik me!" },
		labelcolor: { type: String, default: "warning" },
		if: { type: String, default: "true" },
		enable: { type: String, default: "" },
		disable: { type: String, default: "" },
		// customcb: { type: String, default: "" },
	},
	methods: {
		async runCallback() {
			this.enable.split(',').forEach((e) => {
				this.$root.app_state[e] = true;
			});
			this.disable.split(',').forEach((e) => {
				this.$root.app_state[e] = false;
			});
			// if (this.customcb) {
			// 	const asyncFunc = new Function('app_scope', `return ${this.customcb}(app_scope);`);
			// 	await asyncFunc(this);
			// }
		}
	},
	computed: {
		ifCondition() {
			try {
				let ifstate = new Function('app_state', `return ${this.if};`)(this.$root.app_state);
				if (!ifstate) {
					return false;
				}
				if (this.enable.split(',').some(val => this.$root.app_state[val] == false)) {
					return true;
				}

				if (this.disable.split(',').some(val => this.$root.app_state[val] == true)) {
					return true;
				}


				return false;
			} catch (error) {
				console.error("Invalid expression:", error);
				return true; // Default to returning all items if there's an error
			}
		}
	},
	template: `<button type="button" :class="'btn btn-outline-'+labelcolor"
			@click="runCallback"  v-if="ifCondition"><slot></slot></button>`
}

window.InputComponent = {
	props: {
		type: { type: String, required: true },
		label: { type: String },
		accept: { type: String },
		changecb: { type: String },
		clickcb: { type: String },
		customclass: { type: String }
	},
	methods: {
		async handleChange(event) {
			if (this.changecb) {
				const asyncFunc = new Function('app_scope', 'event', `return ${this.changecb}(app_scope, event);`);
				await asyncFunc(this, event);
			}
		},
		async handleClick(event) {
			if (this.clickcb) {
				const asyncFunc = new Function('app_scope', 'event', `return ${this.clickcb}(app_scope, event);`);
				await asyncFunc(this, event);
			}
		},
	},
	template: `<input :value="label" :class="customclass" :type="type" :accept="accept" @change="handleChange" @click="handleClick">`
}
