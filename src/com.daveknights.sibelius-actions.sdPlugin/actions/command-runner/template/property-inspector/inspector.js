/// <reference path="../../../../libs/js/property-inspector.js" />
/// <reference path="../../../../libs/js/utils.js" />

const commandNameInput = document.querySelector('#command-name');

$PI.onConnected((jsn) => {
    const {actionInfo, appInfo, connection, messageType, port, uuid} = jsn;
    const {payload, context} = actionInfo;
    const {settings} = payload;

    if (settings && settings.payload) {
        pluginNameInput.value = settings.payload.commandName || '';
     }
});

const save = () => {
    const payload = {};

    payload.commandName = commandNameInput.value;

    $PI.sendToPlugin({context: $PI.uuid,  payload: payload});
};
