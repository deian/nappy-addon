"use strict";


// install

(function() {
  var form = $('#extension-install');
  var url = $('#extension-install-url');
  

  form.submit(function(event) {
    self.port.emit("manage-install", url.val());
    // disable input
    $('#extension-install-url').attr("disabled","disabled");
    $('#extension-install-button').attr("disabled","disabled");

    event.preventDefault();
  });

  self.port.on("manage-install", function (msg) {
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

// list extensions

(function(){

  $('#manage-list').click(function() {
    self.port.emit("manage-list", "");
  });

  self.port.on("manage-list", function (extList) {
    var extensions = extList || [];
    var list = $('#extension-list'); list.html('');
    extensions.forEach(function(extension,i,arr) {
      var id = "extension-"+i;
      var checked = extension.enabled? 'checked="yes"' : '';
      list.append('<tr><td>'+i+'</td><td><small>'+extension.url+'</small></td>'+
        '<td><input type="checkbox" id="toggle-'+id+'" '+checked+'></td>'+
        '<td><a href="#" id="delete-'+id+'"><i class="icon-trash"></i></a></td></tr>');

      (function() {
        // create closure to save extension
        var ext = extension.url;

        // handle delete
        $("#delete-"+id).click(function() {
          //delete
          self.port.emit("manage-delete", ext);
          //update list
          self.port.emit("manage-list", "");
        });
        // handle enable/disable
        $("#toggle-"+id).click(function() {
          //delete
          self.port.emit("manage-toggleStatus", ext);
          //update list
          self.port.emit("manage-list", "");
        });
      })();
    });
  });
})();
