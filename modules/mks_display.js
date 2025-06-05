window.MKSDisplayComponent = {
    template: `
<toggle name="mks_display" label="Enable MKS Display module"
tooltip="Enables MKS TFT color displays." configfile="module">
</toggle>

<buttoncb enable="ENABLE_MAIN_LOOP_MODULES,ENABLE_ITP_FEED_TASK" if="app_state.mks_display">Enable required extension options</buttoncb>

<controlgroup label="TFT Display options" if="app_state.mks_display">
    <combobox configfile="hal" name="TFT_DISPLAY_SPI_INTERFACE" label="Select SPI interface"
        :opts="[
        {id:'HW_SPI', value:'Hardware SPI'},
        {id:'HW_SPI2', value:'Hardware SPI2'},
        {id:'SW_SPI', value:'Software emulated (very slow)'}]" initial="HW_SPI">
    </combobox>

    <controlgroup if="app_state.TFT_DISPLAY_SPI_INTERFACE === 'SW_SPI'" label="Software SPI Pinout">
        <pin configfile="hal" name="SD_SPI_CLK" label="Select SPI clock pin" initial="DOUT30"
            filter="item.type.includes('generic_output')"></pin>
        <pin configfile="hal" name="SD_SPI_SDO" label="Select SPI data output pin" initial="DOUT29"
            filter="item.type.includes('generic_output')"></pin>
        <pin configfile="hal" name="SD_SPI_SDI" label="Select SPI data input pin" initial="DIN29"
            filter="item.type.includes('generic_input')"></pin>
    </controlgroup>

    <pin configfile="hal" name="TFT_DISPLAY_SPI_CS" label="Select SPI chip select pin" initial="DOUT32"
        filter="item.type.includes('generic_output')"></pin>
    <pin configfile="hal" name="TFT_DISPLAY_SPI_DC" label="Select SPI DC pin" initial="DOUT33"
        filter="item.type.includes('generic_output')"></pin>
    <pin configfile="hal" name="TFT_DISPLAY_BKL" label="Select backlight pin" initial="DOUT34"
        filter="item.type.includes('generic_output')"></pin>

    <toggle configfile="hal" name="TFT_DISPLAY_BKL_INVERT" label="Invert backlight pin"></toggle>

    <pin configfile="hal" name="TFT_DISPLAY_RST" label="Select reset pin" initial="DOUT35"
        filter="item.type.includes('generic_output')"></pin>
    <toggle name="TFT_DISPLAY_RST_INVERT" label="Invert reset pin"></toggle>

    <pin configfile="hal" name="TFT_DISPLAY_TOUCH_CS" label="Select touch chip select pin" initial="DOUT36"
        filter="item.type.includes('generic_output')"></pin>
    <pin configfile="hal" name="TFT_DISPLAY_TOUCH_IRQ_PRESS" label="Select touch IRQ pin" initial="DIN36"
        filter="item.type.includes('generic_input')"></pin>
</controlgroup>
`
};

window.addEventListener("ucnc_load_components", () => {
    window.ucnc_app.component('mks_display', window.MKSDisplayComponent);
    window.ModuleLoaderComponent.template += `<mks_display v-if="(modfilter=='' || modfilter=='display')"></mks_display>`;
});
