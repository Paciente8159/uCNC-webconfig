window.TFTDisplayComponent = {
	template: `
		<toggle name="tft_display" label="Enable TFT Display module"
tooltip="Adds support for TFT displays like the ILI9341 and others. Uses lvgl_support to display a Win95 style menu" configfile="module">
</toggle>

<buttoncb enable="ENABLE_MAIN_LOOP_MODULES,ENABLE_ITP_FEED_TASK" if="app_state.mks_display">Fix requirements!</buttoncb>


<controlgroup label="TFT Display Settings" if="app_state.mks_display">
<alert alerttype="info" labelcolor="primary" label="Dependencies">
								This module requires lvgl_support module and external libraries. Download and use the platformio.ini for PlatformIO.
							</alert>

<toggle name="TFT_USES_SPI_HARDWARE" label="Use hardware SPI?"
</toggle>
    <combobox if="app_state.TFT_USES_SPI_HARDWARE" name="TFT_SPI_HARDWARE_PORT" label="Select SPI hardware port"
        :opts="[{ id: '1', value: 'SPI' }, { id: '2', value: 'SPI2' }]" vartype="int" initial="1" configfile="hal">
    </combobox>

    <controlgroup label="SPI Pin Configuration">
        <pin if="!app_state.TFT_USES_SPI_HARDWARE" name="TFT_SPI_CLK" label="Select SPI clock pin"
            filter="item.type.includes('generic_output')" configfile="hal"></pin>
        <pin if="!app_state.TFT_USES_SPI_HARDWARE" name="TFT_SPI_MOSI" label="Select SPI MOSI pin"
            filter="item.type.includes('generic_output')" configfile="hal"></pin>
        <pin name="TFT_RS" label="Select RS pin"
            filter="item.type.includes('generic_output')" configfile="hal"></pin>
        <pin name="TFT_CS" label="Select chip select pin"
            filter="item.type.includes('generic_output')" configfile="hal"></pin>
        <pin name="TFT_RESET" label="Select reset pin"
            filter="item.type.includes('generic_output')" configfile="hal"></pin>
        <pin name="TFT_BACKLIGHT" label="Select backlight pin"
            filter="item.type.includes('generic_output')" configfile="hal"></pin>
    </controlgroup>
</controlgroup>
`
};

window.addEventListener("ucnc_load_components", () => {
	window.ucnc_app.component('tft_display', window.TFTDisplayComponent);
	window.ModuleLoaderComponent.template += `<tft_display v-if="(modfilter=='' || modfilter=='display')"></tft_display>`;
});
