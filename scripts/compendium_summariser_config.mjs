import FilterConfig from "./filter_config.mjs";

/** Stores all config necessary to run the compendium summariser. */
export default class CompendiumSummariserConfig {

    constructor() {
        this.resetConfig();

        // The ID of the Journal we are writing pages into; 
        // NB this is not reset on each call to write(), so is not
        // in the resetConfig method.
        this.outputJournalId = "";
    }

    resetConfig() {
        this.debug = false;

        // All compendiums being read as input.
        this.compendiums = [];
        
        // The name of the journal page we are going to create and then write to.
        this.journalPageName = "";

        // Two internal structures holding the names of all types and items to filter out.
        this.typeNameFilters = new FilterConfig();
        this.itemNameFilters = new FilterConfig();
    }
}