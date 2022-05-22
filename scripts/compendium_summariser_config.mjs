
/** Stores all config necessary to run the compendium summariser. */
export default class CompendiumSummariserConfig {

    constructor() {
        this.resetConfig();
    }

    resetConfig() {
        this.debug = false;

        // If set, we will not group output by the name of the Compendium Folder used
        this.ignoreCompendiumFolderGrouping = false;

        // All compendiums being read as input.
        this.compendiums = [];

        // If we are creating a new JournalEntry, the name it should have.
        this.createOutputJournalName = "";
        // If we are overwriting an existing JournalEntry, this is its ID.
        this.overwriteJournalId = "";
        // The name of the journal being written to, regardless of which mode we're in.
        this.journalName = "";

        // An internal structure storing the names of all the Compendium Folders, if there are any.
        this.compendiumFolderNames = new Map();

        // Two internal structures holding the names of all types and items to filter out.
        this.typeNameFilters = new FilterConfig();
        this.itemNameFilters = new FilterConfig();

        // If this is toggled to true, we will not attempt to write anything.
        this.failedValidate = false;
    }


}