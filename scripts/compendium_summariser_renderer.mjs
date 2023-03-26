import {MODULE_NAME} from "./init.js";
import MapMapList from "./map_map_list.mjs";
import {FilterSet} from "./filter_config.mjs";

/** Actually generates the output & writes it to the journal entry */
export default class CompendiumSummariserRenderer {

    constructor() {
    }

    async write(config, buildReport) {
        // TODO: putting these in class-scoped fields feels crappy. Maybe pass them around instead.
        this.config = config;
        this.buildReport = buildReport;

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

                // Check filters to see if we want to output this item or not
                if (!(
                    this.config.filters.filter(FilterSet.FILTER_ITEM_NAME, item.name, compendium.metadata.id)
                    && this.config.filters.filter(FilterSet.FILTER_TYPE_NAME, type, compendium.metadata.id)
                    && this.config.filters.filter(FilterSet.FILTER_CATEGORY_NAME, item.system.category, compendium.metadata.id)
                    )) {
                        
                    buildReport.addEntry("PCTM.BuildReportFilterItem",
                        {itemName: item.name, 
                            compPackageName: compendium.metadata.packageName,
                            compName: compendium.metadata.name});
                    continue; 
                }
            
                // Tuck some metadata about the compendium this item came from into it
                // so we can reference these in the table templates.
                item.metadata_id = compendium.metadata.id;
                item.compendiumPackageName = compendium.metadata.packageName;
                item.compendiumName = compendium.metadata.name;
                item.compendiumLabel = compendium.metadata.label;
                // This will be used to hold any random item-specific data I need in the
                // template HBS file; one example is localised strings where I need some logic
                // for the localisation.
                item.extraData = {};

                // In the templates, I'm going to build links to the original item,
                // not this mutated clone. So copy the original ID over to the clone.
                item.ogId = ogItem.id;

                var folderName = "";
                // Sort items in the output journal by their defined SWADE category name.
                if (item.system.category) {
                    if (config.categoryRenames.has(item.system.category)) {
                        folderName = config.categoryRenames.get(item.system.category);
                    } else {
                        folderName = item.system.category;
                    }
                }

                item.descriptionForTooltip = 
                    `<p><i>Source: ${compendium.metadata.label}</i></p>`;

                if (item.system && item.system.description) {
                    // I seem to need an extra await here, although it feels unnecessary.
                    const enrichText = await TextEditor.enrichHTML(item.system.description, {async: true});
                    // Note that this will be HTML-escaped in the handlebars template, so
                    // no need to escape it here.

                    // Strip any CSS; it won't play well with Foundry's tooltip formatting. 
                    const doc = new DOMParser().parseFromString(enrichText, "text/html");
                    doc.querySelectorAll("*")
                        .forEach((element) => {
                            element.removeAttribute("class");
                        });

                    item.descriptionForTooltip = doc.body.innerHTML + item.descriptionForTooltip;
                } 
                
                // Perform any per-system, per-item-type specific processing I need
                this.#itemTypeSpecificProcessing(item);
                
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
        // convert Map-of-Lists to List-of-Lists, so we can preserve ordering inside the hbs
        const sortedList = Array.from(itemsByCategory).map(([name, value]) => ({name, value}));
        // Then sort the category names themselves...
        sortedList.sort(function(a, b) { return a.name.localeCompare(b.name); });    
        // ...then sort the items within each category.
        for (const itemList of sortedList) {
            itemList.value.sort(function(a, b) { return a.name.localeCompare(b.name); });    
        }

        return renderTemplate(
            `modules/${MODULE_NAME}/templates/${game.system.id}/${type}_table.hbs`, {
                itemsByCategory: sortedList 
            }
        );
    }

    /** Some item types require tailored handling; do that here. */ 
    // TODO: if this gets big, split it out into a helper class.
    async #itemTypeSpecificProcessing(item) {
        if (game.system.id === "swade" && item.type == "ability") {
            // TODO: this might be a cleaner way:
            // item.extraData.translatedAbilitySubTypeName = 
            //     game.i18n.format(SWADE.abilitySheet[item.system.subtype].abilities);

            // but I want to ship this feature NOW, so: it's a-hardcoding we will go!
            switch(item.system.subtype) {
                case "special":
                    item.extraData.translatedAbilitySubTypeName = 
                        game.i18n.format("SWADE.SpecialAbilities");
                    break;
                case "race":
                    item.extraData.translatedAbilitySubTypeName = 
                        game.i18n.format("SWADE.RacialAbilities");
                    break;
                case "archetype":
                    item.extraData.translatedAbilitySubTypeName = 
                        game.i18n.format("SWADE.ArchetypeAbilities");
                    break;
                default:
                    item.extraData.translatedAbilitySubTypeName = 
                        game.i18n.format("PCTM.ErrorUnknownAbilitySubtype");
            }
        }
    }
}
