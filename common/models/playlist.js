module.exports = function(Playlist) {
  var loopback = require('loopback');
  var _ = require('underscore');
  var setMethodsVisibility = require('../../server/helpers')
    .setMethodsVisibility;
  var errorDo = require('../../server/helpers').errorDo;
  var Media = loopback.getModel('media');
  var Misc = loopback.getModel('misc');
  var Mplayer = loopback.getModel('mplayer');
  var Promise = require('bluebird');


  Mplayer.emitter.on('stop', function() {
    console.log('1stop');
  });
  Mplayer.emitter.on('end', function(obj) {
    console.log('1end:');
    console.log(obj);
    Playlist.next(null, null, 'one', function(err) {
      if (err) console.error(err);
    });
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

  function getIndex(name, cb) {
    Misc.get(name, function(err, o){
      if (err) return errorDo(err, 500, name, cb);
      if (_.isObject(o) && _.isObject(o.result) && (_.isNumber(o.result.value) || _.isNull(o.result.value))) {
        cb(err, o.result.value);
      } else {
        return errorDo(null, 400, 'value is not a number', cb);
      }
    });
  }

  function setIndex(name, tracks, offset, cb) {
    getIndex(name, function(err, index) {
      if (err) return errorDo(err, 400, null, cb);
      var newValue;
      if (_.isNull(index) && offset >= 1) {
        newValue = offset;
      } else if (_.isNull(index) && offset <= -1) {
        newValue = tracks.length-1;
      } else if (_.isNumber(index)) {
        newValue = index + offset;
      } else {
        newValue = 0;
      }
      if (newValue >= tracks.length) {
        return errorDo(null, 400, 'end of playlist', cb);
      } else if (newValue < 0) {
        newValue = 0;
      }
      Misc.set({
        key: name, value: newValue
      }, function(err, o) {
        if (err) return errorDo(err, 500, name, cb);
        if (_.isObject(o) && (_.isNumber(o.result) || _.isNull(o.result))) {
          cb(err, o.result);
        } else {
          return errorDo(null, 400, 'value is not a number', cb);
        }
      });
    });
  }

  Playlist.next = function(req, res, name, cb) {
    Playlist.findOne({
      name: name
    }, function(err, playlist) {
      if (err) return errorDo(err, 500, null, cb);
      if (!playlist) return errorDo(null, 400, 'playlist not found', cb);
      var tracks = playlist.tracks;
      setIndex(name, playlist.tracks, 1, function(err, o) {
        if (err) return errorDo(err, 400, null, cb);
        var mediaid;
        if (_.isNull(o)) {
          mediaid = tracks[0];
        } else {
          mediaid = tracks[o];
        }
        if (!mediaid) {
          return errorDo(null, 400, 'playlist is empty', cb);
        }
        Mplayer.play(req, res, mediaid, cb);
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


  Playlist.prev = function(req, res, name, cb) {
    Playlist.findOne({
      name: name
    }, function(err, playlist) {
      if (err) return errorDo(err, 400, null, cb);
      if (!playlist) return errorDo(null, 400, 'playlist not found', cb);
      var tracks = playlist.tracks;
      setIndex(name, playlist.tracks, -1, function(err, o) {
        if (err) return errorDo(err, 400, null, cb);
        var mediaid;
        if (_.isNull(o)) {
          mediaid = tracks[playlist.tracks.length-1];
        } else {
          mediaid = tracks[o];
        }
        if (!mediaid) {
          return errorDo(null, 400, 'playlist is empty', cb);
        }
        Mplayer.play(req, res, mediaid, cb);
      });
    });
  };
  Playlist.prev.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'name',  type: 'string',  'http': {source: 'path'}}
  ];
  Playlist.prev.shared = true;
  Playlist.prev.returns = {root: true};
  Playlist.prev.http = {path: '/prev/:name', verb: 'get'};


  Playlist.play = function(req, res, name, cb) {
    Playlist.findOne({
      name: name
    }, function(err, playlist) {
      if (err) return errorDo(err, 400, null, cb);
      if (!playlist) return errorDo(null, 400, 'playlist not found', cb);
      var tracks = playlist.tracks;
      getIndex(name, function(err, o) {
        if (err) return errorDo(err, 400, null, cb);
        var mediaid;
        if (_.isNull(o)) {
          mediaid = tracks[0];
        } else {
          mediaid = tracks[o];
        }
        Mplayer.play(req, res, mediaid, cb);
      });
    });
  };
  Playlist.play.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'name',  type: 'string',  'http': {source: 'path'}}
  ];
  Playlist.play.shared = true;
  Playlist.play.returns = {root: true};
  Playlist.play.http = {path: '/play/:name', verb: 'get'};


  Playlist.add = function(req, res, body, cb) {
    if (body.mediaid && body.name) {
      Media.findById(body.mediaid, function(err, media) {
        if (err) return errorDo(err, 400, null, cb);
        if (!media) return errorDo(null, 400, 'media not found', cb);
        Playlist.findOrCreate({where: {
          name: body.name
        }}, {
          name: body.name,
          user: ''+req.accessToken.userId
        }, function(err, playlist) {
          if (err) return errorDo(err, 400, null, cb);
          var tracks = playlist.tracks;
          if (!_.isArray(tracks)) {
            tracks = [];
          }
          if (_.isEmpty(tracks)) {
            Misc.set({key: body.name, value: 0}, function() {});
          }
          if (_.indexOf(tracks, media.mediaid) == -1) {
            tracks.push(''+media.mediaid);
            playlist.updateAttribute('tracks', tracks, function(err) {
              if (err) return errorDo(err, 400, null, cb);
              cb(null, {statusCode: 200});
            });
          } else {
            errorDo(null, 400, 'media already exists', cb);
          }
        });
      });
    } else {
      return errorDo(null, 400, 'invalid playlist name or mediaid', cb);
    }
  };
  Playlist.add.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'body', type: 'object',  'http': {source: 'body'}}
  ];
  Playlist.add.shared = true;
  Playlist.add.returns = {root: true};
  Playlist.add.http = {path: '/add', verb: 'post'};


  Playlist.delete = function(name, mediaid, cb) {
    Playlist.findOne({
      name: name
    }, function(err, playlist) {
      if (err) return errorDo(err, 400, null, cb);
      if (!playlist) return errorDo(null, 400, 'playlist not found', cb);
      var tracks = playlist.tracks;
      var i = tracks.indexOf(mediaid);
      if(i !== -1) {
        tracks.splice(i, 1);
      }
      getIndex(name, function(err, value){
        if (i == value) {
          Mplayer.stop(function() {});
        }
        if (value == tracks.length) {
          console.log("tracks.length-1", tracks.length-1)
          Misc.set({key: name, value: tracks.length-1}, function(err) {
            if (err) { console.error(err); }
          });
        }
      });
      playlist.updateAttribute('tracks', tracks, function(err) {
        if (err) return errorDo(err, 400, null, cb);
        cb(null, {statusCode: 200});
      });
    });
  };
  Playlist.delete.accepts = [
    {arg: 'name',  type: 'string',  'http': {source: 'path'}},
    {arg: 'mediaid',  type: 'string',  'http': {source: 'path'}}
  ];
  Playlist.delete.shared = true;
  Playlist.delete.returns = {root: true};
  Playlist.delete.http = {path: '/delete/:name/:mediaid', verb: 'get'};

  Playlist.list = function(req, res, name, cb) {
    Playlist.findOne({
      name: name
    }, function(err, playlist) {
      if (err) return errorDo(err, 400, null, cb);
      if (!playlist) return cb(null, {statusCode: 200});

      new Promise.reduce(playlist.tracks, function (result, mediaid) {
        return new Promise(function(resolve, reject) {
          Media.findById(mediaid, function(err, object) {
            if (err) return reject(err);
            result.push({
              title: object.title,
              state: object.state,
              mediaid: object.mediaid,
              url: object.url
            });
            resolve(result);
          });
        });
      }, []).then(function(result){
        getIndex('one', function(err, value) {
          cb(null, {statusCode: 200, tracks: result, index: value});
        })
      }).catch(function(err) {
        errorDo(err, 500, null, cb);
      });
    });
  };
  Playlist.list.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'name',  type: 'string',  'http': {source: 'path'}}
  ];
  Playlist.list.shared = true;
  Playlist.list.returns = {root: true};
  Playlist.list.http = {path: '/list/:name', verb: 'get'};

  setMethodsVisibility(Playlist);
};
