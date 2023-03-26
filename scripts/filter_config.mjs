
/** 
 * Stores filter data as a 2d array of strings: a 'category', and within
 * each category, a list of 'things'.
 * 
 * Also has a 'polarity' mode: can be include or exclude. Flips the logic
 * in shouldKeep().
 */
export class FilterConfig {
    static POLARITY_UNSET = 0;
    static POLARITY_INCLUDE = 1;
    static POLARITY_EXCLUDE = 2;

    constructor() {
        this.filterData = new Map();
        this.packageName = "";
        this.filterMode = FilterConfig.POLARITY_UNSET;
    }

    setCurrentPackage(packageName) {
        this.packageName = packageName;
    }

    setMode(newMode) {
        if (this.filterMode === FilterConfig.POLARITY_UNSET) {
            this.filterMode = newMode;
            return true;
        }
        if (this.filterMode === newMode) {
            return true;
        }
        // cannot switch mode once it has been selected; so fail
        ui.notifications.error(game.i18n.format("PCTM.FilterIncludeExcludeError"));
        // TODO: This exception won't currently be caught, I need to figure that out.
        throw new Error(game.i18n.format("PCTM.FilterIncludeExcludeError"));
    }

    addFilterThingToCurrentCategory(thing) {
        if (!this.filterData.has(this.packageName)) {
            this.filterData.set(this.packageName, []);
        }         
        this.filterData.get(this.packageName).push(thing);

        console.log(this);
    }

    // Return true if it should be kept, false if it should be
    // removed
    filter(packageName, thing) {
        switch (this.filterMode) {
            case FilterConfig.POLARITY_UNSET:
                return true;
            case FilterConfig.POLARITY_EXCLUDE:  
                return !this.#thingIsInFilter(packageName, thing);
            case FilterConfig.POLARITY_INCLUDE:
                return this.#thingIsInFilter(packageName, thing);
            default:
                return true;
        }
    }

    #thingIsInFilter(packageName, thing) {
        // TODO: should this be case insensitive?
        if (!this.filterData.has(packageName)) {
            return false;
        }

        for 


        if (this.filterData.get(packageName).includes(thing)) {
            return true;
        }
        return false;
    }
}

/** A set of FilterConfigs that all act together. */
export class FilterSet {
    static FILTER_TYPE_NAME = "typeName";
    static FILTER_ITEM_NAME = "itemName";
    static FILTER_CATEGORY_NAME = "category";

    constructor(compendiumSummariserConfig) {
        this.compendiumSummariserConfig = compendiumSummariserConfig;

        this.filters = new Map([
            [FilterSet.FILTER_TYPE_NAME, new FilterConfig()],
            [FilterSet.FILTER_ITEM_NAME, new FilterConfig()],
            [FilterSet.FILTER_CATEGORY_NAME, new FilterConfig()],
        ]);
    }

    setCurrentPackage(packageName) {
        this.filters.get(FilterSet.FILTER_TYPE_NAME).setCurrentPackage(packageName);
        this.filters.get(FilterSet.FILTER_ITEM_NAME).setCurrentPackage(packageName);
        this.filters.get(FilterSet.FILTER_CATEGORY_NAME).setCurrentPackage(packageName);
    }
    
    addFilterEntry(filterType, filterPolarity, filterEntry) {
        this.filters.get(filterType).setMode(filterPolarity);
        this.filters.get(filterType).addFilterThingToCurrentCategory(filterEntry);
    }

    filter(filterType, thing, packageName) {
        console.log("Filtering for", filterType, thing, packageName, 
            "outcome:", this.filters.get(filterType).filter(packageName, thing));
        return this.filters.get(filterType).filter(packageName, thing);
    }
}
