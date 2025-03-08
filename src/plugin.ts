import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { PluginRunner } from "./actions/plugin-runner";
import { GetAllPlugins } from "./actions/get-all-plugins";
import { CommandRunner } from "./actions/command-runner";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register the plugin-runner action.
streamDeck.actions.registerAction(new GetAllPlugins());
streamDeck.actions.registerAction(new PluginRunner());
streamDeck.actions.registerAction(new CommandRunner());

// Finally, connect to the Stream Deck.
streamDeck.connect();
