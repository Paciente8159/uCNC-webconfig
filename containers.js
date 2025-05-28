window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('controlgroup', window.ControlGroupComponent);
	window.ucnc_app.component('tabgroup', window.TabGroupComponent);
	window.ucnc_app.component('tab', window.TabComponent);
	window.ucnc_app.component('repeater', window.RepeaterGroupComponent);
	window.ucnc_app.component('vtable', window.TableComponent);
	window.ucnc_app.component('accordion-card', window.AccordionCardComponent);
	window.ucnc_app.component('accordion', window.AccordionComponent);
});

window.ControlGroupComponent = {
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

window.TabGroupComponent = {
	props: {
		id: { type: String, required: true },
	},
	template: `<ul class="nav nav-tabs" role="tablist" :id="id">
			</ul>
			<div class="tab-content">
			<slot></slot>
			</div>`
};

window.TabComponent = {
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

window.AccordionComponent = {
	props: {
		id: { type: String, required: true },
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
	mounted() {
		// const bsCollapse = new bootstrap.Collapse('#' + this.id, {
		// 	toggle: true
		// });
		document.addEventListener('DOMContentLoaded', function () {
			document.querySelectorAll('.accordion-item').forEach(function (item) {

				// Listen for shown.bs.collapse event. Different from show.bs.collapse
				// Needs to be shown.bs.collapse otherwise the item has no height.
				item.addEventListener('shown.bs.collapse', function () {
					// Get the height of the item content
					var itemHeight = this.scrollHeight;

					// if itemHeight is bigger than window, then just scroll to top
					if (itemHeight >= window.innerHeight) {
						window.scrollTo({
							top: this.offsetTop,
							behavior: 'smooth'
						});
						// if the item is lower than it would be when we scroll down, then scroll
						// We use (window.innerHeight - itemHeight)/2 so that we can see that there are
						// items below the current item.
					} else if (this.offsetTop - (window.innerHeight - itemHeight) / 2 > window.scrollY) {
						window.scrollTo({
							top: this.offsetTop - (window.innerHeight - itemHeight) / 2,
							behavior: 'smooth'
						});
					}

				});
			});
		});
	},
	template: `<div class="accordion" :id="id">
		<slot></slot>
		</div>`
};

window.AccordionCardComponent = {
	props: {
		id: { type: String, required: true },
		accordionid: { type: String, required: true },
		label: { type: String, required: true },
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
	template: `<div class="accordion-item"  v-if="ifCondition" v-show="showCondition">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="'#'+id" aria-expanded="false" :aria-controls="id">
        {{label}}
      </button>
    </h2>
    <div :id="id" class="accordion-collapse collapse" :data-bs-parent="'#'+accordionid">
      <div class="accordion-body">
       <slot></slot>
      </div>
    </div>
  </div>`,
};

window.RepeaterGroupComponent = {
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
					<slot v-for="o in filteredOpts" :key="o[keyname]" :value="o[keyname]" :item="o"></slot>
					</fieldset>`
};

window.TableComponent = {
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

window.TableCellComponent = {
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
