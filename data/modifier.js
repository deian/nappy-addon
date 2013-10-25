"use strict";

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
        var i, len;
        for (i = 0, len = this.length; i < len; ++i) {
            if (i in this) {
                fn.call(scope, this[i], i, this);
            }
        }
    };
}

self.port.on("init", function(data) {
  var extensions = data.extensions;



  extensions.every(function (ext, idx, arr) {
    // skip disabled extensions
    if (!ext.enabled)
      return true;
    var script = document.createElement("script");
    script.type= 'text/javascript';
    script.onerror = function(err) {
      self.port.emit("log", 
        { type: "error",
          message: "Script "+ ext.url + " did not get loaded"});
    };
    script.onload = function() {
      self.port.emit("log", 
        { type: "info",
          message: "Script "+ ext.url + " loaded"});
    };
    script.text = ext.source;
    document.getElementsByTagName("head")[0].appendChild(script);
    return true;
  });
  
});
