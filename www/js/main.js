/**
 * Flowey's Time Machine - UNDERTALE SAVE Editor.
 * @author KockaAdmiralac
 * @author crumblingstatue
 */

/**
 * For reporting errors.
 * @author KockaAdmiralac
 */
window.onerror = function(error, file, line, column)
{
    alert("Error occurred!\nPlease, report this issue with following information : " +
    "\nERR : " + error +
    "\nL&C : " + line + ":" + column +
    "\n\n    Sorry for inconveniences!");
};

/**
 * Local variables
 */
var currLoading = 0, cellOpts, weapons, armors, rooms, items, states, ini,
saveLines, presets, currTab, fs = nw.require('fs'), dataLoaded,
undertaleDir = nw.process.env.LOCALAPPDATA.replace(/\\/g, "/") + "/UNDERTALE/";

/**
 * Used for loading files.
 * @method
 * @param {string} file - Path to file to load.
 * @param {function} callback - Function that will be called after loading completed.
 * @author KockaAdmiralac
 */
function loadFile(file, callback)
{
    "use strict";
    var req = new XMLHttpRequest();
    req.error = function() { alert("Error happened while loading file!"); };
    req.onreadystatechange = function() { if(req.readyState === 4) callback.call(window, req.response); };
    req.open("GET", file, true);
    req.send();
}

/**
 * Saves file to specified place.
 * @method
 * @param {String} file - Path where to save the file.
 * @param {String} text - Text to write in the file.
 * @param {function} callback - Function that will be called upon file saving.
 * @returns {Boolean} If file saving was successful
 */
function saveFile(file, text, callback)
{
    "use strict";
    try
    {
        fs.writeFile(file, text, function(err) { if(!err) callback.call(window); });
        return true;
    }
    catch(e)
    {
        alert("Error happened while writing to file!");
        return false;
    }
}

/**
 * Copies one file from one location to another
 * @method
 * @param {String} source - Path to file that should be copied
 * @param {String} dest - Path to where file should be copied
 * @param {function} callback - Function that will be called upon copying.
 * @param {function} err - Function that will be called upon error happening.
 * @author KockaAdmiralac
 */
function copyFile(source, dest, callback, err)
{
    "use strict";
    var read = fs.createReadStream(source);
    var write = fs.createWriteStream(dest);
    read.on("error", function()
    {
        alert("Error while reading file.");
        err.call(this);
    });
    write.on("error", function()
    {
        alert("Error while writing to file.");
        err.call(this);
    });
    write.on("close", function(){ callback.call(this); });
    read.pipe(write);
}

/**
 * Saves data safely.
 * @method
 * @param {String} filename - Path to file
 * @param {String} string - Data to save to the file.
 * @author KockaAdmiralac
 */
function secureDataSave(filename, string)
{
    "use strict";
    copyFile(filename, filename + ".bak", // Backups the file before saving...
    function()
    {
        if(!saveFile(filename, string, function(){}))
        {
            // If save is unsuccessful, restore backup
            fs.unlink(filename);
            copyFile(filename, filename + ".bak",
            function() { alert("Error while saving INI file!\nDon't worry, your data is safe :)"); },
            function() { alert("FATAL ERROR OCCURRED!\nLook at help on help how to manually restore your backup."); });
        }
    },
    function() { alert("Backuping data failed! File won't be saved."); });
}

/**
 * Used for loading data files.
 * @method
 * @param {string} file - Path to file to load.
 * @param {string} obj - Variable in which data will be stored after loading.
 * @author KockaAdmiralac
 */
function loadJSONFile(file, obj)
{
    "use strict";
    ++ currLoading;
    loadFile("/www/data/" + file + ".json", function(json)
    {
        this[obj] = JSON.parse(json);
        if(-- currLoading === 0) onLoaded();
    });
}

/**
 * Parses INI text into object.
 * @method
 * @param {string} text - Text from which to parse.
 * @returns {Object} Parsed object
 * @author crumblingstatue
 */
