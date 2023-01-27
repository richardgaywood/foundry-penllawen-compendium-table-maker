// import "./constants.js";

import {MODULE_NAME} from "./init.js";
import CompendiumSummariser from "./compendium_summariser.js";

export default class api {
    static getCompendiumSummariser() {
        return new CompendiumSummariser();
    }
}

Hooks.on("ready", () => game.modules.get(MODULE_NAME).api = api);