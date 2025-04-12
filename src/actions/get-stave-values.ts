import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { wSConnect } from "../shared/web-socket-connection";
import type { PluginGlobalSettings, StaveValues } from "../shared/sibelius-actions.model";

@action({ UUID: "com.daveknights.sibelius-actions.get-stave-values" })
export class GetStaveValues extends SingletonAction<GetStaveValuesSettings> {
    globalSettings!: PluginGlobalSettings;
     /**
     * Get the global settings and add to the Sibelius connectMsg object
     */
    override async onWillAppear(ev: WillAppearEvent<GetStaveValuesSettings>): Promise<void> {
        this.globalSettings = await streamDeck.settings.getGlobalSettings<PluginGlobalSettings>();

        if (this.globalSettings.pluginList) {
            wSConnect.addToConnectMessage(this.globalSettings.pluginList);
        }
    };
    /**
     * Use the plugin name to send to Sibelius
     * Retrieve the paper size & stave values
     * Set the PlusStave & MinusStave key title
     */
    override async onKeyDown(ev: KeyDownEvent<GetStaveValuesSettings>): Promise<void> {
        wSConnect.openWebSocket()?.then((isOpen:boolean) => wSConnect.sendPayload({ "message": "invokePlugin", "name": 'PartCalcStaves' }));

        wSConnect.getStaveValues().then((values:StaveValues) => {
            const [paperSize, firstPage, secondPage] = <StaveValues>values;

            streamDeck.actions.forEach((action) => {
                if (action.manifestId.endsWith('plus-stave')) {
                    action.setTitle(`${paperSize}\n\n${parseInt(firstPage) + 1} - ${parseInt(secondPage) + 1}`);

                } else if (action.manifestId.endsWith('minus-stave')) {
                    action.setTitle(`${paperSize}\n\n${parseInt(firstPage) - 1} - ${parseInt(secondPage) - 1}`);
                }
            });

            wSConnect.clearStaveValues();
        });
    };
}

/**
 * Settings for {@link GetStaveValues}.
 */
type GetStaveValuesSettings = {
    category: string,
    pluginItems: Array<{ label: string, value: string }>
    pluginName: string,
};
