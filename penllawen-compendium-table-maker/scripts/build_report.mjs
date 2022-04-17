/** 
 * blah
 */
 export default class BuildReport {
    constructor() {
        this.data = [];
    }

    addHeading(i18nName, i18nData) {
        this.data.push("<h2>");
        this.data.push(game.i18n.format(i18nName, i18nData));        
        this.data.push("</h2>");
    }

    startSection() {
        this.data.push("<ul>");
    }

    endSection() {
        this.data.push("</ul>");
    }

    addEntry(i18nName, i18nData) {
        this.data.push("<li>");
        this.data.push(game.i18n.format(i18nName, i18nData));
        this.data.push("</li>");
    }

    addError(i18nName, i18nData) {
        // TODO: different formatting?
        this.data.push("<li><strong>");
        this.data.push(game.i18n.format(i18nName, i18nData));
        this.data.push("</strong></li>");
    }
    
    show() {
        // TODO localisaton
        new Dialog({
            title: 'Compendium Table Maker build report',
            content: this.data.join("\n"),
            buttons: {
                submit: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "OK"//,
                    // callback: (html) => { }
                },
        
            }
        }).render(true);
    }

 }