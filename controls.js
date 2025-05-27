window.addEventListener("ucnc_components", (e) => {
	e.detail.component('toggle', ToggleComponent);
	e.detail.component('check', CheckComponent);
	e.detail.component('combobox', ComboBoxComponent);
	e.detail.component('range', RangeComponent);
	e.detail.component('alert', AlertComponent);
	e.detail.component('textfield', TextFieldComponent);
	e.detail.component('bitfield', BitFieldComponent);
});

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

const ToggleComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "" },
		label: { type: String, default: "Enables/Disables control" },
		vartype: { type: String, default: "bool" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: Boolean, default: false },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" }
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
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":${this.initial}}`));
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

const CheckComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "" },
		label: { type: String, default: "Enables/Disables control" },
		vartype: { type: String, default: "bool" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: Boolean, default: false },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" }
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
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":${this.initial}}`));
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

const ComboBoxComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "" },
		label: { type: String, default: "Combobox" },
		vartype: { type: String, default: "" },
		opts: { type: Array, required: true },
		keyname: { type: String, default: "id" },  // Renamed to clarify usage
		valname: { type: String, default: "value" },
		filter: { type: String, default: "item" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: String, default: "" },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" },
		nullable: { type: Boolean, default: false }
	},
	computed: {
		modelValue: {
			get() {
				if (this.nullable && !this.$root.app_state[this.name]) {
					return null;
				}
				return this.$root.app_state[this.name];
			},
			set(newValue) {
				if (this.nullable && newValue.length == 0) {
					if ((this.name in this.$root.app_state)) { Object.delete(this.$root.app_state, this.name); }
					return;
				}
				this.$root.app_state[this.name] = newValue;
			}
		},
		filteredOpts() {
			return this.opts.filter(item => {
				try {
					return new Function('item', 'app_state', `return ${this.filter};`)(item, this.$root.app_state);
				} catch (error) {
					debugger;
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
	created() {
		if (!(this.name in this.$root.app_state)) {
			if (this.nullable && this.initial.length == 0) {
				return;
			}
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":"${this.initial}"}`));
		}
	},
	mounted() {
		componentTooltip(this);
	},
	updated() {
		componentTooltip(this);
	},
	template: `<div :class="label.length ? 'mb-3':''" v-if="ifCondition" v-show="showCondition"
		data-bs-toggle="popover" :data-bs-title="tooltiptitle">
		<label class="form-check-label" :for="name"  v-if="label.length">{{ label }}</label>
		<select class="form-select form-select-md" :name="name" :id="name" v-model="modelValue"
		:config-file="configfile" :var-type="vartype">
		<option v-if="nullable"></option>
		<option v-for="o in filteredOpts" :key="o[keyname]" :value="o[keyname]">
		{{ o[valname] }}
		</option>
		</select>
		</div>`
};

const RangeComponent = {
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

const AlertComponent = {
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
		classVal() {
			return `alert alert-${this.alerttype} left-align alert-dismissible fade show`;
		},
		titleColor() {
			return `color:${this.labelcolor}`;
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
    <h2 :style="titleColor">{{label}}</h2>
    <p v-html="convertedContent"></p>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>`
};

const TextFieldComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "" },
		label: { type: String, default: "Input text" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		configfile: { type: String, default: "" },
		placeholder: { type: String, default: "" },
		initial: { type: String, default: "" },
		tooltiptitle: { type: String, default: "Info" },
		tooltip: { type: String, default: "" },
		pattern: { type: String, default: "*" }
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
		<label for="" class="form-label" v-if="label.length">The board name printed with $I command? <span>{{modelValue}}</span></label>
		<input type="text" class="form-control" :name="name" :id="name" v-model="modelValue"
		:placeholder="placeholder" :config-file="configfile" :pattern="pattern" @input="validateInput">
		</div>`
};

const BitFieldComponent = {
	props: {
		decval: { type: String, required: true },
		bitval: { type: Array, default: Array(8).fill(false) },
		label: { type: String, default: "Input text" },
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
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":"${this.initial}"}`));
		}
	},
	methods: {
		updateBits() {
			debugger;
			const value = Number(this.modelValue);
			for (let i = 0; i < 8; i++) {
				this.bitval[i] = Boolean(value & (1 << (7 - i)));
			}
		},

		updateDecimal() {
			debugger;
			let value = 0;
			this.bitval.forEach((bit, index) => {
				if (bit) value |= (1 << (7 - index));
			});
			this.modelValue = value.toString();
		}
	},
	template: `<div class="d-flex align-items-center" v-if="ifCondition" v-show="showCondition"
		data-bs-toggle="popover"
		:data-bs-title="tooltiptitle">
	<label v-for="(bit, index) in bitval" :key="index" class="d-inline-flex">
	{{bitprefix}}{{7 - index}}{{bitsufix}}
	<input class="form-check-input" type="checkbox"
	v-model="bitval[index]" @change="updateDecimal">
	</label>
	<input type="number" min="0" max="255" class="form-control" v-model="modelValue" @input="updateBits">
	</div>`,
};
