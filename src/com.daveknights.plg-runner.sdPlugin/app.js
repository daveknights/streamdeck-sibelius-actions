/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const myAction = new Action('com.daveknights.plg-runner.action');
const globalContext = 'comSibeliusPluginContext';
const connectMsg = {
    "message": "connect",
    "clientName": "StreamDeckPlgRunner",
    "handshakeVersion": "1.0",
    "plugins": [],
};
let globalSettings = {};
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
    !('plugins' in globalSettings) && (globalSettings = {...payload.settings.payload});

    if (payload.settings?.payload?.plugins) {
        connectMsg.plugins = payload.settings.payload.pluginList;
    }

    if (payload.settings?.payload?.token) {
        sibeliusToken = payload.settings.payload.token;
    }
});

myAction.onKeyUp(({ action, context, device, event, payload }) => {
    if (!sibsocket || sibsocket.readyState === 3) {
        sibsocket = new WebSocket('ws://127.0.0.1:1898');

        globalSettings.token = '';
        $SD.setGlobalSettings({context: globalContext, payload: globalSettings});
        $SD.getGlobalSettings(globalContext);
    }

    if (payload.settings && payload.settings.payload.pluginName) {
        if (sibeliusToken) {
            sibsocket.send(JSON.stringify({ "message" : "invokePlugin", "name": payload.settings.payload.pluginName }));
        } else {
            sibsocket.onopen = event => sibsocket.send(JSON.stringify(connectMsg));
        }

        sibsocket.onmessage = event => {
            const jsonObj = JSON.parse(event.data);

            if (jsonObj.message === 'connectResponse') {
                sibsocket.send(JSON.stringify({ "message" : "invokePlugin", "name": payload.settings.payload.pluginName }));
            }

            if(jsonObj.sessionToken) {
                globalSettings.token = jsonObj.sessionToken;
                $SD.setGlobalSettings({context: globalContext, payload: globalSettings});

                $SD.getGlobalSettings(globalContext);
            }
        }
    } else {
        $SD.showAlert(context);
    }
});

myAction.onSendToPlugin(({context, payload}) => {
    if (payload) {
        $SD.setSettings(context, payload);
    }
});
