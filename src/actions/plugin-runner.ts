import streamDeck, { action, DidReceiveSettingsEvent, JsonObject, JsonValue, KeyDownEvent, PropertyInspectorDidDisappearEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { PluginGlobalSettings } from "./sibelius-actions.model";
import WebSocket from 'ws';

@action({ UUID: "com.daveknights.sibelius-actions.plugin-runner" })
export class PluginRunner extends SingletonAction<PluginRunnerSettings> {
    uiCategoryOptions: { label: string, value: string }[] = [];
    uiNameOptions: { label: string, value: string }[] = [];
    globalSettings!: PluginGlobalSettings;
    sibsocket!: WebSocket | null;
    sibeliusToken = '';
    connectMsg = {
        'message': 'connect',
        'clientName"': 'StreamDeckActionsRunner',
        'handshakeVersion': '1.0',
        'plugins': {}
    };
    /**
     * Get the global settings and populate the category select on key creation
     */
    override async onWillAppear(ev: WillAppearEvent<PluginRunnerSettings>): Promise<void> {
        this.globalSettings = await streamDeck.settings.getGlobalSettings<PluginGlobalSettings>();
        const categories = this.globalSettings.categoryList;

        if (this.globalSettings.pluginList) {
            this.connectMsg.plugins = this.globalSettings.pluginList;
        }

        if (ev.payload.settings.pluginName) {
            const pluginTitle = ev.payload.settings.pluginName.replace(/(?<=[a-z])(?=[A-Z])/g, '\n');

            ev.action.setTitle(pluginTitle);
        }

        if (categories && !this.uiCategoryOptions.length) {
            for (const category of categories) {
                this.uiCategoryOptions.push({ label: category, value: category });
            }
        }
    }
    /**
     * Function to clear a setting so each key starts afresh
     */
    private async clearSetting(event: PropertyInspectorDidDisappearEvent | DidReceiveSettingsEvent, settingName: string) {
        const currentSettings = await event.action.getSettings();
        event.action.setSettings({...currentSettings, [settingName]: ''});
    }
    /**
     * When a category is selected, get the names and populate the name select
     */
    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<PluginRunnerSettings>): Promise<void> | void {
        let pluginItems: Array<{ label: string, value: string }> = [];

        if (ev.payload.settings.category !== '' && ev.payload.settings.category !== undefined) {
            for (const plugin of this.globalSettings.plugins[ev.payload.settings.category]) {
                pluginItems.push({ label: plugin, value: plugin });
            }
        }

        if (pluginItems.length > 0) {
            streamDeck.ui.current?.sendToPropertyInspector({
                event: 'getNames',
                items: pluginItems
            });
        }

        if (ev.payload.settings.pluginName) {
            const pluginTitle = ev.payload.settings.pluginName.replace(/(?<=[a-z])(?=[A-Z])/g, '\n');

            ev.action.setTitle(pluginTitle);
        }

        if (ev.payload.settings.pluginName && ev.payload.settings.pluginItems) {
            this.clearSetting(ev, 'pluginItems');
        }
    }
    /**
     * Clear the plugin category value when leaving key UI
     */
    override async onPropertyInspectorDidDisappear(ev: PropertyInspectorDidDisappearEvent<PluginRunnerSettings>): Promise<void> {
        this.clearSetting(ev, 'category');
    }
    /**
     * Get the values and populate selects when revisiting a key
     */
    override async onSendToPlugin(ev: SendToPluginEvent<JsonValue & { event: string }, JsonObject>): Promise<void> {
        if (ev.payload.event === 'getCategories' && this.uiCategoryOptions.length > 0) {
            streamDeck.ui.current?.sendToPropertyInspector({
                event: 'getCategories',
                items: this.uiCategoryOptions
            });
        }
    };
    /**
     * Use the plugin name to send to Sibelius
     */
    override async onKeyDown(ev: KeyDownEvent<PluginRunnerSettings>): Promise<void> {
        const payload = { "message": "invokePlugin", "name": ev.payload.settings.pluginName };

        if (ev.payload.settings.pluginName) {
            if (!this.sibsocket || this.sibsocket.readyState === WebSocket.CLOSED) {
                this.sibsocket = new WebSocket('ws://127.0.0.1:1898');

                this.sibsocket.on('message', (data: string) => {
                    const jsonObj: {
                        sessionToken: string,
                        message: string,
                        result: boolean
                    } = JSON.parse(data);

                    console.log(jsonObj);


                    if (jsonObj.message === 'connectResponse' && jsonObj.result === true) {
                        this.sibeliusToken = jsonObj.sessionToken;
                        this.sibsocket?.send(JSON.stringify(payload));
                    }
                });
            }

            if (this.sibeliusToken) {
                this.sibsocket.send(JSON.stringify(payload));
            } else {
                this.sibsocket.on('open', () => {
                    this.sibsocket?.send(JSON.stringify(this.connectMsg));

                    this.sibsocket?.on('close', () => {
                        this.sibsocket = null;
                        this.sibeliusToken = '';
                    });
                });
            }
        }
    };
}

/**
 * Settings for {@link PluginRunner}.
 */
type PluginRunnerSettings = {
    category: string,
    pluginItems: Array<{ label: string, value: string }>
    pluginName: string,
};
