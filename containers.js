window.addEventListener("ucnc_components", (e) => {
	e.detail.component('controlgroup', ControlGroupComponent);
	e.detail.component('tabgroup', TabGroupComponent);
	e.detail.component('tab', TabComponent);
	e.detail.component('repeater', RepeaterGroupComponent);
	e.detail.component('vtable', TableComponent);
});

const ControlGroupComponent = {
	props: {
		label: { type: String, default: "Control group" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" }
	},
	computed: {
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
	template: `<fieldset v-if="ifCondition" v-show="showCondition">
					<legend>{{label}}</legend>
					<slot></slot>
					</fieldset>`
};

const TabGroupComponent = {
	props: {
		id: { type: String, required: true },
	},
	template: `<ul class="nav nav-tabs" role="tablist" :id="id">
			</ul>
			<div class="tab-content">
			<slot></slot>
			</div>`
};

const TabComponent = {
	props: {
		id: { type: String, required: true },
		label: { type: String, required: true },
		tabid: { type: String, required: true },
		active: { type: Boolean, default: false }
	},
	template: `
	<li class="nav-item" role="presentation">
				<button :class="'nav-link ' + [active ? 'active' : '']" :id="id+'-tab'" data-bs-toggle="tab" :data-bs-target="'#' + id"
    type="button" role="tab" :aria-controls="id+'-tab'" aria-selected="true">{{ label }}</button>
			</li>
			<!-- Tab pane -->
			<div :class="'tab-pane ' + [active ? 'show active' : '']" :id="id" role="tabpanel" :aria-labelledby="id+'-tab'">
			<slot></slot>
			</div>
			`,
	mounted() {
		// Target the element you want to move
		const elementToMove = document.querySelector("li>#" + this.id + '-tab').parentNode;
		// Define the new parent container
		const targetContainer = document.getElementById(this.tabid);

		if (elementToMove && targetContainer) {
			targetContainer.appendChild(elementToMove); // Move the element inside new parent
		} else {
			console.warn("Target element or container not found!");
		}
	}
};

const RepeaterGroupComponent = {
	props: {
		label: { type: String, default: "Repeater group" },
		opts: { type: Array, required: true },
		keyname: { type: String, default: "id" },  // Renamed to clarify usage
		valname: { type: String, default: "value" },
		filter: { type: String, default: "item" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
	},
	computed: {
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
	template: `<fieldset v-if="ifCondition" v-show="showCondition">
					<legend>{{label}}</legend>
					<slot v-for="o in filteredOpts" :key="o[keyname]" :value="o[keyname]"></slot>
					</fieldset>`
};

const TableComponent = {
	props: {
		opts: { type: Array, required: true },
		keyname: { type: String, default: "id" },  // Renamed to clarify usage
		valname: { type: String, default: "value" },
		filter: { type: String, default: "item" },
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		rowitem: { type: Object }
	},
	computed: {
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
	template: `<table class="table">
	<thead>
	<tr><slot name="head"></slot></tr>
	</thead>
	<tbody>
	<tr v-for="o in filteredOpts" :key="o[keyname]" :value="o[keyname]">
	<slot name="row" :rowitem="o"></slot>
	</tr>
	</tbody>
	</table>`
};

const TableCellComponent = {
	props: {
		show: { type: String, default: "true" },
		if: { type: String, default: "true" },
		rowitem: { type: Object }
	},
	computed: {
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
	template: `<td v-if="ifCondition" v-show="showCondition">
	<slot :rowitem="rowitem"></slot>
	</td>`
};
