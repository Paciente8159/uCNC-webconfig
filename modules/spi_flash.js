window.FlashSPIComponent = {
	template: `
				<toggle name="spi_flash" label="Enable SPI NorFlash module"
tooltip="Enables SPI NorFlash support to allow using a nor flash to store settings." configfile="module">
</toggle>

<buttoncb if="app_state.spi_flash"
        enable="ENABLE_MAIN_LOOP_MODULES" disable="DISABLE_SETTINGS_MODULES">Enable required extension options</buttoncb>

<controlgroup label="Flash SPI Settings" if="app_state.spi_flash">
    
    <combobox name="FLASH_SPI_INTERFACE" label="Select Flash SPI interface"
        :opts="[
        {id:'FLASH_SPI_SW_SPI', value:'Software SPI'},
        {id:'FLASH_SPI_HW_SPI', value:'Hardware SPI'},
        {id:'FLASH_SPI_HW_SPI2', value:'Hardware SPI2'}]" initial="FLASH_SPI_SW_SPI"
				configfile="hal">
    </combobox>

    <controlgroup if="app_state.FLASH_SPI_INTERFACE === 'FLASH_SPI_SW_SPI'" label="Software SPI Pinout">
        <pin name="FLASH_SPI_CLK" label="Select SPI clock pin" initial="DOUT30"
            filter="item.type.includes('generic_output')" configfile="hal"></pin>
        <pin name="FLASH_SPI_SDO" label="Select SPI data output pin" initial="DOUT29"
            filter="item.type.includes('generic_output')" configfile="hal"></pin>
        <pin name="FLASH_SPI_SDI" label="Select SPI data input pin" initial="DIN29"
            filter="item.type.includes('generic_input')" configfile="hal"></pin>
    </controlgroup>

    <pin name="FLASH_SPI_CS" label="Select SPI chip select pin" initial="SPI_CS"
        filter="item.type.includes('generic_output')" configfile="hal"></pin>
</controlgroup>
`
};

window.addEventListener("ucnc_load_components", () => {
	window.ucnc_app.component('spi_flash', window.FlashSPIComponent);
	window.ModuleLoaderComponent.template += `<spi_flash v-if="(modfilter=='' || modfilter=='storage')"></spi_flash>`;
});
