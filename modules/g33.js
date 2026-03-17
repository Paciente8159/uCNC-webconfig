window.G33Component = {
	template: `
<toggle name="g33" label="Enable G33 module"
tooltip="Enables the G33 parser extension module." configfile="module">
</toggle>
<buttoncb if="app_state.g33" enable="ENABLE_PARSER_MODULES,ENABLE_MAIN_LOOP_MODULES,ENABLE_IO_MODULES,ENABLE_RT_SYNC_MOTIONS">Fix requirements!</buttoncb>
<controlgroup if="app_state.g33" label="G33 options">
<combobox name="G33_ENCODER" label="Assing the Encoder used by G33" valname="id" :opts="[
			{ id: 'ENC0', enccount: 0 },
			{ id: 'ENC1', enccount: 1 },
			{ id: 'ENC2', enccount: 2 },
			{ id: 'ENC3', enccount: 3 },
			{ id: 'ENC4', enccount: 4 },
			{ id: 'ENC5', enccount: 5 },
			{ id: 'ENC6', enccount: 6 },
			{ id: 'ENC7', enccount: 7 }
		]" configfile="hal" nullable tooltip="You need to assign an encoder to be used by G33."></combobox>
		<toggle name="G33_FEEDBACK_LOOP_USE_ENC_PULSE" configfile="hal" label="Update the feedback loop using the pulse pin (faster)"
tooltip="Update the feedback loop using the pulse pin. This runs the update loop to run on each pulse of the encoder instead of the index pin (once per rotation)">
</toggle>
</controlgroup>`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('g33', window.G33Component);
	window.ModuleLoaderComponent.template += `<g33 v-if="(modfilter=='' || modfilter=='parser')"></g33>`;
});

