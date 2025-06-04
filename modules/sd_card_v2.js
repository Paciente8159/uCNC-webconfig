window.SDCardV2Component = {
    template: `

		<toggle name="ENABLE_SD_CARD_V2_MODULE" label="Enable SD Card v2 module"
tooltip="Enables SD Card support. SD card is required to be able to run subrotines. It's also possible to store settings in the SD card.">
</toggle>

<buttoncb if="app_state.ENABLE_SD_CARD_V2_MODULE"
        enable="ENABLE_PARSER_MODULES,ENABLE_MAIN_LOOP_MODULES,DISABLE_SETTINGS_MODULES" disable="DISABLE_SETTINGS_MODULES">
				Fix requirements!</buttoncb>

<controlgroup label="SD Card Settings" if="app_state.ENABLE_SD_CARD_V2_MODULE">
    
    <combobox configfile="hal" name="SD_CARD_INTERFACE" label="Select SD Card interface"
        :opts="[
        {id:'SD_CARD_HW_SPI', value:'Hardware SPI'},
        {id:'SD_CARD_HW_SPI2', value:'Hardware SPI2'},
        {id:'SD_CARD_SW_SPI', value:'Software SPI'}]" initial="SD_CARD_HW_SPI">
    </combobox>

    <controlgroup if="app_state.SD_CARD_INTERFACE === 'SD_CARD_SW_SPI'" label="Software SPI Pinout">
        <pin configfile="hal" name="SD_SPI_CLK" label="Select SPI clock pin" initial="DOUT30"
            filter="item.type.includes('generic_output')"></pin>
        <pin configfile="hal" name="SD_SPI_SDO" label="Select SPI data output pin" initial="DOUT29"
            filter="item.type.includes('generic_output')"></pin>
        <pin configfile="hal" name="SD_SPI_SDI" label="Select SPI data input pin" initial="DIN29"
            filter="item.type.includes('generic_input')"></pin>
    </controlgroup>

    <pin configfile="hal" name="SD_SPI_CS" label="Select SPI chip select pin" initial="SPI_CS"
        filter="item.type.includes('generic_output')"></pin>
    <pin configfile="hal" name="SD_CARD_DETECT_PIN" label="Select card detect pin" initial="DIN19"
        filter="item.type.includes('generic_input')"></pin>

    <toggle configfile="hal" name="FF_USE_LFN" label="Enable long file names" initial="true">
    </toggle>

    <toggle configfile="hal" name="SD_CARD_SPI_DMA" label="Enable SPI DMA for SD Card"></toggle>
    <toggle configfile="hal" name="ENABLE_SETTINGS_ON_SD_SDCARD" label="Store settings on the SD card"></toggle>

    <alert if="app_state.RAM_ONLY_SETTINGS" alerttype="warning">
        Settings storing on SD card will not work with NVM storage disabled!
    </alert>
    <alert if="app_state.ENABLE_I2C_EEPROM_MODULE && app_state.ENABLE_SETTINGS_ON_SD_SDCARD" alerttype="warning">
        Settings storing on SD card is not compatible with the I2C EEPROM module!!
    </alert>
</controlgroup>
`
};

window.addEventListener("ucnc_load_components", () => {
    window.ucnc_app.component('sd_card_v2', window.SDCardV2Component);
    window.ModuleLoaderComponent.template += `<sd_card_v2 v-if="(modfilter=='' || modfilter=='storage')"></sd_card_v2>`;
});
