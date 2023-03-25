import {FilterSet} from "./filter_config.mjs";

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

        // All compendiums being read as input. These are CompendiumCollection objects
        // ie. Foundry's internal data structure.
        this.compendiums = [];
        
        // The name of the journal page we are going to create and then write to.
        this.journalPageName = "";

        // Sets of filters that will be used to remove or keep items.
        this.filters = new FilterSet(this);

        // Used to rename SWADE's categories as they are processed
        this.categoryRenames = new Map();
    }
}