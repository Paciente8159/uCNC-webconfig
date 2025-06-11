window.ToneSpeakerComponent = {
	template: `
<toggle name="tone_speaker" label="Enable Tone Speaker module"
tooltip="Enables the Tone Speaker extension module." configfile="module">
</toggle>
<buttoncb if="app_state.tone_speaker" enable="ENABLE_MAIN_LOOP_MODULES">Fix requirements!</buttoncb>

<controlgroup if="app_state.tone_speaker" label="Tone Speaker options">
<check if="app_state.tone_speaker" name="ENABLE_TONE_SPEAKER" label="Enable tone peaker" initial="true" configfile="hal"></check>
<pin if="app_state.ENABLE_TONE_SPEAKER" configfile="hal" name="SPEAKER_PWM" label="Speaker pwm pin"  initial="PWM1" filter="item.type.includes('pwm')"></pin>
<toggle if="app_state.ENABLE_TONE_SPEAKER" name="ENABLE_BOOT_JINGLE" label="Enable tone jingle" configfile="hal"></toggle>
<textfield if="app_state.ENABLE_TONE_SPEAKER" name="BOOT_JINGLE_TUNE" label="Custom boot jingle" tooltip="The jingle should be a sequence of notes (0 to 255) and durations in milliseconds, separated by commas must be between curly braces. For example the default jingle is: { 250, 1567, 125, 1174, 125, 1318, 125, 1567 }" pattern="^\{([\d\s\,])*\}$"></textfield>
</controlgroup>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('tone_speaker', window.ToneSpeakerComponent);
	window.ModuleLoaderComponent.template += `<tone_speaker v-if="(modfilter=='' || modfilter=='other')"></tone_speaker>`;
});

