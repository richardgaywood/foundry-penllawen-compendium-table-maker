
/** 
 * Stores filter data as a 2d array of strings: a 'category', and within
 * each category, a list of 'things'.
 */
export default class FilterConfig {

    constructor() {
        this.filterData = new Map();
        this.packageName = "";
    }

    setCurrentPackage(packageName) {
        this.packageName = packageName;
    }

    addFilterThingToCurrentCategory(thing) {
        if (!this.filterData.has(this.package)) {
            this.filterData.set(this.package, []);
        }         
        this.filterData.get(this.package).push(thing);
    }

    shouldFilter(packageName, thing) {
        // TODO: should this be case insensitive?
        if (!this.filterData.has(packageName)) {
            return false;
        }
        if (this.filterData.get(packageName).includes(thing)) {
            return true;
        }
        return false;
    }
}