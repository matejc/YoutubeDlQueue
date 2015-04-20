module.exports = function(Youtubedl) {
  var loopback = require('loopback');
  var youtubedl = require('youtube-dl');
  var fs = require('fs');
  var setMethodsVisibility = require('../../server/helpers').setMethodsVisibility;
  var errorDo = require('../../server/helpers').errorDo;
  var validUrl = require('valid-url');
  var _ = require('underscore');
  var generateSlug = require('../../server/helpers').generateSlug;

  Youtubedl.download = function(req, res, url, cb) {
    download(url, cb);
  };
  Youtubedl.download.shared = true;
  Youtubedl.download.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'url',  type: 'string',  'http': {source: 'form'}}
  ];
  Youtubedl.download.http = {path: '/add', verb: 'post'};
  Youtubedl.download.returns = {root: true};

  var download = function(url, cb) {
    var audio = youtubedl(url, ['--extract-audio', '--audio-format', 'm4a']);
    youtubedl.getInfo(url, [], function(err, info) {
      if (err) return errorDo(err, 500, null, cb);
      info._filepath = __dirname + '/../../storage/audio/' + info.id + '.m4a';
      info._filename = info._filename + '.m4a';
      var writeStream = fs.createWriteStream(info._filepath);
      audio.pipe(writeStream);
      cb(null, {
        url: url,
        title: info.title,
        mediatype: info.mediatype,
        mediaid: info.id,
        filename: info._filename,
        filepath: info._filepath,
        time: new Date(),
        state: 'working',
        slug: generateSlug(info.title)
      });
      var forceStop = setTimeout(function() {
        audio.unpipe(writeStream);
        writeStream.end();
        cb(null, {
          mediaid: info.id,
          state: 'timeout'
        });
      }, 600000);
      audio.on('end', function() {
        audio.unpipe(writeStream);
        writeStream.end();
        cb(null, {
          mediaid: info.id,
          state: 'done'
        });
        clearTimeout(forceStop);
      });
      audio.on('error', function() {
        audio.unpipe(writeStream);
        writeStream.end();
        cb(null, {
          mediaid: info.id,
          state: 'error'
        });
        clearTimeout(forceStop);
      });
    });
  };


