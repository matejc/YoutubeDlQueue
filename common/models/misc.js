module.exports = function(Misc) {
  var setMethodsVisibility = require('../../server/helpers')
    .setMethodsVisibility;
  var errorDo = require('../../server/helpers').errorDo;


  Misc.get = function(key, cb) {
    Misc.findOne({where: {key: key}}, function(err, o) {
      if (err) return errorDo(err, 400, null, cb);
      return cb(null, {statusCode: 200, result: o});
    });
  };
  Misc.get.accepts = [
    {arg: 'key',  type: 'string',  'http': {source: 'path'}}
  ];
  Misc.get.shared = false;
  Misc.get.returns = {root: true};
  Misc.get.http = {path: '/get/:key', verb: 'get'};


  Misc.set = function(body, cb) {
    if (body.key) {
      Misc.upsert({
        key: body.key,
        value: body.value
      }, function(err, o) {
        if (err) return errorDo(err, 400, null, cb);
        return cb(null, {statusCode: 200});
      });
    } else {
      return errorDo(null, 400, 'invalid key or value', cb);
    }
  };
  Misc.set.accepts = [
    {arg: 'body', type: 'object',  'http': {source: 'body'}}
  ];
  Misc.set.shared = false;
  Misc.set.returns = {root: true};
  Misc.set.http = {path: '/set', verb: 'post'};


  Misc.delete = function(key, cb) {
    Misc.destroyById(key, function(err, o) {
      if (err) return errorDo(err, 400, null, cb);
      return cb(null, {statusCode: 200, key: o.key, value: o.value});
    });
  };
  Misc.delete.accepts = [
    {arg: 'key',  type: 'string',  'http': {source: 'path'}}
  ];
  Misc.delete.shared = false;
  Misc.delete.returns = {root: true};
  Misc.delete.http = {path: '/delete/:key', verb: 'get'};


  Misc.ping = function(cb) {
    return cb(null, {statusCode: 200});
  };
  Misc.ping.shared = true;
  Misc.ping.returns = {root: true};
  Misc.ping.http = {path: '/ping', verb: 'get'};


  setMethodsVisibility(Misc);

};
