window.I2CLCDComponent = {
	template: `
<toggle name="i2c_lcd" label="Enable I2C LCD module"
tooltip="Enables support for I2C LCD displays. Multiple LCD sizes/formats are supported." configfile="module">
</toggle>

<buttoncb if="app_state.i2c_lcd" enable="ENABLE_MAIN_LOOP_MODULES,ENABLE_ITP_FEED_TASK">Fix requirements!</buttoncb>

<controlgroup if="app_state.i2c_lcd" label="I2C LCD options">

<range configfile="hal" name="LCD_ROWS" label="Set the LCD number of lines" min="1" max="8" vartype="int" initial="2"></range>
<range configfile="hal" name="LCD_COLUMNS" label="Set the LCD number of columns" min="1" max="32" vartype="int" initial="16"></range>

<combobox configfile="hal" name="GRAPHIC_DISPLAY_INTERFACE" label="Select the graphic display interface"
:opts="[
{id:'GRAPHIC_DISPLAY_SW_SPI', value:'Software emulated SPI'},
{id:'GRAPHIC_DISPLAY_HW_SPI', value:'Hardware SPI'},
{id:'GRAPHIC_DISPLAY_SW_I2C', value:'Software emulated I2C'},
{id:'GRAPHIC_DISPLAY_HW_I2C', value:'Hardware I2C'}]" initial="GRAPHIC_DISPLAY_SW_SPI"></combobox>

<controlgroup if="app_state.GRAPHIC_DISPLAY_INTERFACE=='GRAPHIC_DISPLAY_SW_I2C'" label="Software emulated I2C pinout">
<pin name="GRAPHIC_DISPLAY_I2C_CLOCK" label="Select the I2C clock pin" initial="DOUT30"
filter="item.type.includes('generic_output')||(item.type.includes('unsafe_generic_input') & app_state.DISABLE_HAL_CONFIG_PROTECTION)" configfile="hal"></pin>
<pin name="GRAPHIC_DISPLAY_I2C_DATA" label="Select the I2C data pin" initial="DOUT29"
filter="item.type.includes('generic_output')||(item.type.includes('unsafe_generic_input') & app_state.DISABLE_HAL_CONFIG_PROTECTION)" configfile="hal"></pin>
</controlgroup>
</controlgroup>

`

};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('i2c_lcd', window.I2CLCDComponent);
	window.ModuleLoaderComponent.template += `<i2c_lcd v-if="(modfilter=='' || modfilter=='display')"></i2c_lcd>`;
});
