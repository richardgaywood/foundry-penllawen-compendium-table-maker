import {MODULE_NAME} from "./init.js";
import MapMapList from "./map_map_list.mjs";

/** Actually generates the output & writes it to the journal entry */
export default class CompendiumSummariserRenderer {

    constructor() {
    }

    async write(config, buildReport) {
        // An internal structure storing the names of all the Compendium Folders, if there are any.
        // this.compendiumFolderNames = new Map();

        // TODO: putting these in class-scoped fields feels crappy. Maybe pass them around instead.
        this.config = config;
        this.buildReport = buildReport;

        // await this.#getCompendiumFolderData();

        this.buildReport.addHeading("PCTM.BuildReportTitle", {title: config.journalPageName})

        const allItemsByTypeAndFolder = new MapMapList();
        
        for (const compendium of config.compendiums) {
            var itemCountFilteredByType = 0;
            const typesOfItemsFilteredByType = new Set();

            for (var itemIndex of compendium.index.values()) {
                const ogItem =  await compendium.getDocument(itemIndex._id);
                // Cloning the item because I'm going to mutate it below.
                const item = ogItem.clone();
                const type = item.type;

                if (item.documentName !== "Item") { continue; }
                if (item.name === game.CF.TEMP_ENTITY_NAME) { continue; }
                if (config.itemNameFilters.shouldFilter(compendium.metadata.name, item.name)) { 
                    buildReport.addEntry("PCTM.BuildReportFilterItem",
                        {itemName: item.name, 
                            compPackageName: compendium.metadata.packageName,
                            compName: compendium.metadata.name});
                    continue; 
                }
                if (config.typeNameFilters.shouldFilter(compendium.metadata.name, type)) { 
                    itemCountFilteredByType++;
                    typesOfItemsFilteredByType.add(type);
                    continue; 
                }

                // Tuck some metadata about the compendium this item came from into it
                // so we can reference these in the table templates.
                item.metadata_id = compendium.metadata.id;
                item.compendiumPackageName = compendium.metadata.packageName;
                item.compendiumName = compendium.metadata.name;
                item.compendiumLabel = compendium.metadata.label;

                // In the templates, I'm going to build links to the original item,
                // not this mutated clone. So copy the original ID over to the clone.
                item.ogId = ogItem.id;

                var folderName = "";
                // Sort items in the output journal by their defined SWADE category name.
                if (item.system.category) {
                    // console.log(item.system.category, item);
                    folderName = item.system.category;
                }
                // if (this.compendiumFolderNames.has(item.ogId)) {
                //     folderName = this.compendiumFolderNames.get(item.ogId);
                // } 

                // strip all HTML out of the description as it's going to be shown in a
                // hover box with no formatting.
                // TODO this is shite, fix.
                // TODO also it barfs when it's passed things that aren't items
                if (item.system !== undefined) {
                    item.plainTextDescription = item.system.description
                            .replace(/(<([^>]+)>)/gi, "");

                    item.popupText = item.system.description;
                    item.popupText = item.popupText.replace(/<.?div.*?>/gi, "");  
                    item.popupText = item.popupText.replace(/<.?span.*?>/gi, "");  
                    item.popupText = item.popupText.replace(/<.?h[1-9]>/gi, "");  
                }
                
                allItemsByTypeAndFolder.push(type, folderName, item);
            }

            if (itemCountFilteredByType > 0) {
                const types = Array.from(typesOfItemsFilteredByType).join(", ");
                buildReport.addEntry("PCTM.BuildReportCountItemsFiltered", {
                    count: itemCountFilteredByType,
                    types: types,
                    compendium: `${compendium.metadata.packageName}.${compendium.metadata.name}`
                });
            }
        }

        var newContent = "";
        for (const type of allItemsByTypeAndFolder.getOuterKeys()) {
            if (config.debug)
                console.log(`Items for '${type}'`, allItemsByTypeAndFolder.getInnerMap(type));

            const rendered = await this.#renderContentForOneItemType(
                type, allItemsByTypeAndFolder.getInnerMap(type))
                .catch((err) => {
                    buildReport.addError("PCTM.BuildReportMissingTemplate", {
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

        if (config.outputJournalId && config.journalPageName) {
            JournalEntryPage.create({
                    name: config.journalPageName, 
                    text: {content: newContent},
                    title: {show: true, level: 1}
            }, {
                parent: game.journal.get(config.outputJournalId), 
                permission: 3
            });
        } else {
            ui.notifications.error(game.i18n.format("PCTM.ErrorNoOutput"));
        }
    }    

    async #renderContentForOneItemType(type, itemsByCategory) {
        for (const category of itemsByCategory.keys()) {
            itemsByCategory.get(category).sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });    
        }
        if (this.config.debug)
            console.log("itemsByCategory in #renderContentForOneItemType", itemsByCategory);

        return renderTemplate(
            `modules/${MODULE_NAME}/templates/${game.system.id}/${type}_table.hbs`, 
            { folders: Object.fromEntries(itemsByCategory) }
        );
    }

    /** Create a map of item.id to CompendiumFolders folder name, if it exists. */
    async #getCompendiumFolderData() {
        // This code is currently (very) broken; for now, I am going to ignore CompendiumFolders support.
        return;

    //     if (game.CF === undefined) { 
    //         if (this.config.debug) { console.log("CF not detected"); }
    //         return; 
    //     }
    //     if (this.config.ignoreCompendiumFolderGrouping) { 
    //         if (this.config.debug) { console.log("ignoring CF"); }
    //         return; 
    //     }

    //     for(const compendium of this.config.compendiums) {
    //         const packCode = `${compendium.metadata.packageName}.${compendium.metadata.name}`;

    //         const cfolders = await game.CF.FICFolderAPI.loadFolders(packCode);
    //         const allEntries = await game.packs.get(packCode).getIndex({fields:["name","flags.cf"]});
    //         const nonFolders = allEntries.filter(x => x.name != game.CF.TEMP_ENTITY_NAME);

    //         if (this.config.debug) {
    //             console.log("getCompendiumFolderData allEntries", allEntries);
    //             console.log("getCompendiumFolderData nonFolders", nonFolders);
    //         }

    //         console.log("nonFolders", nonFolders);


    //         for (const doc of nonFolders) {
    //             if (doc.flags === null || doc.flags.cf === null) { continue; }
    //             // NB: doc.flags is gone in Foundry V10, I do not know where
    //             // CF now puts the folder metadata -- it doesn't appear to have
    //             // an API to read that, and I am reluctant to tightly bind to its
    //             // internal private code.
    //             const folderId = doc.flags.cf.id; 
    //             if (folderId) {
    //                 this.compendiumFolderNames.set(doc._id, cfolders.get(folderId).name);
    //             }
    //         }                
    //     }
    }

}