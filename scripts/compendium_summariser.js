import BuildReport from "./build_report.mjs";
import CompendiumSummariserConfig from "./compendium_summariser_config.mjs";
import CompendiumSummariserRenderer from "./compendium_summariser_renderer.mjs";

export default class CompendiumSummariser {
    constructor() {
        this.config = new CompendiumSummariserConfig();
        this.renderer = new CompendiumSummariserRenderer();

        // Note we do not reset BuildReport each time -- it continues to grow if the same
        // CompendiumSummariser is used to build multiple JournalEntries.
        this.buildReport = new BuildReport();

        // If this is toggled to true, we will not attempt to write anything.
        this.failedValidate = false;
    }

    enableDebug() {
        this.config.debug = true;
        return this;
    }

    addInputCompendium(arg) {
        var compendium;
        if (arg instanceof CompendiumCollection) {
            compendium = arg;
        } else if (arg instanceof String || typeof arg === "string") {
            compendium = game.packs.get(arg);
            if (compendium === undefined) {
                ui.notifications.error(
                    game.i18n.format("PCTM.ErrorInvalidCompendiumName", {name: arg}));
                this.failedValidate = true;
                return this;
            }
        } else {
            ui.notifications.error(
                game.i18n.format("PCTM.ErrorMissingCompendiumName", {}));
            this.failedValidate = true;
            return this;
        }
        
        this.config.compendiums.push(compendium);

        this.config.typeNameFilters.setCurrentCategory(compendium.metadata.name);
        this.config.itemNameFilters.setCurrentCategory(compendium.metadata.name);

        return this;
    }

    createOutputJournalNamed(journalName) {
        this.config.createOutputJournalName = journalName;
        this.config.journalName = journalName;
        return this;
    }

    overwriteJournalWithID(journalId) {
        const j = game.journal.get(journalId);
        if (j === undefined) {
            ui.notifications.error(
                game.i18n.format("PCTM.ErrorMissingJournalID", {id: journalId}));
            this.failedValidate = true;
            return this;
        } 

        this.config.journalName = j.name;
        this.config.overwriteJournalId = journalId;
        return this;
    }

    addTypeNameFilter(typeName) {
        this.config.typeNameFilters.addFilterThingToCurrentCategory(typeName);
        return this;
    }

    addItemNameFilter(itemName) {
        this.config.itemNameFilters.addFilterThingToCurrentCategory(itemName);
        return this;
    }

    disableCompendiumFolderGrouping() {
        this.config.ignoreCompendiumFolderGrouping = true;
        return this;
    }

    async write() {
        // Catch-all toggle for when something has already gone wrong; the report
        // should show what.
        if (this.failedValidate) {
            this.buildReport.addFatalError();
            this.config.resetConfig();
            return;
        }

        await this.renderer.write(this.config, this.buildReport);

        // clear vars to guard against being called again
        this.config.resetConfig();
    }

    showReport() {
        this.buildReport.show();
    }
}
