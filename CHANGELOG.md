### v1.4.1 (2023-08-19)

* Fix a bug that causes a crash if you don't have Compendium Folders installed (as CF is no longer required for SWADE)
* Test for and update to Foundry v11 compatibility

### v1.4.0 (2023-03-26)

* Switch to proper Foundry tooltips and remove my awful hacky CSS; much (much!) better UX.
* Totally rewrote the item filtering methods; it now offers three types of filter (item name, item type, and item category) and the ability to defined include or exclude filters. YOU WILL NEED TO UPDATE YOUR OLD MACROS, please see README for details of the new methods to call.
* Switched item filtering to be a locale-aware case-insensitive string comparison; it should be less brittle now.

### v1.3.1 (2023-03-19)

* Attempt to fix null-check issue when rendering items with no description field (see issue #6)

### v1.3.0 (2023-02-11)

* Add support for SWADE's "ability" item type, including racial, archetypal, and special abilities. (Thanks for the FR loofou!) [#3]

### v1.2.0 (2023-02-05)
* Add the ability to rename categories (allows you fix merges across Compendiums; see README.md)
* Fix some bugs with item name filtering & refresh the examples in the README
* Add category filtering to remove whole groups of things from the Compendium (see README)

### v1.1.1 (2023-02-04)
* Fix sorting of categories, which was broken (thanks Nolt!)

### v1.1.0 (2023-01-29)

* Fix missing item details in popup/hover text box (thanks Nolt!)
* Add support for sorting & grouping contents by SWADE's "category" item field (thanks for the suggestion Nolt!)

### v1.0.0 (2023-01-27)

The "I can't believe it's not dead" release.

* Fixed to work under Foundry v10. (Long overdue, I know.)
* Added support for Foundry v10's new multi-page journals -- see the docs for some small changes you need to make to your scripts.
* Removed support for overwriting journals in the name of reducing code complexity (if you're mad about that, shout, I could re-add it).
* Removed support for CompendiumFolder support - it was broken in v10 and I haven't figured out why/how yet. This code was always dodgy (it has to examine CF internal data structures) so I might not bring this back.
* Fixed a bug where compendiums in the world (as opposed to in a module) would have the incorrect path generated, resulting in broken links in the generated journal
* Added support for SWADE's new (well, new-ish) "consumable" item type
* Removed the example macros compendium (which I suspect just cluttered up everyone's worlds), and moved the example macros into the README file instead (which also means I only need to keep one copy up to date when I change the module.)

### v0.0.5 (2022-05-07)

* Add some padding at the bottom of the JournalEntry to work around some CSS wonkiness I don't
  know how to fix in any other way (thanks for the bug report Nolt!)
* Added a new option `disableCompendiumFolderGrouping()` that outputs everything in a table in alphabetical
  order instead of grouped by the name of the Compendium Folder they are in. (Feature request from Devilduck!)
* Fix the "Deadlands Edges" example macro, which was somehow totally broken (thanks for the bug report
  thorgibrewer!)

### v0.0.4 (2022-05-02)

Initial public release.