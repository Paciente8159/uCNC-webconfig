window.TMCDriverComponent = {
	template: `
						<toggle name="tmc_driver" label="TMC drivers module" tooltip="Enables TMC drivers module."
						configfile="module">
					</toggle>
					<buttoncb if="app_state.tmc_driver" enable="ENABLE_MAIN_LOOP_MODULES,ENABLE_PARSER_MODULES">Fix requirements!
					</buttoncb>

					<controlgroup if="app_state.tmc_driver" label="TMC driver options">
						<repeater :opts="[
			{id:'0'},
			{id:'1'},
			{id:'2'},
			{id:'3'},
			{id:'4'},
			{id:'5'},
			{id:'6'},
			{id:'7'}
		]" valname="id">
							<template #default="{ item }">
								<toggle :name="'STEPPER'+item.id +'_HAS_TMC'" :label="'TMC' + item.id + ' has TMC driver?'"
									configfile="hal"></toggle>
								<controlgroup :if="'app_state.STEPPER'+item.id +'_HAS_TMC'"
									:label="'TMC Stepper '+item.id+' driver options'">
									<combobox :name="'STEPPER'+item.id +'_DRIVER_TYPE'" :opts="[
			{id:'2202', name:'2202'},
			{id:'2208', name:'2208'},
			{id:'2209', name:'2209'},
			{id:'2225', name:'2225'},
			{id:'2226', name:'2226'},
			{id:'2130', name:'2130'}
		]" valname="id" :label="'Select TMC' + item.id + ' type of driver'" configfile="hal"></combobox>
									<combobox :name="'STEPPER'+item.id +'_TMC_INTERFACE'" :opts="[
			{ id: 'TMC_UART', value: 'Software UART' },
			{ id: 'TMC_SPI', value: 'Software SPI' },
			{ id: 'TMC_ONEWIRE', value: 'Software ONEWIRE' },
			{ id: 'TMC_UART2_HW', value: 'Hardware UART2' },
			{ id: 'TMC_SPI_HW', value: 'Hardware SPI' },
		]" :label="'Select TMC' + item.id + ' COM interface'" initial="'TMC_UART'" configfile="hal"></combobox>
									<controlgroup :if="'app_state.STEPPER'+item.id +'_TMC_INTERFACE==&quot;TMC_UART&quot;)'"
										label="TMC Software Uart options">
										<pin :name="'STEPPER'+item.id +'_UART_TX'" :label="'TMC' + item.id + ' TMC UART TX'"
											filter="item.type.includes('generic_output')" configfile="hal"></pin>
										<pin :name="'STEPPER'+item.id +'_UART_RX'" :label="'TMC' + item.id + ' TMC UART RX'"
											filter="item.type.includes('generic_input')" configfile="hal"></pin>
										<pin :name="'STEPPER'+item.id +'_UART_CS'" :label="'TMC' + item.id + ' TMC UART chip select'"
											filter="item.type.includes('generic_output')" configfile="hal"></pin>
										<combobox :name="'STEPPER'+item.id +'_UART_ADDRESS'" :opts="[
					{id:'0', value:'0'},
					{id:'1', value:'1'},
					{id:'2', value:'2'},
					{id:'3', value:'3'},
					{id:'4', value:'4'},
					{id:'5', value:'5'},
					{id:'6', value:'6'},
					{id:'7', value:'7'}
					]" valname="id" :label="'Select TMC' + item.id + ' Uart address'" configfile="hal"></combobox>
									</controlgroup>
									<controlgroup :if="'app_state.STEPPER'+item.id +'_TMC_INTERFACE==&quot;TMC_SPI&quot;'"
										label="TMC Software SPI options">
										<pin :name="'STEPPER'+item.id +'_SPI_CLK'" :label="'TMC' + item.id + ' TMC SPI Clock'"
											filter="item.type.includes('generic_output')" configfile="hal"></pin>
										<pin :name="'STEPPER'+item.id +'_SPI_SDO'" :label="'TMC' + item.id + ' TMC SPI data output'"
											filter="item.type.includes('generic_input')" configfile="hal"></pin>
										<pin :name="'STEPPER'+item.id +'_SPI_SDI'" :label="'TMC' + item.id + ' TMC SPI data input'"
											filter="item.type.includes('generic_input')" configfile="hal"></pin>
										<pin :name="'STEPPER'+item.id +'_SPI_CS'" :label="'TMC' + item.id + ' TMC SPI chip select'"
											filter="item.type.includes('generic_input')" configfile="hal"></pin>

									</controlgroup>
									<controlgroup :if="'app_state.STEPPER'+item.id +'_TMC_INTERFACE==&quot;TMC_ONEWIRE&quot;'"
										label="TMC Software OneWire options">
										<pin :name="'STEPPER'+item.id +'_UART_RX'" :label="'TMC' + item.id + ' TMC OneWire TX/RX'"
											filter="item.type.includes('generic_output')||item.type.includes('unsafe_generic_input')"
											configfile="hal"></pin>
										<pin :name="'STEPPER'+item.id +'_UART_CS'" :label="'TMC' + item.id + ' TMC OneWire chip select'"
											filter="item.type.includes('generic_output')" configfile="hal"></pin>
										<combobox :name="'STEPPER'+item.id +'_UART_ADDRESS'" :opts="[
					{id:'0', value:'0'},
					{id:'1', value:'1'},
					{id:'2', value:'2'},
					{id:'3', value:'3'},
					{id:'4', value:'4'},
					{id:'5', value:'5'},
					{id:'6', value:'6'},
					{id:'7', value:'7'}
					]" valname="id" :label="'Select TMC' + item.id + ' OneWire address'" configfile="hal"></combobox>
									</controlgroup>
									<controlgroup :if="'app_state.STEPPER'+item.id +'_TMC_INTERFACE==&quot;TMC_UART2_HW&quot;'"
										label="TMC Hardware Uart2 options">
										<pin :name="'STEPPER'+item.id +'_UART_CS'" :label="'TMC' + item.id + ' TMC UART chip select'"
											filter="item.type.includes('generic_output')" configfile="hal"></pin>
										<combobox :name="'STEPPER'+item.id +'_UART_ADDRESS'" :opts="[
					{id:'0', value:'0'},
					{id:'1', value:'1'},
					{id:'2', value:'2'},
					{id:'3', value:'3'},
					{id:'4', value:'4'},
					{id:'5', value:'5'},
					{id:'6', value:'6'},
					{id:'7', value:'7'}
					]" valname="id" :label="'Select TMC' + item.id + ' Uart address'" configfile="hal"></combobox>
									</controlgroup>
									<controlgroup :if="'app_state.STEPPER'+item.id +'_TMC_INTERFACE==&quot;TMC_SPI_HW&quot;'"
										label="TMC Hardware SPI options">
										<pin :name="'STEPPER'+item.id +'_SPI_CS'" :label="'TMC' + item.id + ' TMC SPI chip select'"
											filter="item.type.includes('generic_input')" configfile="hal"></pin>

									</controlgroup>
									<range :name="'STEPPER'+item.id +'_CURRENT_MA'" units="mA" :label="'TMC' + item.id + ' max current'" min="0" max="1500" step="10"
								configfile="hal" initial="900" vartype="int"></range>
								<combobox :name="'STEPPER'+item.id +'_MICROSTEP'" :opts="[
								{id:'1', value:'1'},
								{id:'2', value:'2'},
								{id:'4', value:'4'},
								{id:'8', value:'8'},
								{id:'16', value:'16'},
								{id:'32', value:'32'},
								{id:'64', value:'64'},
								{id:'128', value:'128'},
								]" :label="'Select TMC' + item.id + ' microstepping'" initial="4" vartype="int" configfile="hal"></combobox>
								<range :name="'STEPPER'+item.id +'_RSENSE'" units="ohms" :label="'TMC' + item.id + ' rsense value'" min="0" max="2" step="0.01"
								configfile="hal" initial="0.11" vartype="float"></range>
								<range :name="'STEPPER'+item.id +'_HOLD_MULT'" units="ohms" :label="'TMC' + item.id + ' Hold multiplier'" min="0" max="1" step="0.01"
								configfile="hal" initial="0.7" vartype="float"></range>
								<range :name="'STEPPER'+item.id +'_STEALTHCHOP_THERSHOLD'" units="Hz" :label="'TMC' + item.id + ' stealthchop threshold'" min="0" max="10000" step="10"
								configfile="hal" initial="1000" vartype="int"></range>
								<toggle :name="'STEPPER'+item.id +'_ENABLE_INTERPLATION'" :label="'TMC' + item.id + ' microstepping interpolation'"
									configfile="hal" vartype='bool'></toggle>
									<range :if="'app_state.STEPPER'+item.id +'_TMC_INTERFACE==&quot;TMC_SPI_HW&quot;'" :name="'STEPPER'+item.id +'_STALL_SENSITIVITY'" :label="'TMC' + item.id + ' stall sensitivity'" min="0" max="255" step="1"
								configfile="hal" vartype="int"></range>
								</controlgroup>
							</template>
						</repeater>
					</controlgroup>
` 
};

window.addEventListener("ucnc_load_components", (e) => {
	window.ucnc_app.component('tmc_driver', window.TMCDriverComponent);
	window.ModuleLoaderComponent.template += `<tmc_driver v-if="(modfilter=='' || modfilter=='other')"></tmc_driver>`;
});
