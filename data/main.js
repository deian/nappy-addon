"use strict";


// install

(function() {
  var form = $('#extension-install');
  var url = $('#extension-install-url');
  

  form.submit(function(event) {
    self.port.emit("install", url.val());
    // disable input
    $('#extension-install-url').attr("disabled","disabled");
    $('#extension-install-button').attr("disabled","disabled");

    event.preventDefault();
  });

  self.port.on("install", function (msg) {
    var ok  = msg.ok || false;
    var msg = msg.message || "Unknown";
    // re-enable form
    // disable input
    $('#extension-install-url').removeAttr("disabled");
    $('#extension-install-button').removeAttr("disabled");
    if (!ok) {
      // display error message
      var closeButton = '<a href="#" class="close" data-dismiss="alert">&times;</a>';
      $("#status").html('<div class="alert span4 alert-error">'
                        + closeButton + msg + '</div>');
    } else{
      // clear URL
      $("#status").html("");
      url.val("");
    }
  });

})();

// manage extensions

(function(){

  $('#manage-list').click(function() {
    self.port.emit("manage", {act:"list"});
  });

  self.port.on("manage", function (data) {
    if (data.act == "list") {
      var extensions = data.extensions || [];
      var list = $('#extension-list'); list.html('');
      var i, id;
      for(i=0;i<extensions.length;i++) {
        id = "delete-extension-"+i;
        list.append('<tr><td>'+i+'</td><td><small>'+extensions[i]+'</small></td>'+
        '<td><a href="#" id="'+id+'"><i class="icon-trash"></i></a></td></tr>');

         (function() {
            // create closure to save extension
            var ext = extensions[i];
            $("#"+id).click(function() {
              //delete
              self.port.emit("manage", {act:"delete", extension: ext});
              //update list
              self.port.emit("manage", {act:"list"});
            });
        })();
        
      }
    }
  });
})();
