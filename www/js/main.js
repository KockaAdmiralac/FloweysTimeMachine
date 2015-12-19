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
    document.getElementById("floweyimg").src = "/www/img/flowey_evil.png";
    var audio = document.getElementById("audio");
    audio.play();
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
    var select = document.getElementById(node);
    select.appendChild(newOption);
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
        for (var j = 1; j <= 8; ++j) insert("sav-invslot" + j, i, items);
        insert("sav-weapon", i, items);
        insert("sav-armor", i, items);
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
    for (var i = 1; i <= 8; i++) loadSelectFromObj("sav-cellslot" + i, cellOpts);
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
    document.getElementById("ini-name").value = ini.General.Name;
    document.getElementById("ini-location").value = parseInt(ini.General.Room.trim());
    document.getElementById("ini-kills").value = parseInt(ini.General.Kills.trim());
    document.getElementById("ini-love").value = parseInt(ini.General.Love.trim());
    document.getElementById("ini-fun").checked = (ini.General.Fun !== undefined);
    updateFunForm();
    if (ini.FFFFF)
    {
        if (ini.FFFFF.F) document.getElementById("ini-omega-flowey-trapped").checked = (parseInt(ini.FFFFF.F.trim()) === 1);
        if (ini.FFFFF.P) document.getElementById("ini-omega-flowey-battle-init").checked = (parseInt(ini.FFFFF.P.trim()) === 1);
        if (ini.FFFFF.D) document.getElementById("ini-omega-flowey-deaths").value = parseInt(ini.FFFFF.D.trim());
    }
    else document.getElementById("ini-omega-flowey-trapped").checked = false;
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
    ini.General.Name = document.getElementById("ini-name").value;
    ini.General.Room = document.getElementById("ini-location").value;
    ini.General.Kills = document.getElementById("ini-kills").value;
    ini.General.Love = document.getElementById("ini-love").value;
    if (document.getElementById("ini-omega-flowey-trapped").checked)
    {
        if (!ini.FFFFF) ini.FFFFF = {};
        ini.FFFFF.F = "1";
    }
    else if (ini.FFFFF) ini.FFFFF.F = "0";
    if (document.getElementById("ini-omega-flowey-battle-init").checked)
    {
        if (!ini.FFFFF) ini.FFFFF = {};
        ini.FFFFF.P = "1";
    }
    else if (ini.FFFFF) ini.FFFFF.P = "0";
    var timesDied = parseInt(document.getElementById("ini-omega-flowey-deaths").value);
    if (timesDied)
    {
        if(!ini.FFFFFF) ini.FFFFF = {};
        else ini.FFFFF.D = timesDied;
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
    if (list[value]) document.getElementById(id).value = value;
    else window.alert("Unknown value '" + value + "' for line " + (index + 1) + " (" + id + ").\n" + "If you think this is a valid value, report an issue at https://github.com/crumblingstatue/FloweysTimeMachine/issues");
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
    document.getElementById("sav-name").value = values[0];
    document.getElementById("sav-kills").value = values[11];
    document.getElementById("sav-love").value = values[1];
    document.getElementById("sav-hp").value = values[2];
    document.getElementById("sav-exp").value = values[9];
    document.getElementById("sav-gold").value = values[10];
    document.getElementById("sav-at").value = values[4];
    document.getElementById("sav-weaponat").value = values[5];
    document.getElementById("sav-df").value = values[6];
    document.getElementById("sav-armordf").value = values[7];
    for (var i = 0; i < 8; i++)
    {
        updateSelection("sav-invslot" + (i + 1), values, 12 + (i * 2), window.items);
        updateSelection("sav-cellslot" + (i + 1), values, 13 + (i * 2), window.cellOpts);
    }
    updateSelection("sav-weapon", values, 28, window.items);
    updateSelection("sav-armor", values, 29, window.items);
    updateSelection("sav-trainingdummystate", values, 44, window.states.trainingDummy);
    updateSelection("sav-torielstate", values, 75, window.states.toriel);
    updateSelection("sav-doggostate", values, 82, window.states.doggo);
    updateSelection("sav-dogamydogaressastate", values, 83, window.states.dogamyDogaressa);
    updateSelection("sav-greaterdogstate", values, 84, window.states.greaterDog);
    updateSelection("sav-comedianstate", values, 87, window.states.comedian);
    updateSelection("sav-papyrusstate", values, 97, window.states.papyrus);
    updateSelection("sav-shyrenstate", values, 111, window.states.shyren);
    document.getElementById("sav-unkkills").value = values[231];
    document.getElementById("sav-dungeonkills").value = values[232];
    document.getElementById("sav-snowdinkills").value = values[233];
    document.getElementById("sav-waterfallkills").value = values[234];
    document.getElementById("sav-hotlandkills").value = values[235];
    updateSelection("sav-undynestate1", values, 281, window.states.undyne1);
    updateSelection("sav-maddummystate", values, 282, window.states.madDummy);
    updateSelection("sav-undynestate2", values, 380, window.states.undyne2);
    updateSelection("sav-muffetstate", values, 427, window.states.muffet);
    updateSelection("sav-broguardsstate", values, 432, window.states.broGuards);
    updateSelection("sav-mettatonstate", values, 455, window.states.mettaton);
    document.getElementById("sav-exitedtruelab").checked = (parseInt(values[523].trim()) === 12);
    document.getElementById("sav-havecell").checked = (parseInt(values[545].trim()) === 1);
    document.getElementById("sav-location").value = parseInt(values[547].trim());
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
    saveLines[0] = document.getElementById("sav-name").value;
    saveLines[1] = document.getElementById("sav-love").value;
    saveLines[2] = document.getElementById("sav-hp").value;
    saveLines[4] = document.getElementById("sav-at").value;
    saveLines[5] = document.getElementById("sav-weaponat").value;
    saveLines[6] = document.getElementById("sav-df").value;
    saveLines[7] = document.getElementById("sav-armordf").value;
    saveLines[9] = document.getElementById("sav-exp").value;
    saveLines[10] = document.getElementById("sav-gold").value;
    saveLines[11] = document.getElementById("sav-kills").value;
    saveLines[12] = document.getElementById("sav-invslot1").value;
    saveLines[13] = document.getElementById("sav-cellslot1").value;
    saveLines[14] = document.getElementById("sav-invslot2").value;
    saveLines[15] = document.getElementById("sav-cellslot2").value;
    saveLines[16] = document.getElementById("sav-invslot3").value;
    saveLines[17] = document.getElementById("sav-cellslot3").value;
    saveLines[18] = document.getElementById("sav-invslot4").value;
    saveLines[19] = document.getElementById("sav-cellslot4").value;
    saveLines[20] = document.getElementById("sav-invslot5").value;
    saveLines[21] = document.getElementById("sav-cellslot5").value;
    saveLines[22] = document.getElementById("sav-invslot6").value;
    saveLines[23] = document.getElementById("sav-cellslot6").value;
    saveLines[24] = document.getElementById("sav-invslot7").value;
    saveLines[25] = document.getElementById("sav-cellslot7").value;
    saveLines[26] = document.getElementById("sav-invslot8").value;
    saveLines[27] = document.getElementById("sav-cellslot8").value;
    saveLines[28] = document.getElementById("sav-weapon").value;
    saveLines[29] = document.getElementById("sav-armor").value;
    saveLines[44] = document.getElementById("sav-trainingdummystate").value;
    saveLines[75] = document.getElementById("sav-torielstate").value;
    saveLines[82] = document.getElementById("sav-doggostate").value;
    saveLines[83] = document.getElementById("sav-dogamydogaressastate").value;
    saveLines[84] = document.getElementById("sav-greaterdogstate").value;
    saveLines[87] = document.getElementById("sav-comedianstate").value;
    saveLines[97] = document.getElementById("sav-papyrusstate").value;
    saveLines[111] = document.getElementById("sav-shyrenstate").value;
    saveLines[231] = document.getElementById("sav-unkkills").value;
    saveLines[232] = document.getElementById("sav-dungeonkills").value;
    saveLines[233] = document.getElementById("sav-snowdinkills").value;
    saveLines[234] = document.getElementById("sav-waterfallkills").value;
    saveLines[235] = document.getElementById("sav-hotlandkills").value;
    saveLines[281] = document.getElementById("sav-undynestate1").value;
    saveLines[282] = document.getElementById("sav-maddummystate").value;
    saveLines[380] = document.getElementById("sav-undynestate2").value;
    saveLines[427] = document.getElementById("sav-muffetstate").value;
    saveLines[432] = document.getElementById("sav-broguardsstate").value;
    saveLines[455] = document.getElementById("sav-mettatonstate").value;
    saveLines[523] = document.getElementById("sav-exitedtruelab").checked ? "12" : "0";
    saveLines[545] = document.getElementById("sav-havecell").checked ? "1" : "0";
    saveLines[547] = document.getElementById("sav-location").value;
}

