/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const myAction = new Action('com.daveknights.plg-runner.action');
const globalContext = 'comSibeliusPluginNames';
const connectMsg = {
    "message": "connect",
    "clientName": "StreamDeckPlgRunner",
    "handshakeVersion": "1.0",
    "plugins": [],
};
let sibsocket = '';
let sibeliusToken = '';
let allPluginNames = [];

/**
 * The first event fired when Stream Deck starts
 */
$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
    $SD.getGlobalSettings(globalContext);
});

$SD.onDidReceiveGlobalSettings(({payload}) => {
    if (payload.settings?.payload?.allPlugins) {
        allPluginNames = [...payload.settings.payload.allPlugins];
    }
});

myAction.onKeyUp(({ action, context, device, event, payload }) => {
    if (!sibsocket || sibsocket.readyState === 3) {
        sibsocket = new WebSocket('ws://127.0.0.1:1898');
        sibeliusToken = '';
    }

    if (payload.settings && payload.settings.payload.pluginName) {
        if (sibeliusToken) {
            sibsocket.send(JSON.stringify({ "message" : "invokePlugin", "name": payload.settings.payload.pluginName }));
        } else {
            connectMsg.plugins = [...allPluginNames];
            sibsocket.onopen = event => sibsocket.send(JSON.stringify(connectMsg));

        }

        sibsocket.onmessage = event => {
            const jsonObj = JSON.parse(event.data);

            if (jsonObj.message === 'connectResponse') {
                sibsocket.send(JSON.stringify({ "message" : "invokePlugin", "name": payload.settings.payload.pluginName }));
            }

            if(jsonObj.sessionToken) {
                sibeliusToken = jsonObj.sessionToken
            }
        }
    } else {
        $SD.showAlert(context);
    }
});

myAction.onSendToPlugin(({context, payload}) => {
    if (payload) {
        const globalPayload = {};

        globalPayload.allPlugins = [...allPluginNames, payload.payload.pluginName];
        $SD.setGlobalSettings({context: globalContext, payload: globalPayload});

        $SD.setSettings(context, payload);

        $SD.getGlobalSettings(globalContext);

        sibsocket && sibsocket.close();
        sibsocket = '';
        sibeliusToken = '';
    }
});
