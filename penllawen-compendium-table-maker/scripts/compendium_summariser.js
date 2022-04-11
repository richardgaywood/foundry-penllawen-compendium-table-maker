import {MODULE_NAME} from "./init.js";
import FilterConfig from "./filter_config.mjs";
import MapMapList from "./map_map_list.mjs";

export default class CompendiumSummariser {
    constructor() {
        this.#resetState();
    }

    #resetState() {
        this.compendiums = [];
        this.journal;
        this.compendiumFolderNames = new Map();
        this.typeNameFilters = new FilterConfig();
        this.itemNameFilters = new FilterConfig();
        this.buildReport = [];
    }

    addInputCompendium(arg) {
        var compendium;
        if (arg instanceof CompendiumCollection) {
            compendium = arg;
        } else if (arg instanceof String || typeof arg === "string") {
            compendium = game.packs.get(arg);
            if (compendium === undefined) {
                // TODO probably better to report the error to the UI
                throw new Error(`'${arg}' is not a valid Compendium name`);    
            }
        } else {
            // TODO probably better to report the error to the UI
            throw new Error("addInputCompendium() must be passed a CompendiumCollection or compendium string");
        }
        
        this.compendiums.push(compendium);

        this.typeNameFilters.setCurrentCategory(compendium.metadata.name);
        this.itemNameFilters.setCurrentCategory(compendium.metadata.name);

        return this;
    }

    setOutputJournal(journal) {
        if (!(journal instanceof JournalEntry)) {
            throw new Error("setOutputJournal() must be passed a JournalEntry");
        } 
        this.journal = journal;
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

    async write() {
        this.#getCompendiumFolderData();

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
                    // TODO localise
                    this.buildReport.push(`Filtered item '${item.name}' from '${compendium.metadata.package}.${compendium.metadata.name}'`);
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
                }
                
                allItemsByTypeAndFolder.push(type, folderName, item);
            }

            if (itemCountFilteredByType > 0) {
                // TODO localise
                const types = Array.from(typesOfItemsFilteredByType).join(", ");
                this.buildReport.push(`Filtered ${itemCountFilteredByType} item(s) of type(s) '${types}' from ` +
                        `${compendium.metadata.package}.${compendium.metadata.name}`);
            }

        }

        var newContent = "";
        for (const type of allItemsByTypeAndFolder.getOuterKeys()) {
            const rendered = await this.#renderContentForOneItemType(
                type, allItemsByTypeAndFolder.getInnerMap(type))
                .catch((err) => {
                    const report = `ERROR! Could not render item type '${type}' in game system '${game.system.id}'; missing template?`;
                    this.buildReport.push(report);
                    console.error(report);
                });
            newContent = newContent.concat("\n\n", rendered);
        }
        const updates =  [{_id: this.journal.id, content: newContent}];
        await JournalEntry.updateDocuments(updates);


        // console.log(this.buildReport);
        this.#showReport();
        // clear vars to guard against being called again
        this.#resetState();

    }

    async #renderContentForOneItemType(type, itemsByFolder) {
        console.log("itemsByFolder", itemsByFolder);
        for (const folder of itemsByFolder.keys()) {
            itemsByFolder.get(folder).sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });    
        }
        return renderTemplate(
            `modules/${MODULE_NAME}/templates/${game.system.id}/${type}_table.html`, 
            { folders: Object.fromEntries(itemsByFolder) }
        );
    }

    /** Create a map of item.id to CompendiumFolders folder name, if it exists. */
    async #getCompendiumFolderData() {
        if (game.CF === undefined) { return; }

        for(const compendium of this.compendiums) {
            const packCode = `${compendium.metadata.package}.${compendium.metadata.name}`;

            const cfolders = await game.CF.FICFolderAPI.loadFolders(packCode);
            const allEntries = await game.packs.get(packCode).getIndex({fields:["name","flags.cf"]});
            const nonFolders = allEntries.filter(x => x.name != game.CF.TEMP_ENTITY_NAME);

            for (const doc of nonFolders) {
                if (doc.flags.cf === null) { continue; }
                const folderId = doc.flags.cf.id; 
                if (folderId) {
                    this.compendiumFolderNames.set(doc._id, cfolders.get(folderId).name);
                }
            }                
        }
    }


    #showReport() {
        // TODO localisaton
        let d = new Dialog({
            title: 'Select Player',
            content: "<p><ul><li>" + this.buildReport.join("</li>\n<li>") + "</li></ul></p>",
            buttons: {
                submit: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "OK"//,
                    // callback: (html) => { }
                },
        
            }
        }).render(true)
    }
}

