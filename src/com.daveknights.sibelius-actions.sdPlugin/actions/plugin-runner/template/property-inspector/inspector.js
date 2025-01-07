/// <reference path="../../../../libs/js/property-inspector.js" />
/// <reference path="../../../../libs/js/utils.js" />

const globalContext = 'comSibeliusActionsContext';
const form = document.querySelector('#property-inspector');
const categoryDropdown = document.querySelector('.sibelius-category-dropdown');
const categorySelect = document.querySelector('#sibelius-plugin-category');
const pluginDropdown = document.querySelector('.sibelius-plugin-dropdown');
const pluginSelect = document.querySelector('#sibelius-plugin-name');
const fileInput = document.querySelector('#sibelius-file');
const splitTitleCase = /(?<=[a-z])(?=[A-Z])/g;
const buttonValues = {
    category: '',
    pluginName: ''
};
let categoryValue = '';
let pluginValue = '';

$PI.onConnected(jsn => {
    const {settings} = jsn.actionInfo.payload;

    $PI.getGlobalSettings(globalContext);

    if (settings && settings.payload?.category) {
        categoryDropdown.classList.add('show');
        categoryValue = settings.payload.category;

        pluginDropdown.classList.add('show');
        pluginValue = settings.payload.pluginName || '';

     } else {
        categoryValue = '';
     }
});

$PI.onDidReceiveGlobalSettings(({payload}) => {
    if (payload.settings?.payload?.plugins) {
        categoryDropdown.classList.add('show');

        categorySelect.innerHTML = '';
        addSelectOption(categorySelect, 'Select a category');

        for (const category in payload.settings.payload.plugins) {
            addSelectOption(categorySelect, category, category )
        }

        categorySelect.addEventListener('change', e => {
            save('category', e.target.value);
            pluginDropdown.classList.add('show');

            pluginSelect.innerHTML = '';

            addSelectOption(pluginSelect, 'Select a plugin');

            for (const plugin of payload.settings.payload.plugins[e.target.value].sort()) {
                addSelectOption(pluginSelect, `${plugin.replace(splitTitleCase, ' ')}`, plugin);
            }
        });

        pluginSelect.addEventListener('change', e => {
            save('pluginName', e.target.value);
        });

        if (categoryValue) {
            categorySelect.value = categoryValue;

            for (const plugin of payload.settings.payload.plugins[categoryValue].sort()) {
                addSelectOption(pluginSelect, `${plugin.replace(splitTitleCase, ' ')}`, plugin);
            }
        }

        if (pluginValue) {
            pluginSelect.value = pluginValue;
        }
    }
});

const addSelectOption = (element, text, value = '') => {
    element.insertAdjacentHTML('beforeend', `<option${value && ` value="${value}"`}>${text}</option>`);
};

const save = (key, value) => {
    buttonValues[key] = value;

    $PI.sendToPlugin({context: $PI.uuid,  payload: buttonValues});
};

fileInput.addEventListener('change', async e => {
    const fileName = fileInput.files[0].name.replaceAll('%2F', '/').split('/').pop();
    document.querySelector('.sdpi-file-info[for="sibelius-file"]').textContent = fileName;

    const filePath = decodeURIComponent(fileInput.value.replace(/^C:\\fakepath\\/, ''));
    const response = await fetch(filePath);
    const data = await response.json();

    const globalPayload = {};
    let allPluginNames = [];

    for (const category in data.plugins) {
        for (const plugin of data.plugins[category]) {
            allPluginNames.push(plugin);
        }
    }

    globalPayload.pluginList = allPluginNames;
    globalPayload.plugins = data.plugins;

    $PI.setGlobalSettings({context: globalContext, payload: globalPayload});

    $PI.getGlobalSettings(globalContext);
});
