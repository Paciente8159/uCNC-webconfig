window.ATCComponent = {
	template: `
<toggle name="atc" label="Enable ATC (automatic tool changer) module"
tooltip="Enables the ATC (automatic tool changer) module. This requires the board to some sort of file system (with in MCU flash or external vis the SD Card module).
It's possible to perform automatic tool changing using GCode script files that are read and executed each time you change a tool" configfile="module">
</toggle>

<buttoncb if="app_state.atc" enable="ENABLE_MAIN_LOOP_MODULES,ENABLE_ATC_HOOKS">Fix requirements!</buttoncb>
<controlgroup label="ATC Settings" if="app_state.atc">
<combobox configfile="hal" name="ATC_FS_DRIVE" label="Select the atc drive" :opts="[
            { id: 67, value: 'MCU Flash' }, { id: 68, value: 'SD Card' }]" initial="67" vartype="int">
							</combobox>
</controlgroup>
`
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('atc', window.ATCComponent);
	window.ModuleLoaderComponent.template += `<atc v-if="(modfilter=='' || modfilter=='tool')"></atc>`;
});

