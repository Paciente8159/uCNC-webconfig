window.GraphicDisplayComponent = {
	template: `
<toggle name="graphic_display" label="Enable Graphic Display module"
tooltip="Enables support for RepRap Full Graphic Display an other similar monochromatic displays." configfile="module">
</toggle>

<buttoncb if="app_state.graphic_display" enable="ENABLE_MAIN_LOOP_MODULES,ENABLE_ITP_FEED_TASK">Fix requirements!</buttoncb>

<controlgroup if="app_state.graphic_display" label="Graphic Display options">

<combobox name="GRAPHIC_DISPLAY_DRIVER" label="Select the graphic display driver type"
:opts="[
{id:'st7920_128x64_spi', value:'ST7920 128x64 via SPI'},
{id:'ssd1306_128x64_i2c', value:'SSD1306 128x64 via I2C'},
{id:'virtual_sdl', value:'Virtual SDL'}]" initial="st7920_128x64_spi" configfile="hal"></combobox>

<combobox name="GRAPHIC_DISPLAY_INTERFACE" label="Select the graphic display interface"
:opts="[
{id:'GRAPHIC_DISPLAY_SW_SPI', value:'Software emulated SPI'},
{id:'GRAPHIC_DISPLAY_HW_SPI', value:'Hardware SPI'},
{id:'GRAPHIC_DISPLAY_SW_I2C', value:'Software emulated I2C'},
{id:'GRAPHIC_DISPLAY_HW_I2C', value:'Hardware I2C'}]" initial="GRAPHIC_DISPLAY_SW_SPI" configfile="hal"></combobox>

<controlgroup if="app_state.GRAPHIC_DISPLAY_INTERFACE=='GRAPHIC_DISPLAY_SW_SPI'" label="Software emulated SPI pinout">
<pin name="GRAPHIC_DISPLAY_SPI_CLOCK" label="Select the SPI clock pin" initial="DOUT4"
filter="item.type.includes('generic_output')||(item.type.includes('unsafe_generic_input') & app_state.DISABLE_HAL_CONFIG_PROTECTION)" configfile="hal"></pin>
<pin name="GRAPHIC_DISPLAY_SPI_DATA" label="Select the SPI data pin" initial="DOUT5"
filter="item.type.includes('generic_output')||(item.type.includes('unsafe_generic_input') & app_state.DISABLE_HAL_CONFIG_PROTECTION)" configfile="hal"></pin>
<pin name="GRAPHIC_DISPLAY_SPI_CS" label="Select the SPI select pin" initial="DOUT6"
filter="item.type.includes('generic_output')||(item.type.includes('unsafe_generic_input') & app_state.DISABLE_HAL_CONFIG_PROTECTION)" configfile="hal"></pin>
</controlgroup>

<controlgroup if="app_state.GRAPHIC_DISPLAY_INTERFACE=='GRAPHIC_DISPLAY_HW_SPI'" label="Hardware SPI pinout">
<pin name="GRAPHIC_DISPLAY_SPI_CS" label="Select the SPI select pin" initial="DOUT6"
filter="item.type.includes('generic_output')||(item.type.includes('unsafe_generic_input') & app_state.DISABLE_HAL_CONFIG_PROTECTION)" configfile="hal"></pin>
</controlgroup>

<controlgroup if="app_state.GRAPHIC_DISPLAY_INTERFACE=='GRAPHIC_DISPLAY_SW_I2C'" label="Software emulated I2C pinout">
<pin name="GRAPHIC_DISPLAY_I2C_CLOCK" label="Select the I2C clock pin" initial="DOUT30"
filter="item.type.includes('generic_output')||(item.type.includes('unsafe_generic_input') & app_state.DISABLE_HAL_CONFIG_PROTECTION)" configfile="hal"></pin>
<pin name="GRAPHIC_DISPLAY_I2C_DATA" label="Select the I2C data pin" initial="DOUT29"
filter="item.type.includes('generic_output')||(item.type.includes('unsafe_generic_input') & app_state.DISABLE_HAL_CONFIG_PROTECTION)" configfile="hal"></pin>
</controlgroup>

<toggle name="ENABLE_GRAPHIC_DISPLAY_ROTARY_ENCODER" label="Display has rotary encoder"
tooltip="Enables support for RepRap Full Graphic Display rotary encoder.">
</toggle>

<controlgroup if="app_state.ENABLE_GRAPHIC_DISPLAY_ROTARY_ENCODER" label="Rotary encoder pinout">
<pin name="GRAPHIC_DISPLAY_ENCODER_BTN" label="Select the knob click pin" initial="DIN16"
filter="item.type.includes('generic_input')" configfile="hal"></pin>
<pin name="GRAPHIC_DISPLAY_ENCODER_ENC1" label="Select the knob encoder pin 1" initial="DIN17"
filter="item.type.includes('generic_input')" configfile="hal"></pin>
<pin name="GRAPHIC_DISPLAY_ENCODER_ENC2" label="Select the knob encoder pin 2" initial="DIN18"
filter="item.type.includes('generic_input')" configfile="hal"></pin>
<toggle name="GRAPHIC_DISPLAY_INVERT_ENCODER_DIR" label="Invert knob rotation direction"
tooltip="Inverts the knob direction of selection." configfile="hal">
</toggle>
</controlgroup>

<range name="GRAPHIC_DISPLAY_MAX_LINES" label="Set the display maximum number of lines" min="1" max="8" vartype="int" initial="5"></range>
</controlgroup>
`

};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('graphic_display', window.GraphicDisplayComponent);
	window.ModuleLoaderComponent.template += `<graphic_display v-if="(modfilter=='' || modfilter=='display')"></graphic_display>`;
});
