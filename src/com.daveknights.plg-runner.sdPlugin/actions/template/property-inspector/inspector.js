/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />

const pluginNameInput = document.querySelector('#plugin-name');

$PI.onConnected((jsn) => {
    const {actionInfo, appInfo, connection, messageType, port, uuid} = jsn;
    const {payload, context} = actionInfo;
    const {settings} = payload;

    if (settings && settings.payload) {
        pluginNameInput.value = settings.payload.pluginName || '';
     }
});


const save = () => {
    const payload = {};

    payload.pluginName = pluginNameInput.value;

    $PI.sendToPlugin({context: $PI.uuid,  payload: payload});
};