/*
  Youtubedl.stream = function(req, res, youtubedl_id, cb) {

    Youtubedl.findOne({where: {youtubedl_id: youtubedl_id}}, function(err, o) {
      if (err) {
        return cb(err);
      }
      var readstream = fs.createReadStream(o.filepath);
      readstream.on('error', function (err) {
        return cb(err);
      });
      res.setHeader("Content-Type", 'video/mp4');
      readstream.pipe(res);
    });

  };
  Youtubedl.stream.shared = true;
  Youtubedl.stream.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'youtubedl_id', type: 'string', 'http': {source: 'path'}}
  ];
  Youtubedl.stream.http = {path: '/stream/:youtubedl_id', verb: 'get'};

  Youtubedl.download = function(req, res, youtubedl_id, cb) {
    Youtubedl.findOne({where: {youtubedl_id: youtubedl_id}}, function(err, o) {
      if (err) {
        return cb(err);
      }
      var readstream = fs.createReadStream(o.filepath);
      readstream.on('error', function (err) {
        return cb(err);
      });
      res.setHeader("Content-Type", 'video/m4a');
      res.setHeader("Content-Disposition", 'attachment; filename=' + o.filename);
      readstream.pipe(res);
    });
  };
  Youtubedl.download.shared = true;
  Youtubedl.download.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'youtubedl_id', type: 'string', 'http': {source: 'path'}}
  ];
  Youtubedl.download.http = {path: '/download/:youtubedl_id', verb: 'get'};


  Youtubedl.add = function(req, res, url, cb) {
    if (validUrl.is_web_uri(url) === undefined) {
      var err = new Error('Invalid URI');
      err.statusCode = 400;
      return cb(err);
    }
    download(url, cb);
  };
  Youtubedl.add.shared = true;
  Youtubedl.add.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'url',  type: 'string',  'http': {source: 'form'}}
  ];
  Youtubedl.add.http = {path: '/add', verb: 'post'};
  Youtubedl.add.returns = {root: true};

  var generateSlug = function(value) {
    return value.toLowerCase();
  };
  var download = function(url, cb) {
    var audio = youtubedl(url, ['--extract-audio', '--audio-format', 'm4a']);
    youtubedl.getInfo(url, [], function(err, info) {
      if (err) return cb(err);
      console.log("start: " + info.id);
      info._filepath = __dirname + '/../../storage/audio/' + info.id + '.m4a';
      info._filename = info._filename + '.m4a';
      var writeStream = fs.createWriteStream(info._filepath);
      audio.pipe(writeStream);
      Youtubedl.upsert({
        url: url,
        title: info.title,
        youtubedl_id: info.id,
        filename: info._filename,
        filepath: info._filepath,
        time: new Date(),
        state: 'working',
        slug: generateSlug(info.title)
      }, function(err, info){
        if (err) return cb(err);
        console.log("working: " + info.id);
      });
      var forceStop = setTimeout(function() {
        audio.unpipe(writeStream);
        writeStream.end();
        Youtubedl.upsert({
          youtubedl_id: info.id,
          state: 'timeout'
        }, function(err, info){
          if (err) return cb(err);
          console.log("timeout: " + info.id);
        });
      }, 600000);
      audio.on('end', function() {
        audio.unpipe(writeStream);
        writeStream.end();
        Youtubedl.upsert({
          youtubedl_id: info.id,
          state: 'done'
        }, function(err, info){
          clearTimeout(forceStop);
          if (err) return cb(err);
          console.log("done: " + info.id);
        });
      });
      audio.on('error', function() {
        audio.unpipe(writeStream);
        writeStream.end();
        Youtubedl.upsert({
          youtubedl_id: info.id,
          state: 'error'
        }, function(err, info){
          clearTimeout(forceStop);
          if (err) return cb(err);
          console.log("error: " + info.id);
        });
      });
      cb(null, {statusCode: 200});
    });
  };

  Youtubedl.search = function(req, res, query, cb) {

    switch (query.target) {
      case "youtube":
        var search = require('youtube-search');
        search(query.text, { maxResults: 10, startIndex: 1 }, function(err, results) {
          if(err) return cb(err);
          var result = [];
          for (var i in results) {
            result.push({
              title: results[i].title,
              url: results[i].url
            });
          }
          cb(null, result);
        });
        break;
      default:
        // enforce
        var whereArray = [];
        if (query.text) {
          whereArray.push({slug: {like: '.*'+query.text.toLowerCase()+'.*'}});
        }
        if (query.persist) {
          for (var i=0; i<query.persist.length; i++) {
            whereArray.push({youtubedl_id: query.persist[i].youtubedl_id});
          }
        }
        Youtubedl.find({where: (_.isEmpty(whereArray)?{}:{or: whereArray}), limit: 10, order: "time DESC"}, function(err, objects) {
          if (err) {
            return cb(err);
          }
          var result = [];
          for (var i=0; i<objects.length; i++) {
            result.push({
              title: objects[i].title,
              state: objects[i].state,
              youtubedl_id: objects[i].youtubedl_id,
              url: objects[i].url
            });
          }
          cb(null, result);
        });
    }
  };
  Youtubedl.search.shared = true;
  Youtubedl.search.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'query', type: 'object', 'http': {source: 'body'}}
  ];
  Youtubedl.search.returns = {root: true};
  Youtubedl.search.http = {path: '/search', verb: 'post'};


  Youtubedl.ping = function(cb) {
    Youtubedl.destroyAll({state: 'working'}, function(err, info){});
    return cb(null, {statusCode: 200});
  };
  Youtubedl.ping.shared = true;
  Youtubedl.ping.returns = {root: true};
  Youtubedl.ping.http = {path: '/ping', verb: 'get'};


  setMethodsVisibility(Youtubedl);
*/
  // Youtubedl.disableRemoteMethod('create', true);
};
