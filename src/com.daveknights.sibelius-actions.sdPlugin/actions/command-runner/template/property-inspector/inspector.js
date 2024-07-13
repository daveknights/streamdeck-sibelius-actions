/// <reference path="../../../../libs/js/property-inspector.js" />
/// <reference path="../../../../libs/js/utils.js" />

const commandNameInput = document.querySelector('#command-name');

$PI.onConnected(jsn => {
    const {settings} = jsn.actionInfo.payload;

    if (settings && settings.payload) {
        commandNameInput.value = settings.payload.commandName || '';
     }
});

const save = () => {
    const payload = {};

    payload.commandName = commandNameInput.value;

    $PI.sendToPlugin({context: $PI.uuid,  payload: payload});
};
