# Sibelius Actions Plugin For Elgato Stream Deck
__*** In development ***__

This plugin allows you to run custom & built-in plugins and commands in the Sibelius music notation software using Elgato Stream Deck.

<!-- [Image to go here] -->

## Setup
Firstly you must be using a version of **Sibelius** which supports it being remotely controlled (Sibelius Connect). This was first introduced in version **2024.3**.

You can enable (or disable) the remote control feature by going to the Input Devices page of the Preferences dialog.

> [!WARNING]
> You must not change the network port used for the websocket connection from its default 1898.

Each time you open Sibelius and press a button on your Stream Deck to use one of these actions an initial connection will need to be made, which you must accecpt if you wish to allow remote control.

<!-- [Image to go here] -->

### Plugin Runner Action
Upload a json file containing the plugin names you would like to run in Sibelius in the Plugin Runner property inspector.

> [!NOTE]
> Everytime you upload a file of category/plugin names a new connection with Sibelius needs to made, regardless of whether you have quit the application or not, so it can receive the updated list.

<!-- [Image to go here] -->

Here is a sample of how the json data must be formatted. It is strongly recommended to use a [json validator](https://jsonlint.com/) to ensure the file syntax is correct. You can separate words within plugin names with a single space so they will be more readable in the drop downs. These are automatically removed when sending the names to Sibelius.

Example file: `sibelius-plugins.json`  
In this instance, **Other** & **Batch Processing** are the categories, each containing an array of plugin names.
```json
{
    "plugins" : {
        "Other": [
            "Suggest Cue Locations"
        ],
        "Batch Processing": [
            "Preferences", "Calculate Statistics"
        ]
    }
}
```

Once uploaded you can select a category and a plugin name for the Stream Deck button to execute in Sibelius.

___

### Command Runner Action
Enter the ID of the command you want to run in the Plugin Runner property inspector.

> [!IMPORTANT]
> Unlike the Plugin Runner which saves the values automatically when selected from a drop down, you must click the **Save Command** button to store it's value in the property inspector.

## Releases
When Version 1.0.0 of the Sibelius Actions plugin is ready you will be able to download it from a release folder. Once downloaded, you can double-click the file to install it on you Stream Deck.

## Troubleshooting

### Plugin Runner
If after uploading a json file the category and plugin values are not showing in the property inspector drop downs, paste the contents of the file you uploaded into an onlie [json validator](https://jsonlint.com/) to ensure there are no syntax errors.

Every time you upload new plugin names, a new connection will need to be made with Sibelius regardless of whether you quit the application or not.

### Command Runner
It the action doesn't work, ensure the command ID you've used is correct and that you have clicked the **Save Command** button in the property inspector.

### Stream Deck +
Currently there is no support for Stream Deck + dials.

