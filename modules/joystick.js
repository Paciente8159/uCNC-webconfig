window.JoystickComponent = {
    template: `
		<toggle name="ENABLE_JOYSTICK_MODULE" label="Enable Joystick module"
tooltip="Enables support analog joystick controls for jogging the machine.">
</toggle>

<buttoncb if="app_state.ENABLE_JOYSTICK_MODULE" enable="ENABLE_MAIN_LOOP_MODULES">Fix requirements!</buttoncb>

<controlgroup label="Joystick Settings" if="app_state.ENABLE_JOYSTICK_MODULE">

				<range configfile="hal" name="JOYSTICK_AXIS_COUNT" label="How many axes does your joystick control?" vartype="int" initial="3"
					min="0" max="6"></range>

				<repeater label="Joystick axis" :opts="[
		{id:'JOYSTICK_INPUT_0', axiscount:0},
		{id:'JOYSTICK_INPUT_1', axiscount:1},
		{id:'JOYSTICK_INPUT_2', axiscount:2},
		{id:'JOYSTICK_INPUT_3', axiscount:3},
		{id:'JOYSTICK_INPUT_4', axiscount:4},
		{id:'JOYSTICK_INPUT_5', axiscount:5},
		]" filter="item.axiscount&lt;app_state.JOYSTICK_AXIS_COUNT">
					<template #default="{ item }">

						<controlgroup :label="'Joystick ' + item.axiscount">
							<pin configfile="hal" :name="'JOYSTICK_INPUT_' + item.name" :label="'Select analog input pin ' + item.name" initial="null"
								filter="item.type.includes('analog')"></pin>
							<combobox configfile="hal" :name="'JOYSTICK_INPUT_' + item.name + '_AXIS'" :label="'Select axis ' + item.name" :opts="[
            { id: '0', value: 'X' }, { id: '1', value: 'Y' },
            { id: '2', value: 'Z' }, { id: '3', value: 'A' },
            { id: '4', value: 'B' }, { id: '5', value: 'C' }]" initial="item.name">
							</combobox>
						</controlgroup>

					</template>
				</repeater>
			</controlgroup>
`
};

window.addEventListener("ucnc_load_components", () => {
    window.ucnc_app.component('joystick', window.JoystickComponent);
    window.ModuleLoaderComponent.template += `<joystick v-if="(modfilter=='' || modfilter=='pendants')"></joystick>`;
});
