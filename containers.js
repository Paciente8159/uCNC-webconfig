const ControlGroupComponent = {
	props: {
		label: { type: String, default: "Control group" },
	},
	template: `<fieldset>
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
		active:{ type: Boolean, default: false }
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
			console.log(`Moved element #${this.id} into #${this.tabid}`);
		} else {
			console.warn("Target element or container not found!");
		}
	}
};