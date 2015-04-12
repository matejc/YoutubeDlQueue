module.exports = function(Gblaster) {
  var loopback = require('loopback');
  var youtubedl = require('youtube-dl');
  var fs = require('fs');
  var GhettoBlaster = require('node-ghettoblaster');
  var player;
  var Youtubedl = loopback.getModel('youtubedl');
  var validUrl = require('valid-url');
  var volume = 50;

  Gblaster.play = function(req, res, youtubedl_id, cb) {
    Youtubedl.findOne({where: {youtubedl_id: youtubedl_id}}, function(err, o) {
      if (err) {
        err.statusCode = 400;
        return cb(err);
      }
      if (player !== undefined) {
        player.stop();
      }
      player = new GhettoBlaster(o.filepath);
      player.on('ended', function() {
        console.log("ended");
      });
      player.play({volume: volume});
    });
    cb(null, {statusCode: 200});
  };
  Gblaster.play.shared = true;
  Gblaster.play.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'youtubedl_id', type: 'string', 'http': {source: 'path'}}
  ];
  Gblaster.play.returns = {root: true};
  Gblaster.play.http = {path: '/play/:youtubedl_id', verb: 'get'};


  Gblaster.stream = function(req, res, body, cb) {
    var url = body.url;
    if (validUrl.is_uri(url) === undefined) {
      var err = new Error('Invalid URI');
      err.statusCode = 400;
      return cb(err);
    }
    if (player !== undefined) {
      player.stop();
    }
    player = new GhettoBlaster(url);
    player.on('ended', function() {
      console.log("stream ended");
    });
    player.play();
    cb(null, {statusCode: 200});
  };
  Gblaster.stream.shared = true;
  Gblaster.stream.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'body',  type: 'string',  'http': {source: 'body'}}
  ];
  Gblaster.stream.http = {path: '/stream', verb: 'post'};
  Gblaster.stream.returns = {root: true};


  Gblaster.volume = function(req, res, action, cb) {
    switch (action) {
      case "inc":
        volume = volume + 10;
        if (volume > 100) {
          volume = 100;
        }
        if (player !== undefined) {
          player.setVolume(volume);
        }
        break;
      case "dec":
        volume = volume - 10;
        if (volume < 0) {
          volume = 0;
        }
        if (player !== undefined) {
          player.setVolume(volume);
        }
        break;
      case "mute":
        if (player !== undefined) {
          player.mute();
        }
        break;
    }
    cb(null, {statusCode: 200, action: action, volume: volume});
  };
  Gblaster.volume.shared = true;
  Gblaster.volume.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'action', type: 'string', 'http': {source: 'path'}}
  ];
  Gblaster.volume.http = {path: '/volume/:action', verb: 'get'};
  Gblaster.volume.returns = {root: true};


  Gblaster.pause = function(cb) {
    if (player !== undefined) {
      player.toggle();
    }
    cb(null, {statusCode: 200});
  };
  Gblaster.pause.shared = true;
  Gblaster.pause.http = {path: '/pause', verb: 'get'};
  Gblaster.pause.returns = {root: true};


  Gblaster.stop = function(cb) {
    if (player !== undefined) {
      player.stop();
    }
    cb(null, {statusCode: 200});
  };
  Gblaster.stop.shared = true;
  Gblaster.stop.http = {path: '/stop', verb: 'get'};
  Gblaster.stop.returns = {root: true};
};
