import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { wSConnect } from "../shared/web-socket-connection";
import type { StaveValues } from "../shared/sibelius-actions.model";

@action({ UUID: "com.daveknights.sibelius-actions.minus-stave" })
export class MinusStave extends SingletonAction {
    /**
     * Use the plugin name to send to Sibelius
     * Retrieve the paper size & stave values
     * Set this title & PlusStave key title
     */
    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        wSConnect.sendPayload({ "message": "invokePlugin", "name": 'SystemsPerPageMinus' });

        wSConnect.getStaveValues().then((values:StaveValues) => {
            const [paperSize, firstPage, secondPage] = <StaveValues>values;

            ev.action.setTitle(`${paperSize}\n\n${parseInt(firstPage) - 1} - ${parseInt(secondPage) - 1}`);

            streamDeck.actions.forEach((action) => {
                if (action.manifestId.endsWith('plus-stave')) {
                    action.setTitle(`${paperSize}\n\n${parseInt(firstPage) + 1} - ${parseInt(secondPage) + 1}`);
                }
            });

            wSConnect.clearStaveValues();
        });
    };
}
