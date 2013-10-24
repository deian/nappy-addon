var nappy = require("sdk/self");
var nappySS = require("sdk/simple-storage");
var base64 = require("sdk/base64");

var panel = require("sdk/panel").Panel({
  width:488,
  height:400,
  contentURL: nappy.data.url("main.html"),
  contentScriptFile: [nappy.data.url("js/jquery-2.0.3.min.js"), nappy.data.url("main.js")]
});

// manage

function listExtensions() {
  panel.port.emit("manage",{act:"list",
                            extensions:  Object.keys(nappySS.storage)});
}

panel.on("show", function() {
//  listExtensions();
});

panel.port.on("manage", function(arg) {
  if (arg.act == "list") {
    listExtensions();
  } else if(arg.act == "delete") {
    var ext = arg.extension || "";
    if ((ext) && (arg.extension in nappySS.storage))
      delete nappySS.storage[arg.extension];
    console.log("deleted... "+ext);
  }
});

// install

panel.port.on("install", function(arg) {
  console.log("install..."+arg);
  function fail(msg) {
    panel.port.emit("install",{message: msg, ok: false});
  }
  function ok() {
    panel.port.emit("install",{message: "ok", ok: true});
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
          nappySS.storage[url] = response.text;
          ok();
        } else {
          return fail("Fetching extension failed");
        }
      }
    }).get();

  } catch(e) {
    return fail("Invalid extension URL: "+e);
  }
  
//  panel.hide();
});
 
var widget = require("sdk/widget").Widget({
  id: "nappy-config",
  label: "Nappy config",
  contentURL: "http://www.mozilla.org/favicon.ico",
  panel: panel,
});

