window.STM32SDIOComponent = {
	template: `
<toggle configfile="hal,module" name="stm32_sdio" label="Enable SDIO interface for SD card module"
tooltip="Enable STM32 SDIO interface for SD card module. This is to be allow using the SD card module vis SDIO instead of SPI"
if="app_state.MCU.includes('STM32') && app_state.sd_card_v2">
</toggle>

<buttoncb if="app_state.stm32_sdio" enable="ENABLE_PARSER_MODULES,ENABLE_MAIN_LOOP_MODULES" disable="DISABLE_SETTINGS_MODULES">Fix requirements!</buttoncb>
<check if="app_state.stm32_sdio" name="SD_CARD_CUSTOM_HW_DRIVER" label="Use the SDIO interface" initial="true"></check>
` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('stm32_sdio', window.STM32SDIOComponent);
	window.ModuleLoaderComponent.template += `<stm32_sdio v-if="(modfilter=='' || modfilter=='storage')"></stm32_sdio>`;
});