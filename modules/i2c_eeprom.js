window.I2CEEPROMComponent = {
    template: `
		<toggle name="i2c_eeprom" label="Enable I2C EEPROM module"
tooltip="Enables support for I2C EEPROM to store settings." configfile="module">
</toggle>

 <buttoncb if="app_state.i2c_eeprom" 
        disable="DISABLE_SETTINGS_MODULES">Fix requirements!</buttoncb>

<controlgroup label="I2C EEPROM Settings" if="app_state.i2c_eeprom">
  
    <combobox configfile="hal" name="I2C_EEPROM_INTERFACE" label="Select I2C EEPROM interface"
        :opts="[
        {id:'SW_I2C', value:'Software I2C'},
        {id:'HW_I2C', value:'Hardware I2C'}]" initial="HW_I2C">
    </combobox>

    <controlgroup if="app_state.I2C_EEPROM_INTERFACE === 'SW_I2C'" label="Software I2C Pinout">
        <pin configfile="hal" name="I2C_EEPROM_I2C_CLOCK" label="Select I2C clock pin" initial="DIN30"
            filter="item.type.includes('generic_output') || item.type.includes('unsafe_generic_input')"></pin>
        <pin configfile="hal" name="I2C_EEPROM_I2C_DATA" label="Select I2C data pin" initial="DIN31"
            filter="item.type.includes('generic_output') || item.type.includes('unsafe_generic_input')"></pin>
    </controlgroup>

    <alert if="app_state.RAM_ONLY_SETTINGS" alerttype="warning">
        Settings storing on I2C EEPROM will not work with NVM storage disabled!
    </alert>
		<alert if="app_state.ENABLE_SD_CARD_V2_MODULE && app_state.ENABLE_SETTINGS_ON_SD_SDCARD" alerttype="warning">
        Settings storing on I2C EEPROM is not compatible with settings storing on the SD card module!!
    </alert>
</controlgroup>
`
};

window.addEventListener("ucnc_load_components", () => {
    window.ucnc_app.component('i2c_eeprom', window.I2CEEPROMComponent);
    window.ModuleLoaderComponent.template += `<i2c_eeprom v-if="(modfilter=='' || modfilter=='storage')"></i2c_eeprom>`;
});
