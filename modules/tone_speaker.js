window.ToneSpeakerComponent = {
	template: `
<toggle name="ENABLE_TONE_SPEAKER" label="Enable Tone Speaker module"
tooltip="Enables the Tone Speaker extension module." configfile="hal">
</toggle>
<buttoncb if="app_state.ENABLE_TONE_SPEAKER" enable="ENABLE_MAIN_LOOP_MODULES">Fix requirements!</buttoncb>
<controlgroup if="app_state.ENABLE_TONE_SPEAKER" label="Tone Speaker options">
<pin name="SPEAKER_PWM" label="Speaker pwm pin"  initial="PWM1" filter="item.type.includes('pwm')"></pin>
<toggle name="ENABLE_BOOT_JINGLE" label="Enable tone jingle" configfile="hal"></toggle>
<textfield name="BOOT_JINGLE_TUNE" label="Custom boot jingle" tooltip="The jingle should be a sequence of notes (0 to 255) and durations in milliseconds, separated by commas must be between curly braces. For example the default jingle is: { 250, 1567, 125, 1174, 125, 1318, 125, 1567 }" pattern="^\{([\d\s\,])*\}$"></textfield>
</controlgroup>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('tone_speaker', window.ToneSpeakerComponent);
	window.ModuleLoaderComponent.template += `<tone_speaker v-if="(modfilter=='' || modfilter=='other')"></tone_speaker>`;
});

