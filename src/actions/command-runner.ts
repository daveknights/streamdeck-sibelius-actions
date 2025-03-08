import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { PluginGlobalSettings } from "./sibelius-actions.model";
import WebSocket from 'ws';

@action({ UUID: "com.daveknights.sibelius-actions.command-runner" })
export class CommandRunner extends SingletonAction<ComandRunnerSettings> {
    categoryItems: { label: string, value: string }[] = [];
    pluginItems: { label: string, value: string }[] = [];
    globalSettings!: PluginGlobalSettings;
    sibsocket!: WebSocket | null;
    sibeliusToken = '';
    connectMsg = {
        "message": "connect",
        "clientName": "StreamDeckActionsRunner",
        "handshakeVersion": "1.0",
    };
    /**
     * Get the global settings and populate the category select on key creation
     */
    override async onWillAppear(ev: WillAppearEvent): Promise<void> {
        this.globalSettings = await streamDeck.settings.getGlobalSettings<PluginGlobalSettings>();

        if (this.globalSettings.sibeliusToken) {
            this.sibeliusToken = this.globalSettings.sibeliusToken;
        }
    }
    /**
     * Use the plugin name to send to Sibelius
     */
    override async onKeyDown(ev: KeyDownEvent<ComandRunnerSettings>): Promise<void> {
        const payload = { "message" : "invokeCommands", "commands": [ev.payload.settings.commandId] }

        if (ev.payload.settings.commandId) {
            if (!this.sibsocket || this.sibsocket.readyState === WebSocket.CLOSED) {
                this.sibsocket = new WebSocket('ws://127.0.0.1:1898');
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
    };
}

/**
 * Settings for {@link ComandRunner}.
 */
type ComandRunnerSettings = {
    commandId: string,
};