function parseIniFromText(text)
{
    "use strict";
    var lines = text.match(/[^\r\n]+/g);
    var section = null;
    var tmpini = {};
    lines.forEach(function(line)
    {
        // Ignore empty lines
        if (line === "") return;
        // If line starts with [, it is a section header
        var lbracket = line.indexOf("[");
        if (lbracket !== -1)
        {
            var rbracket = line.slice(lbracket).indexOf("]") + lbracket;
            if (rbracket !== -1)
            {
                section = line.slice(lbracket + 1, rbracket);
                tmpini[section] = {};
            }
        }
        // Otherwise, it is assumed to be an assignment
        else
        {
            if (section === null) throw "Assignment outside of a section";
            var eq = line.indexOf("=");
            if (eq === -1) throw "Expected '='";
            var lquot = line.indexOf('"');
            if (lquot === -1) throw "Expected '\"'";
            var rquot = line.slice(lquot + 1).indexOf('"') + lquot + 1;
            if (rquot === -1) throw "Unterminated value string";
            var value = line.slice(lquot + 1, rquot);
            var key = line.slice(0, eq);
            tmpini[section][key] = value;
        }
    });
    return tmpini;
}

/**
 * Plays Flowey's laughter
 * @method
 * @author crumblingstatue
 */
function floweyLaughOnce()
{
    "use strict";
    id.floweyimg.src = "/www/img/flowey_evil.png";
    id.audio.play();
}

/**
 * Inserts items from array to dropdown box.
 * @method
 * @param {String} node - iD of HTML element where to insert elements
 * @param {Number} i - Initial value
 * @param {Array} array - Array of items to insert
 * @author crumblingstatue
 * @todo Optimizations...
 */
function insert(node, i, array)
{
    "use strict";
    var newOption = document.createElement("option");
    newOption.setAttribute("value", i);
    var newContent = document.createTextNode(array[i]);
    newOption.appendChild(newContent);
    node.appendChild(newOption);
}

/**
 * Inserts data about items in dropdown boxes.
 * @method
 * @author crumblingstatue
 */
function insertInvLists()
{
    "use strict";
    for (var i = 0; i < items.length; ++i)
    {
        for (var j = 1; j <= 8; ++j) insert(id.sav.invslot[j], i, items);
        insert(id.sav.weapon, i, items);
        insert(id.sav.armor, i, items);
    }
}

/**
 * Method used for inserting inventory items from array.
 * @method
 * @author crumblingstatue
 */
function insertCellLists()
{
    "use strict";
    for (var i = 1; i <= 8; i++) loadSelectFromObj(id.sav.cellslot[i], cellOpts);
}

/**
 * Inserts object elements into dropdown box.
 * @method
 * @param {String} selectId - iD of HTML element in which to insert items.
 * @param {Object} obj - Object from which to insert items.
 * @author crumblingstatue
 */
function loadSelectFromObj(selectId, obj)
{
    "use strict";
    for (var key in obj) if(obj.hasOwnProperty(key)) insert(selectId, key, obj);
}

/**
 * Update the persistent data form from an ini object.
 * @method
 * @author crumblingstatue
 */
function updatePersistentDataForm()
{
    "use strict";
    var hasFun = ini.General.Fun !== undefined;
    id.ini.name.value = ini.General.Name;
    id.ini.location.value = parseInt(ini.General.Room.trim());
    id.ini.kills.value = parseInt(ini.General.Kills.trim());
    id.ini.love.value = parseInt(ini.General.Love.trim());
    id.ini.fun.checked = hasFun;
    id.ini.fun.value.value = parseInt(ini.General[hasFun ? "Fun" : "fun"]);
    updateFunForm();
    if (ini.FFFFF)
    {
        if (ini.FFFFF.F) id.ini.omegaFlowey.trapped.checked = (parseInt(ini.FFFFF.F.trim()) === 1);
        if (ini.FFFFF.P) id.ini.omegaFlowey.battleInit.checked = (parseInt(ini.FFFFF.P.trim()) === 1);
        if (ini.FFFFF.D) id.ini.omegaFlowey.deaths.value = parseInt(ini.FFFFF.D.trim());
    }
    else id.ini.omegaFlowey.trapped.checked = false;
}

/**
 * Update an ini object from the persistent data form.
 * @method
 * @author crumblingstatue
 */
