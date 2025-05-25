const CheckComponent = {
	props: {
		name: { type: String, required: true },
		configfile: { type: String, default: "" },
		label: { type: String, default: "Enables/Disables control" },
		vartype: { type: String, default: "" },
		filter: { type: String, default: "item" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: Boolean, default: false }
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
		filteredOpts() {
			return this.opts.filter(item => {
				try {
					return new Function('item', `return ${this.filter};`)(item);
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
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":${this.initial}}`));
		}
	},
	template: `<div class="form-check form-switch" v-if="ifCondition" v-show="showCondition">
        <input class="form-check-input" type="checkbox" v-model="modelValue" :id="name" :name="name" :config-file="configfile" :var-type="vartype">
        <label class="form-check-label" :for="name">{{ label }}</label>
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
		initial: { type: String, default: "" }
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
		filteredOpts() {
			return this.opts.filter(item => {
				try {
					return new Function('item', `return ${this.filter};`)(item);
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
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":"${this.initial}"}`));
		}
	},
	template: `<div class="mb-3" v-if="ifCondition" v-show="showCondition">
                        <label class="form-check-label" :for="name">{{ label }}</label>
                        <select class="form-select form-select-md" :name="name" :id="name" v-model="modelValue" :config-file="configfile" :var-type="vartype">
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
		filter: { type: String, default: "item" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		initial: { type: String, default: "0" },
		units: { type: String, default: "" }
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
		filteredOpts() {
			return this.opts.filter(item => {
				try {
					return new Function('item', `return ${this.filter};`)(item);
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
	created() {
		if (!(this.name in this.$root.app_state)) {
			Object.assign(this.$root.app_state, JSON.parse(`{"${this.name}":${this.initial}}`));
		}
	},
	template: `<div class="mb-3" v-if="ifCondition" v-show="showCondition">
	<label class="form-check-label" :for="name">{{ label }} <span>{{modelValue}}</span>{{units}}</label>
											<input type="range" class="form-range" :min="min" :max="max" :step="step" :name="name"
												:id="name" v-model="modelValue"
												:config-file="configfile" :var-type="vartype">
										</div>`
};
