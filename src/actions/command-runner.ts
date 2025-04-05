import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { CommandIds } from "../../com.daveknights.sibelius-actions.sdPlugin/assets/command-ids";
import { PluginGlobalSettings } from "../shared/sibelius-actions.model";
import { wSConnect } from "../shared/web-socket-connection";
import * as fs from 'fs';

@action({ UUID: "com.daveknights.sibelius-actions.command-runner" })
export class CommandRunner extends SingletonAction<CommandRunnerSettings> {
    uiCGroupyOptions: { label: string, value: string }[] = [];
    globalSettings!: PluginGlobalSettings;
    commandIds = CommandIds;
    iconPath = 'imgs/command-id-icons/';
    /**
     * Get the global settings and populate the category select on key creation
     */
    override async onWillAppear(ev: WillAppearEvent<CommandRunnerSettings>): Promise<void> {
        this.globalSettings = await streamDeck.settings.getGlobalSettings<PluginGlobalSettings>();
        const commandIcon = `${this.iconPath}${ev.payload.settings.commandId}.png`;

        if (this.globalSettings.pluginList) {
            wSConnect.addToConnectMessage(this.globalSettings.pluginList);
        }

        if (fs.existsSync(commandIcon)) {
            ev.action.setImage(commandIcon);
        }
    }
    /**
     * When a group is selected, get the command ids and populate the name select
     */
    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<CommandRunnerSettings>): Promise<void> | void {
        let commandIdGroup: Array<{ label: string, value: string }> = [];

        if (ev.payload.settings.commandId) {
            const commandIcon = `${this.iconPath}/${ev.payload.settings.commandId}.png`;

            if (fs.existsSync(commandIcon)) {
                ev.action.setImage(commandIcon);
            }
        }

        if (ev.payload.settings.group !== '' && ev.payload.settings.group !== undefined) {
            for (const [commandId, definition] of Object.entries(this.commandIds[ev.payload.settings.group as keyof typeof this.commandIds])) {
                commandIdGroup.push({ label: definition, value: commandId });
            }
        }

        if (commandIdGroup.length > 0) {
            streamDeck.ui.current?.sendToPropertyInspector({
                event: 'getCommands',
                items: commandIdGroup
            });
        }
    }
    /**
     * Use the plugin name to send to Sibelius
     */
    override async onKeyDown(ev: KeyDownEvent<CommandRunnerSettings>): Promise<void> {
        wSConnect.sendPayload({ "message" : "invokeCommands", "commands": [ev.payload.settings.commandId] });
    };
}

/**
 * Settings for {@link CommandRunner}.
 */
type CommandRunnerSettings = {
    group: string,
    commandId: string,
};
