module.exports = function(Mplayer) {
  var loopback = require('loopback');
  var youtubedl = require('youtube-dl');
  var fs = require('fs');
  // var Player = require('node-mplayer');
  var Player = require('node-ghettoblaster');
  var player;
  var Youtubedl = loopback.getModel('youtubedl');
  var validUrl = require('valid-url');
  var volume = 50;

  function errorDo(err, message, statusCode, cb) {
    if (err) {
      err.statusCode = statusCode;
      console.error(err);
      return cb?cb(err):undefined;
    } else {
      var err = new Error(message);;
      err.statusCode = statusCode;
      console.error(err);
      return cb?cb(err):undefined;
    }
  }

  function playerDo(action, obj, cb) {
    try {

      switch (action) {
        case "stop":
          if (player) {
            player.stop();
            player = null;
          }
          break;
        case "play":
          player = new Player(obj.filepath);
          player.on('end', function() {
            console.log("end playback: " + obj.youtubedl_id);
          });
          player.on('error', function() {
            errorDo(undefined, "Playback Error: "+obj.youtubedl_id, 500, cb);
          });
          player.play({volume: volume});
          break;
        case "stream":
          player = new Player(obj);
          player.on('end', function() {
            console.log("end playback: " + obj.youtubedl_id);
          });
          player.on('error', function() {
            errorDo(undefined, "Stream Playback Error: "+obj.youtubedl_id, 500, cb);
          });
          player.play({volume: volume});
          break;
        case "volume":
          switch (obj) {
            case "inc":
              volume = volume + 10;
              if (volume > 100) {
                volume = 100;
              }
              if (player) {
                player.setVolume(volume);
              }
              break;
            case "dec":
              volume = volume - 10;
              if (volume < 0) {
                volume = 0;
              }
              if (player) {
                player.setVolume(volume);
              }
              break;
            case "mute":
              if (player) {
                player.mute();
              }
              break;
          }
          break;
        case "pause":
          if (player) {
            player.toggle();
          }
          break;
        default:
          break;
      }
    } catch(err) {
      return errorDo(err, cb);
    }
  }


  Mplayer.play = function(req, res, youtubedl_id, cb) {
    Youtubedl.findOne({where: {youtubedl_id: youtubedl_id}}, function(err, o) {
      if (err) {
        return errorDo(err);
      }
      playerDo('stop');
      playerDo('play', o);
    });
    return cb(null, {statusCode: 200});
  };
  Mplayer.play.shared = true;
  Mplayer.play.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'youtubedl_id', type: 'string', 'http': {source: 'path'}}
  ];
  Mplayer.play.returns = {root: true};
  Mplayer.play.http = {path: '/play/:youtubedl_id', verb: 'get'};


  Mplayer.stream = function(req, res, body, cb) {
    var url = body.url;
    if (validUrl.is_uri(url) === undefined) {
      return errorDo(undefined, 'Invalid URI', 400, cb);
    }
    playerDo('stop');
    playerDo('stream', url);
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
