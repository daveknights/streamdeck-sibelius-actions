import WebSocket from 'ws';
import type { Payload, SibeliusResponse } from "../shared/sibelius-actions.model";
import streamDeck from "@elgato/streamdeck";

class WebSocketConnection {
    sibeliusWebSocket!: WebSocket | null;
    sibeliusToken = '';
    isConnected = false;
    connectMsg = {
        'message': 'connect',
        'clientName"': 'StreamDeckActionsRunner',
        'handshakeVersion': '1.0',
        'plugins': {}
    };
    payload!:Payload;

    openWebSocket(): Promise<boolean> {
        return new Promise (resolve => {
            if (this.sibeliusToken && this.isConnected) {
                resolve(true);
            } else if (!this.sibeliusWebSocket || this.sibeliusWebSocket.readyState === WebSocket.CLOSED) {
                this.sibeliusWebSocket = new WebSocket('ws://127.0.0.1:1898');

                this.sibeliusWebSocket.on('message', (data: string) => {
                    const jsonObj:SibeliusResponse = JSON.parse(data);

                    if (jsonObj.message === 'connectResponse' && jsonObj.result === true) {
                        this.sibeliusToken = jsonObj.sessionToken;
                        this.isConnected = true;
                        this.sendPayload(this.payload);
                    }

                    if (jsonObj.returnValue) {
                        const [paperSize, firstPage, secondPage] = jsonObj.returnValue.split('-');

                        streamDeck.actions.forEach((action) => {
                            if (action.manifestId.endsWith('plus-stave')) {
                                action.setTitle(`${paperSize}\n\n${parseInt(firstPage) + 1} - ${parseInt(secondPage) + 1}`);

                            } else if (action.manifestId.endsWith('minus-stave')) {
                                action.setTitle(`${paperSize}\n\n${parseInt(firstPage) - 1} - ${parseInt(secondPage) - 1}`);
                            }
                        });
                    }
                });

                this.sibeliusWebSocket.on('open', () => resolve(true));

                this.sibeliusWebSocket?.on('close', () => {
                    this.sibeliusWebSocket = null;
                    this.sibeliusToken = '';
                    this.isConnected = false;
                    this.payload = <Payload>{};
                });
            }
        });
    }

    addToConnectMessage(pluginList: string[]) {
        if (Object.keys(this.connectMsg.plugins).length === 0) {
            this.connectMsg.plugins = pluginList;
        }
    }

    sendPayload(payload: Payload) {
        this.payload = payload;

        if (this.isConnected && this.sibeliusToken) {
            this.sibeliusWebSocket?.send(JSON.stringify(payload));
        } else {
            if (this.sibeliusWebSocket?.readyState === WebSocket.OPEN) {
                this.sibeliusWebSocket?.send(JSON.stringify(this.connectMsg));
            };
        }
    }

    closeWebSocket() {
        this.sibeliusWebSocket?.close();
        this.isConnected = false;
        this.sibeliusToken = '';
    }
}

export const wSConnect = new WebSocketConnection();
