import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { wSConnect } from "../shared/web-socket-connection";

@action({ UUID: "com.daveknights.sibelius-actions.minus-stave" })
export class MinusStave extends SingletonAction {
    /**
     * Invoke the plugin named 'SystemsPerPageMinus' in Sibelius
     */
    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        wSConnect.openWebSocket()?.then((isOpen:boolean) => wSConnect.sendPayload({ "message": "invokePlugin", "name": 'SystemsPerPageMinus' }));
    };
}
