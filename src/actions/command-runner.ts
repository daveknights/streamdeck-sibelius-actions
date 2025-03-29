import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { PluginGlobalSettings } from "./sibelius-actions.model";
import { CommandIds } from "../../com.daveknights.sibelius-actions.sdPlugin/assets/command-ids";
import WebSocket from 'ws';
import * as fs from 'fs';

@action({ UUID: "com.daveknights.sibelius-actions.command-runner" })
export class CommandRunner extends SingletonAction<CommandRunnerSettings> {
    uiCGroupyOptions: { label: string, value: string }[] = [];
    globalSettings!: PluginGlobalSettings;
    sibsocket!: WebSocket | null;
    sibeliusToken = '';
    connectMsg = {
        "message": "connect",
        "clientName": "StreamDeckActionsRunner",
        "handshakeVersion": "1.0",
    };
    commandIds = CommandIds;
    iconPath = 'imgs/command-id-icons/';
    /**
     * Get the global settings and populate the category select on key creation
     */
    override async onWillAppear(ev: WillAppearEvent<CommandRunnerSettings>): Promise<void> {
        const commandIcon = `${this.iconPath}${ev.payload.settings.commandId}.png`;
        this.globalSettings = await streamDeck.settings.getGlobalSettings<PluginGlobalSettings>();

        if (this.globalSettings.sibeliusToken) {
            this.sibeliusToken = this.globalSettings.sibeliusToken;
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
        const payload = { "message" : "invokeCommands", "commands": [ev.payload.settings.commandId] }

        if (ev.payload.settings.commandId) {
            if (!this.sibsocket || this.sibsocket.readyState === WebSocket.CLOSED) {
                this.sibsocket = new WebSocket('ws://127.0.0.1:1898');

                this.sibsocket.on('message', (data: string) => {
                    const jsonObj: {
                        sessionToken: string,
                        message: string,
                        result: boolean
                    } = JSON.parse(data);

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
 * Settings for {@link CommandRunner}.
 */
type CommandRunnerSettings = {
    group: string,
    commandId: string,
};
