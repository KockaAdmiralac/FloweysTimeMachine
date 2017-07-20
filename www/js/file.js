var FileUtils;
(function(){

var fs = nw.require('fs');
FileUtils = {
    /**
     * Used for loading files.
     * @method
     * @param {string} file - Path to file to load.
     * @param {function} callback - Function that will be called after loading completed.
     * @author KockaAdmiralac
     */
    load: function(file, callback, error)
    {
        "use strict";
        var req = new XMLHttpRequest();
        req.error = function() { error.call(window); };
        req.onreadystatechange = function() { if(req.readyState === 4) callback.call(window, req.response); };
        req.open("GET", file, true);
        req.send();
    },
    /**
     * Saves file to specified place.
     * @method
     * @param {String} file - Path where to save the file.
     * @param {String} text - Text to write in the file.
     * @param {function} callback - Function that will be called upon file saving.
     * @returns {Boolean} If file saving was successful
     */
    save: function(file, text, callback)
    {
        "use strict";
        try
        {
            fs.writeFile(file, text, function(err) { if(!err) callback.call(window); });
            return true;
        }
        catch(e) { Alert.error(error("writing_file")); }
        return false;
    },
    /**
     * Copies one file from one location to another
     * @method
     * @param {String} source - Path to file that should be copied
     * @param {String} dest - Path to where file should be copied
     * @param {function} callback - Function that will be called upon copying.
     * @param {function} err - Function that will be called upon error happening.
     * @author KockaAdmiralac
     */
    _copy: function(source, dest, callback, err)
    {
        "use strict";
        var read = fs.createReadStream(source), write = fs.createWriteStream(dest);
        read.on("error", function()
        {
            Alert.error(error("reading_file"));
            err.call(this);
        });
        write.on("error", function()
        {
            Alert.error(error("writing_file"));
            err.call(this);
        });
        write.on("close", function(){ callback.call(this); });
        read.pipe(write);
    },
    /**
     * Saves data safely.
     * @method
     * @param {String} filename - Path to file
     * @param {String} string - Data to save to the file.
     * @author KockaAdmiralac
     */
    secureSave: function(filename, string, copyDir, backupDir)
    {
        "use strict";
        var saveLocation = copyDir + filename, backupLocation = backupDir + filename;
        this._copy(saveLocation, backupLocation, // Backups the file before saving...
        function()
        {
            if(!FileUtils.save(saveLocation, string, function() { fs.unlink(backupLocation); }))
            {
                // If save is unsuccessful, restore backup
                fs.unlink(saveLocation);
                FileUtils._copy(backupLocation, saveLocation,
                function()
                {
                    Alert.error(error("saving_file") + " " + $vocab.data_safe);
                    fs.unlink(backupLocation);
                },
                function() { Alert.error($vocab.error.fatal + " " + $vocab.manual_restore); });
            }
        },
        function() { Alert.error(error("backup_fail") + " " + $vocab.file_not_saved); });
    },
    createCacheFolder: function()
    {
        "use strict";
        var dir = cacheDir.substring(0, cacheDir.length - 1);
        if(!fs.existsSync(dir)) fs.mkdirSync(dir);
    },
    exists: function(file)
    {
        try { return fs.lstatSync(file).isFile() }
        catch(e) { return false; }
    },
    delete: function(dir, file, success, fail)
    {
        try
        {
            fs.unlink(undertaleDir + SYSTEM_INFORMATION_FILE + i);
            success.call(window);
        }
        catch(e) { fail.call(window); }
    }
};

})();
