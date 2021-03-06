var nappy = require("sdk/self");
var nappySS = require("sdk/simple-storage");
var base64 = require("sdk/base64");


// global extension list

if (!nappySS.storage.extensions)
  nappySS.storage.extensions = [];

var nappyExtensions = nappySS.storage.extensions;

function indexOfExtension(url) {
  for(var i=0;i<nappyExtensions.length;i++) {
    if (nappyExtensions[i].url == url)
      return i;
  }
  return -1;
}


// manage extensions

var panel = require("sdk/panel").Panel({
  width:480,
  height:400,
  contentURL: nappy.data.url("main.html"),
  contentScriptFile: [ nappy.data.url("js/jquery-2.0.3.min.js"),
                       nappy.data.url("main.js")]
});

panel.port.on("manage-list", function() {
    var urls = nappyExtensions.map(function(e) { 
                  return {url:e.url, enabled:e.enabled}
               });
    panel.port.emit("manage-list", urls);
});
panel.port.on("manage-delete", function(extension) {
  if(extension) {
    var idx = indexOfExtension(extension);
    if (idx>=0) {
      nappyExtensions.splice(idx,1);
      console.log("deleted... "+extension);
    }
  }
});
panel.port.on("manage-toggleStatus", function(extension) {
  if(extension) {
    var idx = indexOfExtension(extension);
    if (idx>=0) {
      nappyExtensions[idx].enabled = !nappyExtensions[idx].enabled;
    }
  }
});
panel.port.on("manage-install", function(arg) {
  console.log("install..."+arg);
  function fail(msg) {
    panel.port.emit("manage-install",{message: msg, ok: false});
  }
  function ok() {
    panel.port.emit("manage-install",{message: "ok", ok: true});
  }

  // check to see that there is space left to install extension
  if (nappySS.quotaUsage >= 1) {
    console.log("Using too much storage...");
    return fail("Using too much storage...");
  }

  try {
    var url = require("sdk/url").URL(arg);
    console.log("scheme: "+url.scheme);
    if (url.scheme !== "http" && url.scheme !== "https") {
      throw "Only http(s) URLs accepted.";
    }

    // fetch the source
    require("sdk/request").Request({
      url : url,
      onComplete: function(response) {
        console.log("response["+response.statusText+"]: "
                    +response.text.substring(0,120)+"...");
        if (response.status == 200) {
          // save source
          if (indexOfExtension(url+'') == -1 ) {
            nappyExtensions.push({ url : url+'', 
                                   source:response.text, 
                                   enabled: true });
            return ok();
          }
          return fail("Extension already exists.");
        } else {
          return fail("Fetching extension failed.");
        }
      }
    }).get();

  } catch(e) {
    return fail("Invalid extension URL: "+e);
  }
});


// extension loader

require("sdk/page-mod").PageMod({
  include: ['*'],
  contentScriptWhen: 'start',
  contentScriptFile: [ nappy.data.url("js/jquery-2.0.3.min.js"),
                       nappy.data.url("loader.js") ],
  onAttach: function(worker) {
    worker.port.emit("init",{extensions:  nappyExtensions});
    worker.port.on("log", function(data) {
      console.log("LOG ["+data.type+"]: "+data.message);
    });
  }
});

// widget
 
require("sdk/widget").Widget({
  id: "nappy-config",
  label: "Nappy config",
  contentURL: nappy.data.url("img/favicon.ico"),
  panel: panel,
});


// current label inspector

// This relies on the currentLabel.js extension
require("sdk/context-menu").Item({
  label: "nappy [off]",
  contentScriptFile: nappy.data.url("inspector.js"),
});

