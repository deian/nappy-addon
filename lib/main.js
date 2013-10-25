var nappy = require("sdk/self");
var nappySS = require("sdk/simple-storage");
var base64 = require("sdk/base64");

var panel = require("sdk/panel").Panel({
  width:480,
  height:400,
  contentURL: nappy.data.url("main.html"),
  contentScriptFile: [ nappy.data.url("js/jquery-2.0.3.min.js"),
                       nappy.data.url("main.js")]
});

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

// install

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
          nappyExtensions.push({ url : url+'', 
                                 source:response.text, 
                                 enabled: true });
          ok();
        } else {
          return fail("Fetching extension failed");
        }
      }
    }).get();

  } catch(e) {
    return fail("Invalid extension URL: "+e);
  }
});

// logger



// page modifier

require("sdk/page-mod").PageMod({
  include: ['*'],
  contentScriptWhen: 'ready',
  contentScriptFile: [ nappy.data.url("js/jquery-2.0.3.min.js"),
                       nappy.data.url("modifier.js") ],
  onAttach: function(worker) {
    worker.port.emit("init",{extensions:  nappyExtensions});
    worker.port.on("log", function(data) {
      console.log("LOG ["+data.type+"]: "+data.message);
    });
  }
});

// widget
 
var widget = require("sdk/widget").Widget({
  id: "nappy-config",
  label: "Nappy config",
  contentURL: "http://www.mozilla.org/favicon.ico",
  panel: panel,
});



