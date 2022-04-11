/** 
 * Encapsulate a data structure: a Map, of Maps, each holding a list. This is what
 * you get when crusty barely reformed Perl programmers write JavaScript. And I'm
 * not even sorry.
 */
 export default class MapMapList {
    data;

    constructor() {
        this.data = new Map();
    }

    push(outerKey, innerKey, item) {

        if (!this.data.has(outerKey)) {
            this.data.set(outerKey, new Map());
        }        

        if (!this.data.get(outerKey).has(innerKey)) {
            this.data.get(outerKey).set(innerKey, []);
        }

        this.data.get(outerKey).get(innerKey).push(item)
    }

    getOuterKeys() {
        return this.data.keys();
    }

    getInnerMap(outerKey) {
        // probably shouldn't leak the inner data structure but meh
        return this.data.get(outerKey);
    }
 }