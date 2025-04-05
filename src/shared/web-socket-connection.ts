// import streamDeck from "@elgato/streamdeck";
import WebSocket from 'ws';
import type { Payload, SibeliusResponse, StaveValues } from "../shared/sibelius-actions.model";

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
    staveValues!:StaveValues;

    constructor() {
        if (!this.sibeliusWebSocket || this.sibeliusWebSocket.readyState === WebSocket.CLOSED) {
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
                    this.staveValues = <StaveValues>[paperSize, firstPage, secondPage];
                }
            });

            this.sibeliusWebSocket?.on('close', () => {
                this.sibeliusWebSocket = null;
                this.sibeliusToken = '';
                this.payload = <Payload>{};
            });
        }
    }

    addToConnectMessage(pluginList: string[]) {
        if (!this.connectMsg.plugins) {
            this.connectMsg.plugins = pluginList;
        }
    }

    sendPayload(payload: Payload) {
        this.payload = payload;

        if (this.isConnected && this.sibeliusToken) {
            this.sibeliusWebSocket?.send(JSON.stringify(payload));
        } else {
            console.log(this.sibeliusWebSocket?.readyState);

            if (this.sibeliusWebSocket?.readyState === WebSocket.OPEN) {
                console.log('Open');

                this.sibeliusWebSocket?.send(JSON.stringify(this.connectMsg));
            };
        }
    }
}

export const wSConnect = new WebSocketConnection();
