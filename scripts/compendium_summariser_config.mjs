import FilterConfig from "./filter_config.mjs";

/** Stores all config necessary to run the compendium summariser. */
export default class CompendiumSummariserConfig {

    constructor() {
        this.resetConfig();
    }

    resetConfig() {
        this.debug = false;

        // All compendiums being read as input.
        this.compendiums = [];

        // If set, we will not group output by the name of the Compendium Folder used
        this.ignoreCompendiumFolderGrouping = false;

        // If we are creating a new JournalEntry, the name it should have.
        this.createOutputJournalName = "";
        // If we are overwriting an existing JournalEntry, this is its ID.
        this.overwriteJournalId = "";
        // The name of the journal being written to, regardless of which mode we're in.
        this.journalName = "";

        // Two internal structures holding the names of all types and items to filter out.
        this.typeNameFilters = new FilterConfig();
        this.itemNameFilters = new FilterConfig();
    }


}