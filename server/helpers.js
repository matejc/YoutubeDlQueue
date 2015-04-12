
exports.setMethodsVisibility = function(Model, methods) {
  methods = methods || [];
  Model.sharedClass.methods().forEach(function(method) {
    method.shared = methods.indexOf(method.name) > -1;
  });
};