function updateIniFromForm()
{
    "use strict";
    var ini = window.ini;
    ini.General.Name = id.ini.name.value;
    ini.General.Room = id.ini.location.value;
    ini.General.Kills = id.ini.kills.value;
    ini.General.Love = id.ini.love.value;
    if (id.ini.omegaFlowey.trapped.checked)
    {
        if (!ini.FFFFF) ini.FFFFF = {};
        ini.FFFFF.F = "1";
    }
    else if (ini.FFFFF) ini.FFFFF.F = "0";
    if (id.ini.omegaFlowey.battleInit.checked)
    {
        if (!ini.FFFFF) ini.FFFFF = {};
        ini.FFFFF.P = "1";
    }
    else if (ini.FFFFF) ini.FFFFF.P = "0";
    var timesDied = parseInt(id.ini.omegaFlowey.deaths.value);
    if (timesDied)
    {
        if(!ini.FFFFFF) ini.FFFFF = {};
        else ini.FFFFF.D = timesDied;
    }
    if(id.ini.fun.check.checked)
    {
        var funValue = parseInt(id.ini.fun.value.value);
        if(funValue)
        {
            ini.General.Fun = funValue;
            delete ini.General.fun;
        }
    }
}

/**
 * Update dropdown box selection from array of values.
 * @method
 * @param {String} id - iD of HTML dropdown box which selection will be updated
 * @param {Array} values - Array of values in save file
 * @param {Number} index - Index of save file line from which to take value from
 * @param {Array} list - Array from which to look up the data
 * @author crumblingstatue
 */
function updateSelection(id, values, index, list)
{
    "use strict";
    var value = parseInt(values[index].trim());
    if (list[value]) id.value = value;
    else window.alert("Unknown value '" + value + "' for line " + (index + 1) + " (" + id + ").\n" + "If you think this is a valid value, report an issue at https://github.com/KockaAdmiralac/FloweysTimeMachine/issues");
}

/**
 * Update the save data form from an array of values.
 * @method
 * @author crumblingstatue
 */
function updateSaveDataForm()
{
    "use strict";
    var values = saveLines;
    id.sav.name.value       = values[0];
    id.sav.love.value       = values[1];
    id.sav.hp.value         = values[2];
    id.sav.at.value         = values[4];
    id.sav.kills.value      = values[11];
    id.sav.weaponat.value   = values[5];
    id.sav.df.value         = values[6];
    id.sav.armordf.value    = values[7];
    id.sav.exp.value        = values[9];
    id.sav.gold.value       = values[10];
    for (var i = 0; i < 8; i++)
    {
        updateSelection(id.sav.invslot[i + 1], values, 12 + (i * 2), window.items);
        updateSelection(id.sav.cellslot[i + 1], values, 13 + (i * 2), window.cellOpts);
    }
    updateSelection(id.sav.weapon, values, 28, window.items);
    updateSelection(id.sav.armor, values, 29, window.items);
    updateSelection(id.sav.state.trainingdummy, values, 44, window.states.trainingDummy);
    updateSelection(id.sav.state.toriel, values, 75, window.states.toriel);
    updateSelection(id.sav.state.doggo, values, 82, window.states.doggo);
    updateSelection(id.sav.state.dogamydogaressa, values, 83, window.states.dogamyDogaressa);
    updateSelection(id.sav.state.greaterdog, values, 84, window.states.greaterDog);
    updateSelection(id.sav.state.comedian, values, 87, window.states.comedian);
    updateSelection(id.sav.state.papyrus, values, 97, window.states.papyrus);
    updateSelection(id.sav.state.shyren, values, 111, window.states.shyren);
    updateSelection(id.sav.state.undyne1, values, 281, window.states.undyne1);
    updateSelection(id.sav.state.maddummy, values, 282, window.states.madDummy);
    updateSelection(id.sav.state.undyne2, values, 380, window.states.undyne2);
    updateSelection(id.sav.state.muffet, values, 427, window.states.muffet);
    updateSelection(id.sav.state.broguards, values, 432, window.states.broGuards);
    updateSelection(id.sav.state.mettaton, values, 455, window.states.mettaton);
    id.sav.unkkills.value = values[231];
    id.sav.kill.dungeon.value = values[232];
    id.sav.kill.snowdin.value = values[233];
    id.sav.kill.hotland.value = values[235];
    id.sav.kill.waterfall.value = values[234];
    id.sav.exitedtruelab.checked = (parseInt(values[523].trim()) === 12);
    id.sav.havecell.checked = (parseInt(values[545].trim()) === 1);
    id.sav.location.value = parseInt(values[547].trim());
}

