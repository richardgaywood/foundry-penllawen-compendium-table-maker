/** 
 * blah
 */
 export default class BuildReport {
    constructor() {
        this.data = [];
        this.isInSection = false;
    }

    addHeading(i18nName, i18nData) {
        this.#endSectionIfNecessary();

        this.data.push("<h2>");
        this.data.push(game.i18n.format(i18nName, i18nData));        
        this.data.push("</h2>");
    }

    addError(i18nName, i18nData) {
        this.#endSectionIfNecessary();

        // TODO: different formatting?
        this.data.push("<p><strong>");
        this.data.push(game.i18n.format(i18nName, i18nData));
        this.data.push("</strong></p>");
    }

    addFatalError() {
        this.addError("PCTM.BuildReportFatalError", {});
    }

    addEntry(i18nName, i18nData) {
        this.#startSectionIfNecessary();
        this.data.push("<li>");
        this.data.push(game.i18n.format(i18nName, i18nData));
        this.data.push("</li>");
    }

    #startSectionIfNecessary() {
        if (!this.isInSection) {
            this.data.push("<ul>");
            this.isInSection = true;
        }
    }

    #endSectionIfNecessary() {
        if (this.isInSection) {
            this.data.push("</ul>");
            this.isInSection = false;
        }
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