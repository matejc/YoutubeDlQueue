module.exports = function(Mplayer) {
  var loopback = require('loopback');
  var fs = require('fs');
  var Player = require('node-ghettoblaster');
  var player;
  var validUrl = require('valid-url');
  var volume = 50;
  var errorDo = require('../../server/helpers').errorDo;

  Mplayer.emitter = new (require('events').EventEmitter)();

  function playerDo(action, obj, cb) {
    try {
      switch (action) {
        case 'stop':
          if (player) {
            player.stop();
            player = null;
          }
          Mplayer.emitter.emit(action);
          break;
        case 'play':
          player = new Player(obj.mediatype==='stream'?obj.url:obj.filepath);
          player.on('ended', function() {
            Mplayer.emitter.emit('end', obj);
            console.log('end playback: ' + obj.mediaid);
          });
          player.on('error', function() {
            Mplayer.emitter.emit('error', obj);
            errorDo(undefined, 500, 'Playback Error: '+obj.mediaid, cb);
          });
          player.play({volume: volume});
          Mplayer.emitter.emit(action, obj);
          break;
        case 'stream':
          player = new Player(obj);
          player.on('ended', function() {
            Mplayer.emitter.emit('end', obj);
            console.log('end playback: ' + obj.mediaid);
          });
          player.on('error', function() {
            Mplayer.emitter.emit('error', obj);
            errorDo(undefined, 500, 'Stream Playback Error: '+obj.mediaid, cb);
          });
          Mplayer.emitter.emit(action, obj);
          player.play({volume: volume});
          break;
        case 'volume':
          switch (obj) {
            case 'inc':
              volume = volume + 3;
              if (volume > 100) {
                volume = 100;
              }
              if (player) {
                player.setVolume(volume);
              }
              break;
            case 'dec':
              volume = volume - 3;
              if (volume < 0) {
                volume = 0;
              }
              if (player) {
                player.setVolume(volume);
              }
              break;
            case 'mute':
              if (player) {
                player.mute();
              }
              break;
          }
          Mplayer.emitter.emit('volume', obj, volume);
          break;
        case 'pause':
          if (player) {
            player.toggle();
          }
          Mplayer.emitter.emit('pause');
          break;
        default:
          break;
      }
    } catch(err) {
      return errorDo(err, 500, null, cb);
    }
  }


  Mplayer.play = function(req, res, mediaid, cb) {
    loopback.getModel('media').findOne({
      where: {mediaid: mediaid}
    }, function(err, o) {
      if (err) return errorDo(err, 500, null, cb);
      playerDo('stop');
      setTimeout(function() {
        playerDo('play', o);
      }, 300);
    });
    return cb(null, {statusCode: 200, mediaid: mediaid});
  };
  Mplayer.play.shared = true;
  Mplayer.play.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'mediaid', type: 'string', 'http': {source: 'path'}}
  ];
  Mplayer.play.returns = {root: true};
  Mplayer.play.http = {path: '/play/:mediaid', verb: 'get'};


  Mplayer.stream = function(req, res, body, cb) {
    var url = body.url;
    if (validUrl.is_uri(url) === undefined) {
      return errorDo(undefined, 400, 'Invalid URI', cb);
    }
    playerDo('stop');
    setTimeout(function() {
      playerDo('stream', url);
    }, 300);
    return cb(undefined, {statusCode: 200});
  };
  Mplayer.stream.shared = true;
  Mplayer.stream.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'body',  type: 'string',  'http': {source: 'body'}}
  ];
  Mplayer.stream.http = {path: '/stream', verb: 'post'};
  Mplayer.stream.returns = {root: true};


  Mplayer.volume = function(req, res, action, cb) {
    playerDo('volume', action);
    return cb(null, {statusCode: 200, action: action, volume: volume});
  };
  Mplayer.volume.shared = true;
  Mplayer.volume.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'action', type: 'string', 'http': {source: 'path'}}
  ];
  Mplayer.volume.http = {path: '/volume/:action', verb: 'get'};
  Mplayer.volume.returns = {root: true};


  Mplayer.pause = function(cb) {
    playerDo('pause');
    return cb(null, {statusCode: 200});
  };
  Mplayer.pause.shared = true;
  Mplayer.pause.http = {path: '/pause', verb: 'get'};
  Mplayer.pause.returns = {root: true};


  Mplayer.stop = function(cb) {
    playerDo('stop');
    return cb(null, {statusCode: 200});
  };
  Mplayer.stop.shared = true;
  Mplayer.stop.http = {path: '/stop', verb: 'get'};
  Mplayer.stop.returns = {root: true};
};
