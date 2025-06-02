window.GrblHALKeypadComponent = {
	template: `
<toggle name="ENABLE_GRBLHAL_KEYPAD_MODULE" label="Enable GrblHAL Keypad module"
tooltip="Enables support for GrblHAL Keypad.">
</toggle>

<buttoncb if="app_state.ENABLE_GRBLHAL_KEYPAD_MODULE" enable="ENABLE_IO_MODULES,ENABLE_MAIN_LOOP_MODULES" disable="DISABLE_SETTINGS_MODULES">Fix requirements!</buttoncb>

<controlgroup if="app_state.ENABLE_GRAPHIC_DISPLAY_MODULE" label="GrblHAL Keypad options">

<combobox name="KEYPAD_PORT" label="Define interface port"
:opts="[
{id:'KEYPAD_PORT_HW_I2C', value:'Hardware I2C'},
{id:'KEYPAD_PORT_SW_I2C', value:'Software emulated I2C'},
{id:'KEYPAD_PORT_HW_UART', value:'Hardware UART'},
{id:'KEYPAD_PORT_SW_UART', value:'Software emulated UART'},
{id:'KEYPAD_PORT_HW_UART2', value:'Hardware UART2'},
]" initial="KEYPAD_PORT_HW_I2C"></combobox>

<controlgroup if="app_state.KEYPAD_PORT=='KEYPAD_PORT_SW_I2C'" label="Software emulated I2C pinout">
<pin name="KEYPAD_SCL" label="Select the I2C clock pin" initial="DOUT30"
filter="item.type.includes('generic_output')||item.type.includes('unsafe_generic_input')" configfile="hal"></pin>
<pin name="KEYPAD_SDA" label="Select the I2C data pin" initial="DOUT29"
filter="item.type.includes('generic_output')||item.type.includes('unsafe_generic_input')" configfile="hal"></pin>
<pin name="KEYPAD_DOWN" label="Select the Keypad button down pin" initial="DIN7"
filter="item.type.includes('generic_input')" configfile="hal"></pin>
</controlgroup>

<controlgroup if="app_state.KEYPAD_PORT=='KEYPAD_PORT_SW_UART'" label="Software emulated UART pinout">
<pin name="KEYPAD_RX" label="Select the UART TX pin" initial="DOUT20"
filter="item.type.includes('generic_output')" configfile="hal"></pin>
<pin name="KEYPAD_RX" label="Select the UART RX pin" initial="DIN7"
filter="item.type.includes('generic_output')" configfile="hal"></pin>
</controlgroup>

<range name="KEYPAD_MAX_MACROS" label="Set the maximum number of EEPROM macros" min="0" max="8" vartype="int" initial="0"></range>
</controlgroup>
`

};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('grblhal_keypad', window.GrblHALKeypadComponent);
	window.ModuleLoaderComponent.template += `<grblhal_keypad v-if="(modfilter=='' || modfilter=='pendants')"></grblhal_keypad>`;
});
