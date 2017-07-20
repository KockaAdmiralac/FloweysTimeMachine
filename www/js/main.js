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
var $data = {},
$vocab,
currLoading = 0,
ini,
maxFun,
saveLines,
currTab,
dataLoaded,
id,
cacheDir = nw.process.env.APPDATA.replace(/\\/g, "/") + "/FloweysTimeMachine/",
undertaleDir = nw.process.env.LOCALAPPDATA.replace(/\\/g, "/") + "/UNDERTALE/",
FILES_FILE = "Files",
FLOWEY_FILE = "/www/img/flowey_evil.png",
FLOWEY_WINK = "/www/img/flowey_wink.png",
INI_FILE = "undertale.ini",
SAVE_FILE = "file0",
SYSTEM_INFORMATION_FILE = "system_information_96";

function error(text) { return $vocab.error.occurred + " " + $vocab.error[text] + "."; }

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
    var lines = text.match(/[^\r\n]+/g), section = null, tmpini = {};
    lines.forEach(function(line)
    {
        if (line === "") return;            // Ignore empty lines
        var lbracket = line.indexOf("[");   // If line starts with [, it is a section header
        if (lbracket !== -1)
        {
            var rbracket = line.slice(lbracket).indexOf("]") + lbracket;
            if (rbracket !== -1)
            {
                section = line.slice(lbracket + 1, rbracket);
                tmpini[section] = {};
            }
        }
        else
        {
            // Otherwise, it is assumed to be an assignment
            if (section === null)
            {
                Alert.error($vocab.error.ini + ": " + $vocab.error.assignment);
                return {};
            }
            var eq = line.indexOf("=");
            if (eq === -1)
            {
                Alert.error($vocab.error.ini + ": " + $vocab.error.expected_equal);
                return {};
            }
            var lquot = line.indexOf('"');
            if (lquot === -1)
            {
                Alert.error($vocab.error.ini + ": " + $vocab.error.expected_quote);
                return {};
            }
            var rquot = line.slice(lquot + 1).indexOf('"') + lquot + 1;
            if (rquot === -1)
            {
                Alert.error($vocab.error.ini + ": " + $vocab.error.unterminated);
                return {};
            }
            var value = line.slice(lquot + 1, rquot), key = line.slice(0, eq);
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
    id.floweyimg.src = FLOWEY_FILE;
    id.audio.play();
}

/**
 * Inserts $data.Items from array to dropdown box.
 * @method
 * @param {String} node - iD of HTML element where to insert elements
 * @param {Number} i - Initial value
 * @param {Array} array - Array of $data.Items to insert
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
 * Inserts data about $data.Items in dropdown boxes.
 * @method
 * @author crumblingstatue
 */
function insertInvLists()
{
    "use strict";
    for (var i = 0; i < $data.Items.length; ++i)
    {
        for (var j = 1; j <= 8; ++j) insert(id.sav.invslot[j], i, $data.Items);
        insert(id.sav.weapon, i, $data.Items);
        insert(id.sav.armor, i, $data.Items);
    }
}

/**
 * Method used for inserting inventory $data.Items from array.
 * @method
 * @author crumblingstatue
 */
function insertCellLists()
{
    "use strict";
    for (var i = 1; i <= 8; i++) loadSelectFromObj(id.sav.cellslot[i], $data.Cell);
}

/**
 * Inserts object elements into dropdown box.
 * @method
 * @param {String} selectId - iD of HTML element in which to insert $data.Items.
 * @param {Object} obj - Object from which to insert $data.Items.
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
    id.ini.name.value = ini.General.Name;
    id.ini.location.value = parseInt(ini.General.Room.trim());
    id.ini.kills.value = parseInt(ini.General.Kills.trim());
    id.ini.love.value = parseInt(ini.General.Love.trim());
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
    else Alert.error($vocab.error.unknown_value.format(value, index + 1, id));
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
        updateSelection(id.sav.invslot[i + 1], values, 12 + (i * 2), window.$data.Items);
        updateSelection(id.sav.cellslot[i + 1], values, 13 + (i * 2), $data.Cell);
    }
    updateSelection(id.sav.weapon, values, 28, window.$data.Items);
    updateSelection(id.sav.armor, values, 29, window.$data.Items);
    updateSelection(id.sav.state.trainingdummy, values, 44, window.$data.States.trainingDummy);
    updateSelection(id.sav.state.toriel, values, 75, window.$data.States.toriel);
    updateSelection(id.sav.state.doggo, values, 82, window.$data.States.doggo);
    updateSelection(id.sav.state.dogamydogaressa, values, 83, window.$data.States.dogamyDogaressa);
    updateSelection(id.sav.state.greaterdog, values, 84, window.$data.States.greaterDog);
    updateSelection(id.sav.state.comedian, values, 87, window.$data.States.comedian);
    updateSelection(id.sav.state.papyrus, values, 97, window.$data.States.papyrus);
    updateSelection(id.sav.state.shyren, values, 111, window.$data.States.shyren);
    updateSelection(id.sav.state.undyne1, values, 281, window.$data.States.undyne1);
    updateSelection(id.sav.state.maddummy, values, 282, window.$data.States.madDummy);
    updateSelection(id.sav.state.undyne2, values, 380, window.$data.States.undyne2);
    updateSelection(id.sav.state.muffet, values, 427, window.$data.States.muffet);
    updateSelection(id.sav.state.broguards, values, 432, window.$data.States.broGuards);
    updateSelection(id.sav.state.mettaton, values, 455, window.$data.States.mettaton);
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
        saveLines[12 + i * 2 + 1] = id.sav.cellslot[i + 1].value;
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
    saveLines[542] = id.sav.plot.value.value;
    saveLines[545] = id.sav.havecell.checked ? "1" : "0";
    saveLines[547] = id.sav.location.value;
}

function updateFunForm()
{
    updateFunFormDisplay();
    updateFunFormContentFromSelect();
}

function updateFunFormDisplay(checked)
{
    "use strict";
    id.ini.fun.show.style.display = id.ini.fun.check.checked ? "block" : "none";
}

function updateFunFormContent()
{
    var funForm = id.ini.fun.value.value;
    var value = $data.Fun[funForm > maxFun ? maxFun : funForm];
    ["description", "chance", "condition"].forEach(function(el){ id.ini.fun[el].innerHTML = value ? value[el] : $vocab.not_available; });
}

function updateFunFormContentFromSelect()
{
    "use strict";
    if(id.ini.fun.check.checked)
    {
        var value = id.ini.fun.select.options[id.ini.fun.select.selectedIndex].text;
        Object.keys($data.Fun).forEach(function(elem, index)
        {
            if($data.Fun[elem].name === value)
            {
                id.ini.fun.value.value = elem;
                updateFunFormContent();
            }
        });

    }
}

function updatePlotFormSelect()
{
    var i = 0, val = id.sav.plot.value.value, found = false;
    for(var property in $data.Plot) if($data.Plot.hasOwnProperty(property))
    {
        if(Number(property) == val)
        {
            id.sav.plot.select.value = i;
            break;
        }
        ++i;
    }
    updatePlotDescription();
}

function updatePlotDescription()
{
    var value = $data.Plot[id.sav.plot.value.value];
    id.sav.plot.description.innerHTML = (typeof value === 'undefined') ? $vocab.not_available : value[1];
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
    FileUtils.secureSave(INI_FILE, string, undertaleDir, cacheDir);
    floweyLaughOnce();
}

/**
 * Save SAVE values to file.
 * @method
 * @author crumblingstatue
 */
function saveSaveValuesToFile()
{
    "use strict";
    var string = "";
    for(var i = 0; i < window.saveLines.length; ++i)
    {
        var item = window.saveLines[i];
        string += item.trim() + ((item.indexOf("\n") > -1) ? "" : "\r\n");
    }
    FileUtils.secureSave(SAVE_FILE, string, undertaleDir, cacheDir);
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
    return FileUtils.exists(undertaleDir + SYSTEM_INFORMATION_FILE + i);
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
    var preset = $data.Presets[$data.Presets.keys()[name]];
    ini = preset.ini;
    saveLines = preset.lines;
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
    var obj = {"ini": ini, "lines": window.saveLines}, presets = JSON.parse(localStorage.getItem("userPresets"));
    presets[name] = obj;
    localStorage.setItem("userPresets", JSON.stringify(presets));
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
        if(confirm($vocab.affect_game)) FileUtils.save(undertaleDir + SYSTEM_INFORMATION_FILE + i, "", function()
        {
            floweyLaughOnce();
            Alert.success($vocab.success.system_information_created);
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
    button.onclick = function()
    {
        if(confirm($vocab.affect_game)) FileUtils.delete(undertaleDir, SYSTEM_INFORMATION_FILE + i,
            function()
            {
                Alert.success($vocab.success.system_information_deleted);
                this.disabled = true;
            },
            function(){ Alert.error(error("delete_system_information")); }
        );
    };
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
 * Initializes dropdown boxes for $data.Weapons and $data.Armors.
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initWeaponArmor()
{
    "use strict";
    var weaponselect = id.sav.weapon, armorselect = id.sav.armor;
    weaponselect.onchange = function()
    {
        var at = $data.Weapons[weaponselect.value];
        if (typeof at !== "undefined") id.sav.weaponat.value = at;
    };
    armorselect.onchange = function()
    {
        var df = $data.Armors[armorselect.value];
        if (typeof df !== "undefined") id.sav.armordf.value = df;
    };
}

/**
 * Initializes user preset dropdown box elements
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initPresetData()
{
    "use strict";
    var userPresets = localStorage.getItem("userPresets");
    if(!userPresets) localStorage.setItem("userPresets", JSON.stringify($data.Presets));
    var pres = JSON.parse(userPresets);
    for (var key in pres) if(pres.hasOwnProperty(key))
    {
        var keys = Object.keys(pres);
        insert(id.preset.select, keys.indexOf(key), keys);
    }
}

/**
 * Initializes "New Preset" button
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initPresetNew()
{
    "use strict";
    id.preset.new.addEventListener("click", function()
    {
        var name = window.prompt($vocab.enter_preset_name);
        if (name === null || name === "") Alert.error($vocab.error.preset_not_created);
        else
        {
            saveUserPreset(name);
            var presetselect = id.preset.select;
            var option = document.createElement("option");
            var text = document.createTextNode(name);
            option.appendChild(text);
            presetselect.appendChild(option);
            presetselect.value = name;
            id.preset.load.disabled = false;
            id.preset.save.disabled = false;
            id.preset.delete.disabled = false;
        }
    }, false);
}

/**
 * Initializes "Save Preset" button
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initPresetSave()
{
    "use strict";
    id.preset.save.addEventListener("click", function()
    {
        var name = id.preset.select.value;
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
function initPresetLoad()
{
    "use strict";
    id.preset.load.addEventListener("click", function()
    {
        var el = id.preset.select;
        var name = el.options[el.selectedIndex].innerHTML;
        if (name !== null && name !== "")
        {
            var obj = JSON.parse(localStorage.getItem("userPresets"))[name];
            window.ini = obj.ini;
            window.saveLines = obj.lines;
            updateSaveDataForm();
            updatePersistentDataForm();
        }
        else Alert.error($vocab.error.enter_valid_preset);
    }, false);
}

/**
 * Initializes "Delete Preset" button
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initPresetDelete()
{
    "use strict";
    id.preset.delete.addEventListener("click", function()
    {
        var selection = id.preset.select;
        var name = selection.value;
        var children = selection.childNodes;
        for (var i = 0; i < children.length; i++) if (children[i].value === name) selection.removeChild(children[i]);
        var item = localStorage.getItem("userPresets");
        var presets = JSON.parse(item);
        delete presets[name];
        localStorage.setItem("userPresets", JSON.stringify(presets));
        if (id.preset.select.value === "")
        {
            id.preset.load.disabled = true;
            id.preset.save.disabled = true;
            id.preset.delete.disabled = true;
        }
    }, false);
}

/**
 * Initializes "enabled" state for load, save and delete buttons.
 * @method
 * @author KockaAdmiralac
 * @author crumblingstatue
 */
function initPresetEnable()
{
    "use strict";
    if (id.preset.select.options.length > 0)
    {
        id.preset.load.disabled = false;
        id.preset.save.disabled = false;
        id.preset.delete.disabled = false;
    }
}

function initPresetReset()
{
    id.preset.reset.addEventListener('click', function()
    {
        if(confirm($vocab.restore_presets))
        {
            localStorage.clear();
            localStorage.setItem("userPresets", JSON.stringify($data.Presets));
            id.preset.select.innerHTML = "";
            initPresetData();
        }
    }, false);
}

/**
 * Initializes everything related to user $data.Presets.
 * @method
 * @author KockaAdmiralac
 */
function initPresets()
{
    "use strict";
    initPresetData();
    initPresetNew();
    initPresetSave();
    initPresetLoad();
    initPresetDelete();
    initPresetEnable();
    initPresetReset();
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
    if (localStorage.getItem("laughed") === "true") id.floweyimg.src = FLOWEY_FILE;
    id.floweyimg.onclick = function()
    {
        id.floweyimg.src = FLOWEY_WINK;
        localStorage.setItem("laughed", false);
    };
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
    id.default.load[opt].onclick = function()
    {
        if(confirm($vocab.affect_game))
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
    };
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
    id.default.save[opt].onclick = function()
    {
        if(confirm($vocab.affect_game))
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
    };
}

function initFun()
{
    var hasFun = ini.General.Fun !== undefined;
    id.ini.fun.check.checked = hasFun;
    id.ini.fun.value.value = parseInt(ini.General[hasFun ? "Fun" : "fun"]);
    id.ini.fun.check.onclick = updateFunFormDisplay;
    id.ini.fun.select.onchange = updateFunFormContentFromSelect;
    id.ini.fun.value.oninput = updateFunFormContent;
}

function initPlot()
{
    id.sav.plot.value.value = saveLines[542];
    updatePlotFormSelect();
    id.sav.plot.value.oninput = updatePlotFormSelect;
    id.sav.plot.select.onchange = function()
    {
        id.sav.plot.value.value = $data.Plot.keys()[id.sav.plot.select.value];
        updatePlotDescription();
    };
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
    initPresets();
    initFun();
    initPlot();
    for(var i = 2; i < 4; ++i) initSystemInformation(i);
    initWeaponArmor();
    initFloweyImg();
    updateFunForm();
}

function loadGameData(file, callback, error)
{
    "use strict";
    FileUtils.load(undertaleDir + file, function(lists)
    {
        callback.call(this, lists);
        if(-- currLoading === 0 && !dataLoaded)
        {
            dataLoaded = true;
            onIniAndSaveLoaded();
        }
    },
    function() { Alert.error(error("loading_" + error + "_file")); });
}

/**
 * Loads a SAVE file.
 * @method
 * @author KockaAdmiralac
 */
function loadSave()
{
    "use strict";
    loadGameData(SAVE_FILE, function(lists)
    {
        saveLines = lists.split("\n");
        updateSaveDataForm();
    }, "save");
}

/**
 * Loads an INI file.
 * @method
 * @author KockaAdmiralac
 */
function loadINI()
{
    "use strict";
    loadGameData(INI_FILE, function(lists)
    {
        ini = parseIniFromText(lists);
        updatePersistentDataForm();
    }, "ini")
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
    loadSelectFromObj(id.sav.location, $data.Rooms);
    loadSelectFromObj(id.ini.location, $data.Rooms);
    var values = [];
    for(var property in $data.Fun) if($data.Fun.hasOwnProperty(property)) values.push($data.Fun[property].name);
    loadSelectFromObj(id.ini.fun.select, values.filter(function(elem, index){ return values.indexOf(elem) === index; }));
    values = [];
    for(var property in $data.Plot) if($data.Plot.hasOwnProperty(property)) values.push($data.Plot[property][0]);
    loadSelectFromObj(id.sav.plot.select, values);
    values = [];
    for(var property in $data.Languages) if($data.Languages.hasOwnProperty(property)) values.push($data.Languages[property]);
    loadSelectFromObj(id.language.select, values);
    Object.keys($data.States).forEach(function(state) { loadSelectFromObj(id.sav.state[state.toLowerCase()], $data.States[state]); });
    insertInvLists();
    insertCellLists();
}

function createIDs()
{
    "use strict";
    createID(window, $data.IDs, "");
}

function createID(obj, node, string)
{
    "use strict";
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

function createFun()
{
    "use strict";
    for(var property in $data.Fun) if($data.Fun.hasOwnProperty(property)) if(property.indexOf("-") > -1)
    {
        var oldProperty = $data.Fun[property], splitName = property.split("-");
        // I know this is really costing me some memory...
        for(var i = Number(splitName[0]), len = Number(splitName[1]) + 1; i < len; ++i) $data.Fun[i] = oldProperty;
        delete $data.Fun[property];
    }
    else if(property[0] === '>')
    {
        maxFun = Number(property.substring(1, property.length));
        $data.Fun[maxFun] = $data.Fun[property];
        delete $data.Fun[property];
    }
}

function initDocumentStrings()
{
    for(var property in $vocab.inner) if($vocab.inner.hasOwnProperty(property)) $("#vocab-" + property).html($vocab.inner[property]);
    for(var property in $vocab.value) if($vocab.value.hasOwnProperty(property)) $("#vocab-" + property).val($vocab.value[property]);
}

function createLanguage()
{
    id.language.button.onclick = function()
    {
        localStorage.setItem("lang", $data.Languages.keys()[id.language.select.value]);
        Alert.success($vocab.refresh_vocab);
    };
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
    createFun();
    createLists();
    createLanguage();
    initDocumentStrings();
    currLoading = 2;
    loadSave();
    loadINI();
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
    if(currTab) id.tab[currTab].style.display = "none";
    id.tab[tabID].style.display = "block";
    currTab = tabID;
}

/**
 * Called when DOM content of the page is loaded.
 * @method
 * @author KockaAdmiralac
 */
window.onload = function()
{
    "use strict";
    var language = localStorage.getItem("lang");
    if(!language)
    {
        localStorage.setItem("lang", "en");
        language = "en";
    }
    FileUtils.load("/www/lang/" + language + ".json", function(json)
    {
        $vocab = JSON.parse(json);
        FileUtils.createCacheFolder();
        FileUtils.load("/www/data/" + FILES_FILE + ".json", function(json)
        {
            JSON.parse(json).forEach(function(file)
            {
                ++ currLoading;
                FileUtils.load("/www/data/" + file + ".json", function(json)
                {
                    $data[file] = JSON.parse(json);
                    if(-- currLoading === 0) onLoaded();
                });
            },
            function(){ Alert.error(error("loading_data_file")); });
        },
        function(){ Alert.error(error("loading_files_file")); });
    })
};
