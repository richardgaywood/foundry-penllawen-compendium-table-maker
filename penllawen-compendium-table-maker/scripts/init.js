console.log("CTM | Loading init.js");

export const MODULE_NAME = "penllawen-compendium-table-maker";

import api from "./api.js";

Hooks.on("init", function() {
//	window.SprawlrunnersExtras = SprawlrunnersExtras();
  console.log("CTM | init-ing " + MODULE_NAME);    

  new api();
});


Hooks.on("ready", function() {
  console.log("CTM | ready");
});


