import streamDeck, { action, DidReceiveSettingsEvent, JsonObject, JsonValue, KeyDownEvent, PropertyInspectorDidDisappearEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { wSConnect } from "../shared/web-socket-connection";
import type { PluginGlobalSettings } from "../shared/sibelius-actions.model";

@action({ UUID: "com.daveknights.sibelius-actions.plugin-runner" })
export class PluginRunner extends SingletonAction<PluginRunnerSettings> {
    uiCategoryOptions: { label: string, value: string }[] = [];
    uiNameOptions: { label: string, value: string }[] = [];
    globalSettings!: PluginGlobalSettings;
    /**
     * Get the global settings and populate the category select on key creation
     */
    override async onWillAppear(ev: WillAppearEvent<PluginRunnerSettings>): Promise<void> {
        this.globalSettings = await streamDeck.settings.getGlobalSettings<PluginGlobalSettings>();
        const categories = this.globalSettings.categoryList;

        if (this.globalSettings.pluginList) {
            wSConnect.addToConnectMessage(this.globalSettings.pluginList);
        }

        if (ev.payload.settings.pluginName) {
            const pluginTitle = ev.payload.settings.pluginName.replace(/(?<=[a-z])(?=[A-Z])/g, '\n');

            ev.action.setTitle(pluginTitle);
        }

        if (categories) {
            this.uiCategoryOptions.length = 0;

            for (const category of categories.sort()) {
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
            for (const plugin of this.globalSettings.plugins[ev.payload.settings.category].sort()) {
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
        wSConnect.sendPayload({ "message": "invokePlugin", "name": ev.payload.settings.pluginName });
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
