window.STM32SDIOComponent = {
	template: `
<toggle name="SD_CARD_CUSTOM_HW_DRIVER" label="Enable SDIO interface for SD card module"
tooltip="Enable STM32 SDIO interface for SD card module. This is to be allow using the SD card module vis SDIO instead of SPI"
if="app_state.MCU.includes('STM32') && app_state.SD_CARD_MODULE">
</toggle>

<buttoncb if="app_state.SD_CARD_CUSTOM_HW_DRIVER" enable="ENABLE_PARSER_MODULES,ENABLE_MAIN_LOOP_MODULES" disable="DISABLE_SETTINGS_MODULES">Fix requirements!</buttoncb>` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('stm32sdio', window.STM32SDIOComponent);
	window.ModuleLoaderComponent.template += `<stm32sdio v-if="(modfilter=='' || modfilter=='storage')"></stm32sdio>`;
});