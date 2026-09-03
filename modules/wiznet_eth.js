window.WiznetETHComponent = {
    template: `

		<toggle name="wiznet_eth" label="Enable Wiznet W5xxx Ethernet module"
tooltip="Enables Wiznet W5xxx Ethernet support. This will disable any other networking (Wifi)." configfile="module">
</toggle>

<buttoncb if="app_state.wiznet_eth"
        enable="ENABLE_PARSER_MODULES,USE_STATIC_IP">
				Fix requirements!</buttoncb>

<controlgroup label="Wiznet W5xxx Settings" if="app_state.wiznet_eth">
    
    <combobox configfile="hal" name="WIZNET_INTERFACE" label="Select Wiznet SPI interface"
        :opts="[
        {id:'WIZNET_HW_SPI', value:'Hardware SPI'},
        {id:'WIZNET_HW_SPI2', value:'Hardware SPI2'},
        {id:'WIZNET_SW_SPI', value:'Software SPI'}]" initial="WIZNET_HW_SPI">
    </combobox>

    <controlgroup if="app_state.WIZNET_INTERFACE === 'WIZNET_SW_SPI'" label="Software SPI Pinout">
        <pin configfile="hal" name="WIZNET_SPI_CLK" label="Select SPI clock pin" initial="DOUT30"
            filter="item.type.includes('generic_output')"></pin>
        <pin configfile="hal" name="WIZNET_SPI_SDO" label="Select SPI data output pin" initial="DOUT29"
            filter="item.type.includes('generic_output')"></pin>
        <pin configfile="hal" name="WIZNET_SPI_SDI" label="Select SPI data input pin" initial="DIN29"
            filter="item.type.includes('generic_input')"></pin>
    </controlgroup>

    <pin configfile="hal" name="WIZNET_CS" label="Select SPI chip select pin" initial="DOUT40"
        filter="item.type.includes('generic_output')"></pin>
    
    <alert if="!app_state.USE_STATIC_IP" alerttype="warning">
        Wiznet Ethernet requires using STATIC IP. Fix it!
    </alert>
    <alert if="app_state.USE_STATIC_IP" alerttype="info">
        Wiznet Ethernet uses STATIC IP. Configure it at Machine>Advanced settings 
    </alert>
</controlgroup>
`
};

window.addEventListener("ucnc_load_components", () => {
    window.ucnc_app.component('wiznet_eth', window.WiznetETHComponent);
    window.ModuleLoaderComponent.template += `<wiznet_eth v-if="(modfilter=='' || modfilter=='other')"></wiznet_eth>`;
});
