module.exports = function(Mplayer) {
  var loopback = require('loopback');
  var youtubedl = require('youtube-dl');
  var fs = require('fs');
  var Player = require('node-mplayer');
  var player;
  var Youtubedl = loopback.getModel('youtubedl');
  var validUrl = require('valid-url');
  var volume = 50;

  Mplayer.play = function(req, res, youtubedl_id, cb) {
    Youtubedl.findOne({where: {youtubedl_id: youtubedl_id}}, function(err, o) {
      if (err) {
        err.statusCode = 400;
        return cb(err);
      }
      if (player) {
        player.stop();
        player = null;
      }
      player = new Player(o.filepath);
      player.on('end', function() {
        console.log("end");
      });
      player.on('error', function() {
        console.log("error");
      });
      player.play({volume: volume});
    });
    cb(null, {statusCode: 200});
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
      var err = new Error('Invalid URI');
      err.statusCode = 400;
      return cb(err);
    }
    if (player) {
      player.stop();
      player = null;
    }
    player = new Player(url);
    player.on('end', function() {
      console.log("end");
    });
    player.on('error', function() {
      console.log("error");
    });
    player.play({volume: volume});
    cb(null, {statusCode: 200});
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
    switch (action) {
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
    cb(null, {statusCode: 200, action: action, volume: volume});
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
    if (player) {
      player.pause();
    }
    cb(null, {statusCode: 200});
  };
  Mplayer.pause.shared = true;
  Mplayer.pause.http = {path: '/pause', verb: 'get'};
  Mplayer.pause.returns = {root: true};


  Mplayer.stop = function(cb) {
    if (player) {
      player.stop();
      player = null;
    }
    cb(null, {statusCode: 200});
  };
  Mplayer.stop.shared = true;
  Mplayer.stop.http = {path: '/stop', verb: 'get'};
  Mplayer.stop.returns = {root: true};
};
