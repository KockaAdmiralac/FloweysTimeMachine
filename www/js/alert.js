var Alert = {
    _alerts: 0,
    _baseAlert: function(text, color)
    {
        var elID = this._alerts++, el = $("<div class='alert' id='alert-" + elID + "'>" + text + "</div>");
        el.css({"background-color": color});
        $('#alerts').append(el);
        var interval = setInterval(function()
        {
            $('#alert-' + elID).hide();
            clearInterval(interval);
        }, 2000);
    },
    error: function(text) { this._baseAlert(text, "#FF2837"); },
    success: function(text) { this._baseAlert(text, "#33D464"); }
};