/**
 * Update an array of values from the save data form.
 * @method
 * @param {Array} values - Array that will be updated
 * @author crumblingstatue
 */
function updateSaveValuesFromForm()
{
    "use strict";
    saveLines[0] = id.sav.name.value;
    saveLines[1] = id.sav.love.value;
    saveLines[2] = id.sav.hp.value;
    saveLines[4] = id.sav.at.value;
    saveLines[5] = id.sav.weaponat.value;
    saveLines[6] = id.sav.df.value;
    saveLines[7] = id.sav.armordf.value;
    saveLines[9] = id.sav.exp.value;
    saveLines[10] = id.sav.gold.value;
    saveLines[11] = id.sav.kills.value;
    for(var i = 0; i < 8; ++i)
    {
        saveLines[12 + i * 2] = id.sav.invslot[i + 1].value;
        saveLines[12 + i * 2 + 1] = id.sav.cellslot[i + 1].value
    }
    saveLines[28] = id.sav.weapon.value;
    saveLines[29] = id.sav.armor.value;
    saveLines[35] = id.ini.fun.value.value;
    saveLines[44] = id.sav.state.trainingdummy.value;
    saveLines[75] = id.sav.state.toriel.value;
    saveLines[82] = id.sav.state.doggo.value;
    saveLines[83] = id.sav.state.dogamydogaressa.value;
    saveLines[84] = id.sav.state.greaterdog.value;
    saveLines[87] = id.sav.state.comedian.value;
    saveLines[97] = id.sav.state.papyrus.value;
    saveLines[111] = id.sav.state.shyren.value;
    saveLines[231] = id.sav.unkkills.value;
    saveLines[232] = id.sav.kill.dungeon.value;
    saveLines[233] = id.sav.kill.snowdin.value;
    saveLines[234] = id.sav.kill.waterfall.value;
    saveLines[235] = id.sav.kill.hotland.value;
    saveLines[281] = id.sav.state.undyne1.value;
    saveLines[282] = id.sav.state.maddummy.value;
    saveLines[380] = id.sav.state.undyne2.value;
    saveLines[427] = id.sav.state.muffet.value;
    saveLines[432] = id.sav.state.broguards.value;
    saveLines[455] = id.sav.state.mettaton.value;
    saveLines[523] = id.sav.exitedtruelab.checked ? "12" : "0";
    saveLines[545] = id.sav.havecell.checked ? "1" : "0";
    saveLines[547] = id.sav.location.value;
}

function updateFunForm()
{
    var checked = id.ini.fun.check.checked;
    id.ini.fun.value.style.display = checked ? "block" : "none";
    id.ini.fun.label.style.display = checked ? "block" : "none";
}

/**
 * Saves INI data to file.
 * @method
 * @param {Object} ini - INI data to save.
 * @author crumblingstatue
 */
function saveIniToFile()
{
    "use strict";
    var string = "";
    for (var section in ini) if(ini.hasOwnProperty(section))
    {
        string += "[" + section + "]\r\n";
        var sect = ini[section];
        for (var key in sect) if(sect.hasOwnProperty(key)) string += key + "=\"" + sect[key] + "\"\r\n";
    }
    secureDataSave(undertaleDir + "undertale.ini", string);
    floweyLaughOnce();
}

/**
 * Save SAVE values to file.
 * @method
 * @param {Array} values - Values that will be saved to file.
 * @author crumblingstatue
 */
function saveSaveValuesToFile(values)
{
    "use strict";
    var string = "";
    for(var i = 0; i < saveLines.length; ++i)
    {
        var item = saveLines[i];
        string += item.trim() + ((item.indexOf("\n") > -1) ? "" : "\r\n");
    }
    secureDataSave(undertaleDir + "file0", string);
    floweyLaughOnce();
}

/**
 * Checks if system_information_96X file exists.
 * @method
 * @param {Number} i - Represents X in system_information_96X
 * @returns {Boolean} Does system_information_96X exist.
 * @author KockaAdmiralac
 */
