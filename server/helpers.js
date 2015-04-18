
exports.setMethodsVisibility = function(Model, methods) {
  methods = methods || [];
  Model.sharedClass.methods().forEach(function(method) {
    method.shared = methods.indexOf(method.name) > -1;
  });
};

exports.errorDo = function(err, statusCode, message, cb) {
  if (err) {
    err.statusCode = statusCode;
    console.error(err);
    return cb?cb(err):undefined;
  } else {
    err = new Error(message);
    err.statusCode = statusCode;
    console.error(err);
    return cb?cb(err):undefined;
  }
};

exports.generateSlug = function(value) {
  return value.replace(/\W/g, '').toLowerCase();
};
