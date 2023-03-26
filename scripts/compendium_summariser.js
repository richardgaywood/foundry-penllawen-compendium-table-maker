import BuildReport from "./build_report.mjs";
import CompendiumSummariserConfig from "./compendium_summariser_config.mjs";
import CompendiumSummariserRenderer from "./compendium_summariser_renderer.mjs";
import {FilterConfig, FilterSet} from "./filter_config.mjs";

export default class CompendiumSummariser {
    constructor() {
        this.config = new CompendiumSummariserConfig();
        this.renderer = new CompendiumSummariserRenderer();

        // Note we do not reset BuildReport each time -- it continues to grow if the same
        // CompendiumSummariser is used to build multiple JournalEntries or Pages.
        this.buildReport = new BuildReport();

        // If this is toggled to true, we will not attempt to write anything.
        this.failedValidate = false;
    }

    async makeNewJournalNamed(journalName) {
        const foo = await JournalEntry.create([{name: journalName}]);
        this.config.outputJournalId = foo[0].id;

        // NB: do not `return this`, this is not part of the Fluent API.
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
        this.config.filters.setCurrentPackage(compendium.metadata.id);

        return this;
    }

    addJournalPageNamed(journalPageName) {
        this.config.journalPageName = journalPageName;
        return this;
    }

    addCategoryRenamer(oldName, newName) {
        this.config.categoryRenames.set(oldName, newName);
        return this;
    }

    includeItemsByType(typeName) {
        this.config.filters.addFilterEntry(FilterSet.FILTER_TYPE_NAME, FilterConfig.POLARITY_INCLUDE, typeName);
        return this;
    }
    excludeItemsByType(typeName) {
        this.config.filters.addFilterEntry(FilterSet.FILTER_TYPE_NAME, FilterConfig.POLARITY_EXCLUDE, typeName);
        return this;
    }

    includeItemsByName(itemName) {
        this.config.filters.addFilterEntry(FilterSet.FILTER_ITEM_NAME, FilterConfig.POLARITY_INCLUDE, itemName);
        return this;
    }
    excludeItemsByName(itemName) {
        this.config.filters.addFilterEntry(FilterSet.FILTER_ITEM_NAME, FilterConfig.POLARITY_EXCLUDE, itemName);
        return this;
    }

    includeItemsByCategory(categoryName) {
        this.config.filters.addFilterEntry(FilterSet.FILTER_CATEGORY_NAME, FilterConfig.POLARITY_INCLUDE, categoryName);
        return this;
    }
    excludeItemsByCategory(categoryName) {
        this.config.filters.addFilterEntry(FilterSet.FILTER_CATEGORY_NAME, FilterConfig.POLARITY_EXCLUDE, categoryName);
        return this;
    }

    async writeJournalPage() {
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

    /* Old API methods, only kept to warn users. */
    disableCompendiumFolderGrouping() { ui.notifications.error(game.i18n.format("PCTM.OldApi")); }
    createOutputJournalNamed(journalName) { ui.notifications.error(game.i18n.format("PCTM.OldApi")); }
    overwriteJournalWithID(journalId) { ui.notifications.error(game.i18n.format("PCTM.OldApi")); }
    addTypeNameFilter(typeName) { ui.notifications.error(game.i18n.format("PCTM.OldApi")); }
    addItemNameFilter(itemName) { ui.notifications.error(game.i18n.format("PCTM.OldApi")); }
    addCategoryFilter(categoryName) { ui.notifications.error(game.i18n.format("PCTM.OldApi")); }
    async write() { ui.notifications.error(game.i18n.format("PCTM.OldApi")); }
}
