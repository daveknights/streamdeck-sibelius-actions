/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const plgRunner = new Action('com.daveknights.plg-runner.action');
const cmdRunner = new Action('com.daveknights.cmd-runner.action');
const globalContext = 'comSibeliusActionsContext';
const connectMsg = {
    "message": "connect",
    "clientName": "StreamDeckActionsRunner",
    "handshakeVersion": "1.0",
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
    if (payload.settings?.payload?.plugins) {
        connectMsg.plugins = payload.settings.payload.pluginList;

        sibsocket.readyState && sibsocket.close();
        sibeliusToken = '';
    }
});

const connectAndRun = (type, payload) => {
    let name = '';

    if (type === 'plugin') {
        name = payload.name;
    } else {
        name = payload.commands[0];
    }

    if (!sibsocket || sibsocket.readyState === WebSocket.CLOSED) {
        sibsocket = new WebSocket('ws://127.0.0.1:1898');
    }

    if (name) {
        if (sibeliusToken) {
            sibsocket.send(JSON.stringify(payload));
        } else {
            sibsocket.onopen = () => {
                sibsocket.send(JSON.stringify(connectMsg));

                sibsocket.onclose = () => {
                    sibsocket = '';
                    sibeliusToken = '';
                }
            }
        }

        sibsocket.onmessage = event => {
            const jsonObj = JSON.parse(event.data);

            if (jsonObj.message === 'connectResponse' && jsonObj.result === true) {
                sibeliusToken = jsonObj.sessionToken;

                sibsocket.send(JSON.stringify(payload));
            }
        }
    } else {
        $SD.showAlert(context);
    }
};

plgRunner.onKeyUp(({ action, context, device, event, payload }) => payload.settings &&
    connectAndRun('plugin', { "message" : "invokePlugin", "name": payload.settings.payload.pluginName }));

plgRunner.onSendToPlugin(({context, payload}) => payload && $SD.setSettings(context, payload));

cmdRunner.onKeyUp(({ action, context, device, event, payload }) => payload.settings &&
    connectAndRun('command', { "message" : "invokeCommands", "commands": [payload.settings.payload.commandName] }));

cmdRunner.onSendToPlugin(({context, payload}) => payload && $SD.setSettings(context, payload));
