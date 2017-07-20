Object.prototype.keys = function() { return Object.keys(this); };

String.prototype.format = function()
{
    var args = arguments;
    return this.replace(/%([0-9]+)/g, function(s, n) { return args[Number(n) - 1]; });
};
