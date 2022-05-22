import {MODULE_NAME} from "./init.js";
import FilterConfig from "./filter_config.mjs";
import MapMapList from "./map_map_list.mjs";
import BuildReport from "./build_report.mjs";
import CompendiumSummariserConfig from "./compendium_summariser_config.mjs";

export default class CompendiumSummariser {
    constructor() {
        this.config = new CompendiumSummariserConfig();

        // Note we do not reset BuildReport each time -- it continues to grow if the same
        // CompendiumSummariser is used to build multiple JournalEntries.
        this.buildReport = new BuildReport();
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
        
        this.compendiums.push(compendium);

        this.typeNameFilters.setCurrentCategory(compendium.metadata.name);
        this.itemNameFilters.setCurrentCategory(compendium.metadata.name);

        return this;
    }

    createOutputJournalNamed(journalName) {
        this.createOutputJournalName = journalName;
        this.journalName = journalName;
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

        this.journalName = j.data.name;
        this.overwriteJournalId = journalId;
        return this;
    }

    addTypeNameFilter(typeName) {
        this.typeNameFilters.addFilterThingToCurrentCategory(typeName);
        return this;
    }

    addItemNameFilter(itemName) {
        this.itemNameFilters.addFilterThingToCurrentCategory(itemName);
        return this;
    }

    disableCompendiumFolderGrouping() {
        this.ignoreCompendiumFolderGrouping = true;
        return this;
    }

    async write() {
        await this.#getCompendiumFolderData();

        this.buildReport.addHeading("PCTM.BuildReportTitle", {title: this.journalName})

        // Catch-all toggle for when something has already gone wrong; the report
        // should show what.
        if (this.failedValidate) {
            this.buildReport.addFatalError();
            this.#resetState();
            return;
        }

        const allItemsByTypeAndFolder = new MapMapList();
        
        for (const compendium of this.compendiums) {
            var itemCountFilteredByType = 0;
            const typesOfItemsFilteredByType = new Set();

            for (var itemIndex of compendium.index.values()) {
                const ogItem =  await compendium.getDocument(itemIndex._id);
                // Cloning the item because I'm going to mutate it below.
                const item = ogItem.clone();
                const type = item.type;

                if (item.documentName !== "Item") { continue; }
                if (item.name === game.CF.TEMP_ENTITY_NAME) { continue; }
                if (this.itemNameFilters.shouldFilter(compendium.metadata.name, item.name)) { 
                    this.buildReport.addEntry("PCTM.BuildReportFilterItem",
                        {itemName: item.name, 
                            compPackage: compendium.metadata.package,
                            compName: compendium.metadata.name});
                    continue; 
                }
                if (this.typeNameFilters.shouldFilter(compendium.metadata.name, type)) { 
                    itemCountFilteredByType++;
                    typesOfItemsFilteredByType.add(type);
                    continue; 
                }

                // Tuck some metadata about the compendium this item came from into it
                // so we can reference these in the table templates.
                item.compendiumPackage = compendium.metadata.package;
                item.compendiumName = compendium.metadata.name;
                item.compendiumLabel = compendium.metadata.label;

                // In the templates, I'm going to build links to the original item,
                // not this mutated clone. So copy the original ID over to the clone.
                item.ogId = ogItem.id;

                var folderName = "";
                if (this.compendiumFolderNames.has(item.ogId)) {
                    folderName = this.compendiumFolderNames.get(item.ogId);
                } 
                // strip all HTML out of the description as it's going to be shown in a
                // hover box with no formatting.
                // TODO this is shite, fix.
                // TODO also it barfs when it's passed things that aren't items
                if (item.data.data !== undefined) {
                    item.plainTextDescription = item.data.data.description
                            .replace(/(<([^>]+)>)/gi, "");

                    item.popupText = item.data.data.description;
                    item.popupText = item.popupText.replace(/<.?div.*?>/gi, "");  
                    item.popupText = item.popupText.replace(/<.?span.*?>/gi, "");  
                }
                
                allItemsByTypeAndFolder.push(type, folderName, item);
            }

            if (itemCountFilteredByType > 0) {
                const types = Array.from(typesOfItemsFilteredByType).join(", ");
                this.buildReport.addEntry("PCTM.BuildReportCountItemsFiltered", {
                    count: itemCountFilteredByType,
                    types: types,
                    compendium: `${compendium.metadata.package}.${compendium.metadata.name}`
                });
            }

        }

        var newContent = "";
        for (const type of allItemsByTypeAndFolder.getOuterKeys()) {

            if (this.debug)
                console.log(`Items for '${type}'`, allItemsByTypeAndFolder.getInnerMap(type));

            const rendered = await this.#renderContentForOneItemType(
                type, allItemsByTypeAndFolder.getInnerMap(type))
                .catch((err) => {
                    this.buildReport.addError("PCTM.BuildReportMissingTemplate", {
                        type: type, system: game.system.id});
                    console.error("Could not render for items: ", 
                        allItemsByTypeAndFolder.getInnerMap(type), err);
                });
            newContent = newContent.concat("\n\n", rendered);
        }

        // awful hack here
        // my current CSS implementation goes wonky if there's not enough room at the bottom of the
        // viewport to render the popup. I'm going to give it room by... just padding with some
        // whitespace.
        newContent = newContent.concat('<p class="paddingGraf"></p>');

        if (this.createOutputJournalName) {
            const data =  [{name: this.createOutputJournalName, content: newContent}];
            await JournalEntry.create(data);
        } else if (this.overwriteJournalId) {
            const data =  [{_id: this.overwriteJournalId, content: newContent}];
            await JournalEntry.updateDocuments(data, {permission: 3});
        } else {
            this.buildReport.addFatalError();
            ui.notifications.error(game.i18n.format("PCTM.ErrorNoOutput"));
        }

        // clear vars to guard against being called again
        this.config.resetState();
    }

    async #renderContentForOneItemType(type, itemsByFolder) {
        for (const folder of itemsByFolder.keys()) {
            itemsByFolder.get(folder).sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });    
        }
        return renderTemplate(
            `modules/${MODULE_NAME}/templates/${game.system.id}/${type}_table.hbs`, 
            { folders: Object.fromEntries(itemsByFolder) }
        );
    }

    /** Create a map of item.id to CompendiumFolders folder name, if it exists. */
    async #getCompendiumFolderData() {
        if (game.CF === undefined) { return; }
        if (this.config.ignoreCompendiumFolderGrouping) { return; }

        for(const compendium of this.compendiums) {
            const packCode = `${compendium.metadata.package}.${compendium.metadata.name}`;

            const cfolders = await game.CF.FICFolderAPI.loadFolders(packCode);
            const allEntries = await game.packs.get(packCode).getIndex({fields:["name","flags.cf"]});
            const nonFolders = allEntries.filter(x => x.name != game.CF.TEMP_ENTITY_NAME);

            if (this.debug) {
                console.log("getCompendiumFolderData allEntries", allEntries);
                console.log("getCompendiumFolderData nonFolders", nonFolders);
            }

            for (const doc of nonFolders) {
                if (doc.flags.cf === null) { continue; }
                const folderId = doc.flags.cf.id; 
                if (folderId) {
                    this.compendiumFolderNames.set(doc._id, cfolders.get(folderId).name);
                }
            }                
        }
    }

    showReport() {
        this.buildReport.show();
    }
}

