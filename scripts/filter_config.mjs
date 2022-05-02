
/** 
 * Stores filter data as a 2d array of strings: a 'category', and within
 * each category, a list of 'things'.
 */
export default class FilterConfig {

    constructor() {
        this.filterData = new Map();
        this.currentCategory = "";
    }

    setCurrentCategory(category) {
        this.currentCategory = category;
    }

    addFilterThingToCurrentCategory(thing) {
        if (!this.filterData.has(this.currentCategory)) {
            this.filterData.set(this.currentCategory, []);
        }         
        this.filterData.get(this.currentCategory).push(thing);
    }

    shouldFilter(category, thing) {
        // TODO: should this be case insensitive?
        if (!this.filterData.has(category)) {
            return false;
        }
        if (this.filterData.get(category).includes(thing)) {
            return true;
        }
        return false;
    }
}