self.on("context", function(node) {

  var label = 
    document.body.getAttribute("data-nappy-current-privacy-label") || "no ifc";

  return "nappy["+label+"]";
});
