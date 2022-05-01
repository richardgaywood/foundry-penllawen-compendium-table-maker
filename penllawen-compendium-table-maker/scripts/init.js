console.log("CTM | Loading init.js");

export const MODULE_NAME = "penllawen-compendium-table-maker";

import api from "./api.js";

Hooks.on("init", function() {
  console.log("PCTM | init-ing " + MODULE_NAME);    

  new api();

  Handlebars.registerHelper("PCTMValueOrEmDash", function(value) {
    if (!value || value === "0") { return "—"; }
    else { return value; }
  });

  Handlebars.registerHelper("PCTMValueOrEmDashWithLeadingSign", function(value) {
    const result = parseInt(value);
    if (isNaN(result) || result === 0) return "—";
    return result.signedString();    
  });
});

Hooks.on("ready", function() {
  console.log("PCTM | ready");
});
