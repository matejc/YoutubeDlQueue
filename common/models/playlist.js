module.exports = function(Playlist) {
  var loopback = require('loopback');
  var _ = require('underscore');
  var setMethodsVisibility = require('../../server/helpers')
    .setMethodsVisibility;
  var errorDo = require('../../server/helpers').errorDo;
  var Media = loopback.getModel('media');
  var Misc = loopback.getModel('misc');
  var Mplayer = loopback.getModel('mplayer');


  Mplayer.emitter.on('stop', function() {
    console.log('1stop');
  });
  Mplayer.emitter.on('end', function(obj) {
    console.log('1end:');
    console.log(obj);
  });
  Mplayer.emitter.on('error', function(obj) {
    console.log('1error');
  });
  Mplayer.emitter.on('stream', function(obj) {
    console.log('1stream');
  });
  Mplayer.emitter.on('volume', function(action, volume) {
    console.log('1volume');
  });
  Mplayer.emitter.on('pause', function() {
    console.log('1pause');
  });

  function getMeta(name, cb) {
    Misc.get(name, function(err, o){
      if (err) return errorDo(err, 500, name, cb);
      cb(err, (o.result&&o.result.value)?o.result.value:{offset: 0, last: 0});
    });
  }

  function setMeta(name, offset, last, cb) {
    Misc.set({
      key: name, value: {offset: offset, last: last?last:0}
    }, function(err, o) {
      if (err) return errorDo(err, 500, name, cb);
      cb(err, o);
    });
  }

  Playlist.next = function(req, res, name, cb) {
    getMeta(name, function(err, meta){
      Playlist.findOne({
        where: {order: {gte: meta.offset}, name: name},
        order: 'order ASC'
      }, function(err, o) {
        setMeta(name, meta.offset+1, meta.last, function(){});
        if (err) return errorDo(err, 400, null, cb);
        if (!o) return errorDo(err, 400, 'no result', cb);
        Mplayer.play(req, res, o.mediaid, cb);
      });
    });
  };
  Playlist.next.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'name',  type: 'string',  'http': {source: 'path'}}
  ];
  Playlist.next.shared = true;
  Playlist.next.returns = {root: true};
  Playlist.next.http = {path: '/next/:name', verb: 'get'};


  Playlist.add = function(body, cb) {
    if (body.mediaid && body.name) {
      getMeta(body.name, function(err, meta){
        Playlist.findOne({where: {
          mediaid: body.mediaid,
          name: body.name
        }}, function(err, instance) {
          if (err) return errorDo(err, 400, null, cb);
          if (instance) {
            // instance.updateAttribute('order', meta.last, function(err, o) {
            //   setMeta(body.name, meta.offset, meta.last, function(){});
            // });
              cb(null, {statusCode: 200, mediaid: instance.mediaid});
          } else {
            Playlist.create({
              mediaid: body.mediaid,
              name: body.name,
              order: meta.last
            }, function(err, instance) {
              if (err || !instance) return errorDo(err, 400, null, cb);
              setMeta(body.name, meta.offset, meta.last+1, function(){});
              cb(null, {statusCode: 200, mediaid: instance.mediaid});
            });
          }

        });
      });
    } else {
      return errorDo(null, 400, 'invalid playlist name or mediaid', cb);
    }
  };
  Playlist.add.accepts = [
    {arg: 'body', type: 'object',  'http': {source: 'body'}}
  ];
  Playlist.add.shared = true;
  Playlist.add.returns = {root: true};
  Playlist.add.http = {path: '/add', verb: 'post'};


  Playlist.delete = function(name, mediaid, cb) {
    Playlist.destroyAll({
      name: name, mediaid: mediaid
    }, function(err, o) {
      if (err) return errorDo(err, 400, null, cb);
      return cb(null, {statusCode: 200, count: o.count});
    });
  };
  Playlist.delete.accepts = [
    {arg: 'name',  type: 'string',  'http': {source: 'path'}},
    {arg: 'mediaid',  type: 'string',  'http': {source: 'path'}}
  ];
  Playlist.delete.shared = true;
  Playlist.delete.returns = {root: true};
  Playlist.delete.http = {path: '/delete/:name/:mediaid', verb: 'get'};


  setMethodsVisibility(Playlist);
};
