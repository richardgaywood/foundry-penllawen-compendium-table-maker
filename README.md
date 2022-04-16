# Compendium summariser

blah blah hello world blah

## How to use the module

The module currently has no UI and can only be used by writing macros.

**Wait, wtf, why?** Because this is a surprisingly difficult thing to write a UI for (there's a lot of overlapping options) and I quite honestly do not have time right now. I think the macro interface is good enough for a first release. I might revisit this decision in the future, but I am not making any promises. If you feel strongly that there should be a UI, this can be communicated to me in the form of pull requests ;)



### The basics

Create a new macro and change the type to `script`. Then enter the following code:

```javascript
var s = game.modules.get("penllawen-compendium-table-maker").api.getCompendiumSummariser();

await s.createOutputJournalNamed("SWADE Edges")
  .addInputCompendium("swade-core-rules.swade-edges")
  .write();

s.showReport();
```

This will compile the SWADE core rules compendium of all Edges into a single JournalEntry called "SWADE Edges". Obviously, you can change the name of the output journal and the input Compendium as you please. Note that you need the full "pack name" of the Compendium, in other words `swade-core-rules.swade-edges` and not just `swade-edges`. 

`showReport()` at the end is optional but recommended. It'll pop up a litle dialog telling you what the module did.

Each time you run this script, it'll make a whole new JournalEntry, which will be in the world (ie. not inside a Compendium.) You can move it afterwards to wherever you like. Used like this, the module will never overwrite any data in any existing Journal.

### Combining multiple Compendiums into a single JournalEntry

To do this, just add more `addInputCompendium(...)` lines:

```javascript
var s = game.modules.get("penllawen-compendium-table-maker").api.getCompendiumSummariser();

await s.createOutputJournalNamed("Deadlands Edges")
  .addInputCompendium("deadlands-core-rules.deadlands-edges")
  .addInputCompendium("swade-core-rules.swade-edges")
  .write();  

s.showReport();
```

You can add as many as you'd like of these.

### Filtering items by name

Sometimes you want to say "take all of the items in this compendium except a few special ones." For example, in the Sprawlrunners setting, quite a few Edges from the core book are not available. You can do this like so:

```javascript
var s = game.modules.get("penllawen-compendium-table-maker").api.getCompendiumSummariser();

await s.createOutputJournalNamed("Sprawlrunners Edges")
  .addInputCompendium("sprawl-core-rules.sprawlrunner-edges")
  .addInputCompendium("swade-core-rules.swade-edges")
    .addItemNameFilter("Arcane Background (Gifted)")  
    .addItemNameFilter("Arcane Background (Magic)")  
    .addItemNameFilter("Arcane Background (Miracles)")  
    .addItemNameFilter("Arcane Background (Psionics)")  
    .addItemNameFilter("Arcane Background (Weird Science)")  
    .addItemNameFilter("Aristocrat")  
    .addItemNameFilter("Rich")
    .addItemNameFilter("Filthy Rich")
    .addItemNameFilter("Artificer")
    .addItemNameFilter("Channeling")
    .addItemNameFilter("Concentration")
    .addItemNameFilter("Extra Effort")
    .addItemNameFilter("Gadgeteer")
    .addItemNameFilter("Holy/Unholy Warrior")
    .addItemNameFilter("Improved Rapid Recharge")
    .addItemNameFilter("Mentalist")
    .addItemNameFilter("Power Points")
    .addItemNameFilter("Power Surge")
    .addItemNameFilter("Rapid Recharge")
    .addItemNameFilter("Soul Drain")
    .addItemNameFilter("Wizard")
  .write();

s.showReport();
```

### Filtering items by type

Some of my houserule compendiums have gear of different types next to each other, for example I have guns and their ammunition in the same compendium. By default, this will produce a single JournalEntry with two tables in it - one for the weapons, one for the ammunition and other gear items. I can change this behaviour by adding a filter on item type:

```javascript
var s = game.modules.get("penllawen-compendium-table-maker").api.getCompendiumSummariser();

await s.createOutputJournalNamed("Houserule weapons")
  .addInputCompendium("penllawen-sprawlrunners-extras.weapons")
      .addTypeNameFilter("gear")
  .write();

await s.createOutputJournalNamed("Houserule ammo & gear")
  .addInputCompendium("penllawen-sprawlrunners-extras.weapons")
      .addTypeNameFilter("weapons")
  .write();

s.showReport();
```

Now I will get two Journals. One will contain only the weapons, the other only the gear.


## Extended example: Deadlands Edges & Hindrances

You can find this example in the Macros compendium included with the module.

```javascript
var s = game.modules.get("penllawen-compendium-table-maker").api.getCompendiumSummariser();

await s.createOutputJournalNamed("Deadlands Edges")
  .addInputCompendium("deadlands-core-rules.deadlands-edges")
  .addInputCompendium("swade-core-rules.swade-edges")
    .addItemNameFilter("Arcane Background (Gifted)")  
    .addItemNameFilter("Arcane Background (Magic)")  
    .addItemNameFilter("Arcane Background (Miracles)")  
    .addItemNameFilter("Arcane Background (Psionics)")  
    .addItemNameFilter("Arcane Background (Weird Science)")  
    .addItemNameFilter("Soul Drain")  
  .write();

await s.createOutputJournalNamed("Deadlands Hindrances")
  .addInputCompendium("deadlands-core-rules.deadlands-hindrances")
  .addInputCompendium("swade-core-rules.swade-hindrances")
  .write();

s.showReport();
```