function updateFunForm()
{
    var checked = document.getElementById("ini-fun").checked;
    document.getElementById("ini-fun-value").style.display = checked ? "block" : "none";
    document.getElementById("ini-fun-label").style.display = checked ? "block" : "none";
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
    for (var k in presets) if(presets.hasOwnProperty(k)) insert("builtinpresetselect", Object.keys(presets).indexOf(k), Object.keys(presets));
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
        for (var key in pres) if(pres.hasOwnProperty(key)) insert("userpresetselect", key, pres);
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
    document.getElementById("savesi" + i).addEventListener("click", function()
    {
        if(confirm("This will affect your game. Continue?")) saveFile(undertaleDir + "system_information_96" + i, "", function()
        {
            floweyLaughOnce();
            alert("System information file created!");
            document.getElementById("deletesi" + i).disabled = false;
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
    var button = document.getElementById("deletesi" + i);
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
    var weaponSelect = document.getElementById("sav-weapon");
    var armorSelect = document.getElementById("sav-armor");
    weaponSelect.onchange = function()
    {
        var at = weapons[weaponSelect.value];
        if (typeof at !== "undefined") document.getElementById("sav-weaponat").value = at;
    };
    armorSelect.onchange = function()
    {
        var df = armors[armorSelect.value];
        if (typeof df !== "undefined") document.getElementById("sav-armordf").value = df;
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
    document.getElementById("userpresetnew").addEventListener("click", function()
    {
        var name = window.prompt("Enter the name for your new preset");
        if (name === null || name === "") window.alert("You did not enter a valid name, preset not created.");
        else
        {
            saveUserPreset(name);
            var presetSelect = document.getElementById("userpresetselect");
            var option = document.createElement("option");
            var text = document.createTextNode(name);
            option.appendChild(text);
            presetSelect.appendChild(option);
            presetSelect.value = name;
            document.getElementById("userpresetload").disabled = false;
            document.getElementById("userpresetsave").disabled = false;
            document.getElementById("userpresetdelete").disabled = false;
            document.getElementById("userpresetexport").disabled = false;
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
    document.getElementById("userpresetsave").addEventListener("click", function()
    {
        var name = document.getElementById("userpresetselect").value;
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
    document.getElementById("userpresetload").addEventListener("click", function()
    {
        var name = document.getElementById("userpresetselect").value;
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
    document.getElementById("userpresetdelete").addEventListener("click", function()
    {
        var selection = document.getElementById("userpresetselect");
        var name = selection.value;
        var children = selection.childNodes;
        for (var i = 0; i < children.length; i++) if (children[i].value === name) selection.removeChild(children[i]);
        var item = localStorage.getItem("userPresets");
        var presets = JSON.parse(item);
        delete presets[name];
        localStorage.setItem("userPresets", JSON.stringify(presets));
        if (document.getElementById("userpresetselect").value === "")
        {
            document.getElementById("userpresetload").disabled = true;
            document.getElementById("userpresetsave").disabled = true;
            document.getElementById("userpresetdelete").disabled = true;
            document.getElementById("userpresetexport").disabled = true;
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
    if (document.getElementById("userpresetselect").value !== "")
    {
        document.getElementById("userpresetload").disabled = false;
        document.getElementById("userpresetsave").disabled = false;
        document.getElementById("userpresetdelete").disabled = false;
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
    document.getElementById("builtinpresetload").addEventListener("click", function()
    {
        var name = document.getElementById("builtinpresetselect").value;
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
    if (localStorage.getItem("laughed") === "true") document.getElementById("floweyimg").src = "/www/img/flowey_evil.png";
    document.getElementById("floweyimg").addEventListener("click", function()
    {
        document.getElementById("floweyimg").src = "/www/img/flowey_wink.png";
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
    document.getElementById(opt + "-default-load").addEventListener('click', function()
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
    document.getElementById(opt + "-default-save").addEventListener('click', function()
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
    document.getElementById("ini-fun").addEventListener('click', function()
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
    loadSelectFromObj("sav-location", rooms);
    loadSelectFromObj("ini-location", rooms);
    loadSelectFromObj("sav-torielstate", states.toriel);
    loadSelectFromObj("sav-comedianstate", states.comedian);
    loadSelectFromObj("sav-doggostate", states.doggo);
    loadSelectFromObj("sav-dogamydogaressastate", states.dogamyDogaressa);
    loadSelectFromObj("sav-greaterdogstate", states.greaterDog);
    loadSelectFromObj("sav-papyrusstate", states.greaterDog);
    loadSelectFromObj("sav-trainingdummystate", states.trainingDummy);
    loadSelectFromObj("sav-shyrenstate", states.shyren);
    loadSelectFromObj("sav-maddummystate", states.madDummy);
    loadSelectFromObj("sav-undynestate1", states.undyne1);
    loadSelectFromObj("sav-undynestate2", states.undyne2);
    loadSelectFromObj("sav-broguardsstate", states.broGuards);
    loadSelectFromObj("sav-muffetstate", states.muffet);
    loadSelectFromObj("sav-mettatonstate", states.mettaton);
    insertInvLists();
    insertCellLists();
    onListsCreated();
}

function createIDs()
{
    createID(window, ids, "");
    alert(JSON.stringify(window.id));
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
    createLists();
    createIDs();
    onListsCreated();
}

/**
 * Shows the tab with specified iD
 * @method
 * @param {Number} id - iD of HTML div element that represents a tab that will be shown.
 * @author KockaAdmiralac
 */
function showTab(id)
{
    "use strict";
    if(currTab)document.getElementById("tab-" + currTab).style.display = "none";
    document.getElementById("tab-" + id).style.display = "block";
    currTab = id;
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
    showTab(3);
}

document.addEventListener("DOMContentLoaded", start);
