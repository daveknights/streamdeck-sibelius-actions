import streamDeck, { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import * as fs from 'fs';
import path from 'path';
import { PluginGlobalSettings } from "../shared/sibelius-actions.model";

@action({ UUID: "com.daveknights.sibelius-actions.get-all-plugins" })
export class GetAllPlugins extends SingletonAction<GetAllPluginsSettings> {
    globalSettings!: PluginGlobalSettings;

    async *walk(dir:string): any {
        for await (const d of await fs.promises.opendir(dir)) {
            const entry = path.join(dir, d.name);

            if (d.isDirectory()) {
                yield {'directory': d.name}
                yield* this.walk(entry);
            } else if (d.isFile() && d.name.endsWith('.plg')) {
                yield {'plugin': d.name.replace('.plg', '')};
            }
        }
    }

    async getPluginNames(path: string): Promise<{[k: string]: string[]}> {
        const pluginData: {[k: string]: string[]} = {};
        let directory = '';

        for await (const p of this.walk(path)) {
            if ('directory' in p) {
                directory = p.directory;
                pluginData[directory] = [];
            } else if ('plugin' in p) {
                pluginData[directory].push(p.plugin);
            }
        }

        return pluginData;
    }
    // Use the path provided in the UI to get the plugin categories and names
    override async onKeyDown(ev: KeyDownEvent<GetAllPluginsSettings>): Promise<void> {
        if (ev.payload.settings.pluginPath) {
            const rawPath = ev.payload.settings.pluginPath;
            const folderPath:string = rawPath.substring(0, rawPath.lastIndexOf('/'));

            await this.getPluginNames(folderPath).then(async pluginData => {
                const allCategories = [];
                const allPluginNames = [];
                // Get all plugin names from all categories to send to Sibelius
                for (const category in pluginData) {
                    allCategories.push(category);
                    for (const plugin of pluginData[category]) {
                        allPluginNames.push(plugin);
                    }
                }
                // Set the global settings after receiving all category/plugin names
                streamDeck.settings.setGlobalSettings({
                    ...this.globalSettings,
                    plugins: pluginData,
                    categoryList: allCategories,
                    pluginList: allPluginNames,
                });
                // visual feedback on the key
                ev.action.showOk();
            });
        }
    }
}

/**
 * Settings for {@link GetAllPlugins}.
 */
type GetAllPluginsSettings = {
    pluginPath: string
};
