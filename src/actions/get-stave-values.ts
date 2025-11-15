import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { wSConnect } from "../shared/web-socket-connection";
import type { PluginGlobalSettings } from "../shared/sibelius-actions.model";

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
     * Invoke the plugin named 'PartCalcStaves' in Sibelius
     */
    override async onKeyDown(ev: KeyDownEvent<GetStaveValuesSettings>): Promise<void> {
        wSConnect.openWebSocket()?.then((isOpen:boolean) => wSConnect.sendPayload({ "message": "invokePlugin", "name": 'PartCalcStaves' }));
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