function systemInformationExists(i)
{
    "use strict";
    try { return fs.lstatSync(undertaleDir + "system_information_96" + i).isFile(); }
    catch (e) { return false; }
}

/**
 * Loads the preset selection dropdown box items.
 * @method
 * @author crumblingstatue
 */
function initPresetSelect()
{
    "use strict";
    for (var k in presets) if(presets.hasOwnProperty(k)) insert(id.preset.builtin.select, Object.keys(presets).indexOf(k), Object.keys(presets));
}

/**
 * Initializes user preset dropdown box elements
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initUserPresetData()
{
    "use strict";
    var userPresets = localStorage.getItem("userPresets");
    if (userPresets === null) localStorage.setItem("userPresets", JSON.stringify({}));
    else
    {
        var pres = JSON.parse(userPresets);
        for (var key in pres) if(pres.hasOwnProperty(key)) insert(id.preset.user.select, key, pres);
    }
}

/**
 * Loads a preset.
 * @method
 * @param {String} name - Name of the preset
 * @author crumblingstatue
 */
function loadPreset(name)
{
    "use strict";
    var preset = window.presets[Object.keys(window.presets)[name]];
    window.ini = preset.ini;
    window.saveLines = preset.lines;
    updateSaveDataForm();
    updatePersistentDataForm();
}

/**
 * Saves user preset.
 * @method
 * @param {String} name - Name of the preset
 * @author crumblingstatue
 */
function saveUserPreset(name)
{
    "use strict";
    updateIniFromForm();
    updateSaveValuesFromForm(window.saveLines);
    var obj = {
        "ini": ini,
        "lines": window.saveLines,
    };
    var presets = JSON.parse(localStorage.getItem("userPresets"));
    presets[name] = obj;
    localStorage.setItem("userPresets",JSON.stringify(presets));
}

/**
 * Initializes button for creating system_information_96X files.
 * @method
 * @param {Number} i - Determines X in system_information_96X
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initSystemInformationSave(i)
{
    "use strict";
    id.si.save[i].addEventListener("click", function()
    {
        if(confirm("This will affect your game. Continue?")) saveFile(undertaleDir + "system_information_96" + i, "", function()
        {
            floweyLaughOnce();
            alert("System information file created!");
            id.si.delete[i].disabled = false;
        });
    }, false);
}

/**
 * Initializes button for deleting system_information_96X files.
 * @method
 * @param {Number} i - Determines X in system_information_96X
 * @author KockaAdmiralac
 */
function initSystemInformationDelete(i)
{
    "use strict";
    var button = id.si.delete[i];
    button.addEventListener('click', function()
    {
        if(confirm("This will affect your game. Continue?"))
        {
            try
            {
                fs.unlink(undertaleDir + "system_information_96" + i);
                alert("System information file deleted!");
                this.disabled = true;
            }
            catch(e) { alert("Error while deleting system information file occurred."); }
        }
    }, false);
    button.disabled = !systemInformationExists(i);
}

/**
 * Initializes save buttons for system_information_96X files.
 * @method
 * @param {Number} i - Determines X in system_information_96X
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initSystemInformation(i)
{
    "use strict";
    initSystemInformationSave(i);
    initSystemInformationDelete(i);
}

/**
 * Initializes dropdown boxes for weapons and armors.
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initWeaponArmor()
{
    "use strict";
    var weaponSelect = id.sav.weapon;
    var armorSelect = id.sav.armor;
    weaponSelect.onchange = function()
    {
        var at = weapons[weaponSelect.value];
        if (typeof at !== "undefined") id.sav.weaponat.value = at;
    };
    armorSelect.onchange = function()
    {
        var df = armors[armorSelect.value];
        if (typeof df !== "undefined") id.sav.armordf.value = df;
    };
}

/**
 * Initializes "New Preset" button
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initUserPresetNew()
{
    "use strict";
    id.preset.user.new.addEventListener("click", function()
    {
        var name = window.prompt("Enter the name for your new preset");
        if (name === null || name === "") window.alert("You did not enter a valid name, preset not created.");
        else
        {
            saveUserPreset(name);
            var presetSelect = id.preset.user.select;
            var option = document.createElement("option");
            var text = document.createTextNode(name);
            option.appendChild(text);
            presetSelect.appendChild(option);
            presetSelect.value = name;
            id.preset.user.load.disabled = false;
            id.preset.user.save.disabled = false;
            id.preset.user.delete.disabled = false;
        }
    }, false);
}

/**
 * Initializes "Save Preset" button
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initUserPresetSave()
{
    "use strict";
    id.preset.user.save.addEventListener("click", function()
    {
        var name = id.preset.user.select.value;
        if (name !== null && name !== "") saveUserPreset(name);
        else window.alert("You need to select a valid preset first!");
    }, false);
}

/**
 * Initializes "Load Preset" button.
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initUserPresetLoad()
{
    "use strict";
    id.preset.user.load.addEventListener("click", function()
    {
        var name = id.preset.user.select.value;
        if (name !== null && name !== "")
        {
            var item = localStorage.getItem("userPresets");
            var presets = JSON.parse(item);
            var obj = presets[name];
            window.ini = obj.ini;
            window.saveLines = obj.lines;
            updateSaveDataForm();
            updatePersistentDataForm();
        }
        else window.alert("You need to select a valid preset first!");
    }, false);
}

/**
 * Initializes "Delete Preset" button
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initUserPresetDelete()
{
    "use strict";
    id.preset.user.delete.addEventListener("click", function()
    {
        var selection = id.preset.user.select;
        var name = selection.value;
        var children = selection.childNodes;
        for (var i = 0; i < children.length; i++) if (children[i].value === name) selection.removeChild(children[i]);
        var item = localStorage.getItem("userPresets");
        var presets = JSON.parse(item);
        delete presets[name];
        localStorage.setItem("userPresets", JSON.stringify(presets));
        if (id.preset.user.select.value === "")
        {
            id.preset.user.load.disabled = true;
            id.preset.user.save.disabled = true;
            id.preset.user.delete.disabled = true;
        }
    }, false);
}

/**
 * Initializes "enabled" state for load, save and delete buttons.
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initUserPresetEnable()
{
    "use strict";
    if (id.preset.user.select.value !== "")
    {
        id.preset.user.load.disabled = false;
        id.preset.user.save.disabled = false;
        id.preset.user.delete.disabled = false;
    }
}

/**
 * Initializes everything related to user presets.
 * @method
 * @author KockaAdmiralac
 */
function initUserPresets()
{
    "use strict";
    initUserPresetData();
    initUserPresetNew();
    initUserPresetSave();
    initUserPresetLoad();
    initUserPresetDelete();
    initUserPresetEnable();
}

/**
 * Initializes "Load" button for built-in presets.
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initBuiltinPresetLoad()
{
    "use strict";
    id.preset.builtin.load.addEventListener("click", function()
    {
        var name = id.preset.builtin.select.value;
        loadPreset(name);
    }, false);
}

/**
 * Initializes state of Flowey's image.
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initFloweyImg()
{
    "use strict";
    if (localStorage.getItem("laughed") === "true") id.floweyimg.src = "/www/img/flowey_evil.png";
    id.floweyimg.addEventListener("click", function()
    {
        id.floweyimg.src = "/www/img/flowey_wink.png";
        localStorage.setItem("laughed", false);
    }, false);
}

/**
 * Initializes buttons in "Default INI" and "Default SAVE" sections
 * @method
 * @param {String} opt - Can be "ini" or "sav" depending on which section is being initialized
 * @author KockaAdmiralac
 */
function initDefaultControls(opt)
{
    "use strict";
    initDefaultLoad(opt);
    initDefaultSave(opt);
}

/**
 * Initializes "Load" button in "Default INI" and "Default SAVE" sections.
 * @method
 * @param {String} opt - Can be "ini" or "sav" depending on which section is being initialized
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initDefaultLoad(opt)
{
    "use strict";
    id.default.load[opt].addEventListener('click', function()
    {
        if(confirm("This will affect your game. Continue?"))
        {
            if(opt === "ini")
            {
                loadINI();
                updatePersistentDataForm();
            }
            else
            {
                loadSave();
                updateSaveDataForm();
            }
        }
    }, false);
}

/**
 * Initializes "Save" button in "Default INI" and "Default SAVE" sections.
 * @param {String} opt - Can be "ini" or "sav" depending on which section is being initialized
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initDefaultSave(opt)
{
    "use strict";
    id.default.save[opt].addEventListener('click', function()
    {
        if(confirm("This will affect your game. Continue?"))
        {
            if(opt === "ini")
            {
                updateIniFromForm();
                saveIniToFile();
            }
            else
            {
                updateSaveValuesFromForm();
                saveSaveValuesToFile();
            }
        }
    }, false);
}

function initFunCheckbox()
{
    id.ini.fun.check.addEventListener('click', function()
    {
        updateFunForm();
    }, false);
}

/**
 * Called when INI and SAVE files are loaded.
 * @method
 * @author KockaAdmiralac
 */
function onIniAndSaveLoaded()
{
    "use strict";
    ["sav", "ini"].forEach(function(opt) { initDefaultControls(opt); });
    initBuiltinPresetLoad();
    initPresetSelect();
    initUserPresets();
    initFunCheckbox();
    for(var i = 2; i < 4; ++i) initSystemInformation(i);
    initWeaponArmor();
    initFloweyImg();
}

/**
 * Loads a SAVE file.
 * @method
 * @author KockaAdmiralac
 */
function loadSave()
{
    "use strict";
    loadFile(undertaleDir + "file0", function(lists)
    {
        saveLines = lists.split("\n");
        updateSaveDataForm();
        if(-- currLoading === 0 && !dataLoaded)
        {
            dataLoaded = true;
            onIniAndSaveLoaded();
        }
    });
}

/**
 * Loads an INI file.
 * @method
 * @author KockaAdmiralac
 */
function loadINI()
{
    "use strict";
    loadFile(undertaleDir + "undertale.ini", function(text)
    {
        ini = parseIniFromText(text);
        updatePersistentDataForm();
        if(-- currLoading === 0 && !dataLoaded)
        {
            dataLoaded = true;
            onIniAndSaveLoaded();
        }
    });
}

/**
 * Called when dropdown box lists are populated.
 * @method
 * @author KockaAdmiralac
 */
function onListsCreated()
{
    "use strict";
    currLoading = 2;
    loadSave();
    loadINI();
}

/**
 * Initializes states of most HTML elements, like dropdown boxes
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function createLists()
{
    "use strict";
    loadSelectFromObj(id.sav.location, rooms);
    loadSelectFromObj(id.ini.location, rooms);
    Object.keys(states).forEach(function(state) { loadSelectFromObj(id.sav.state[state.toLowerCase()], states[state]); }, this);
    insertInvLists();
    insertCellLists();
    onListsCreated();
}

function createIDs()
{
    createID(window, ids, "");
}

function createID(obj, node, string)
{
    var name = node.name;
    obj[name] = {};
    if(name !== "id") string += "-";
    node.ids.forEach(function(id)
    {
        if(typeof id === "string") obj[name][id] = document.getElementById(string + id);
        else
        {
            obj[name][id.name] = {};
            createID(obj[name], id, string + id.name);
        }
    }, this);
}

/**
 * Called when data is loaded.
 * @method
 * @author KockaAdmiralac
 */
function onLoaded()
{
    "use strict";
    createIDs();
    showTab(3);
    createLists();
    onListsCreated();
}

/**
 * Shows the tab with specified iD
 * @method
 * @param {Number} id - iD of HTML div element that represents a tab that will be shown.
 * @author KockaAdmiralac
 */
function showTab(tabID)
{
    "use strict";
    if(currTab)id.tab[currTab].style.display = "none";
    id.tab[tabID].style.display = "block";
    currTab = tabID;
}

/**
 * Loads data from 'data' folder and puts it in local variables.
 * @method
 * @author KockaAdmiralac
 */
function loadData()
{
    "use strict";
    loadJSONFile("Rooms", "rooms");
    loadJSONFile("Weapons", "weapons");
    loadJSONFile("Items", "items");
    loadJSONFile("States", "states");
    loadJSONFile("Armors", "armors");
    loadJSONFile("Cell", "cellOpts");
    loadJSONFile("Presets", "presets");
    loadJSONFile("IDs", "ids")
}

/**
 * Called when DOM content of the page is loaded.
 * @method
 * @author KockaAdmiralac
 */
function start()
{
    "use strict";
    loadData();
}

document.addEventListener("DOMContentLoaded", start);
