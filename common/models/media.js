module.exports = function(Media) {
  var loopback = require('loopback');
  var validUrl = require('valid-url');
  var _ = require('underscore');
  var setMethodsVisibility = require('../../server/helpers')
    .setMethodsVisibility;
  var errorDo = require('../../server/helpers').errorDo;
  var generateSlug = require('../../server/helpers').generateSlug;
  var Youtubedl = loopback.getModel('youtubedl');
  var fs = require('fs');
  // var playlistOffset;
  //
  // Misc.get('playlistOffset', function(err, o){
  //   playlistOffset = o.value===undefined?0:o.value;
  // });
  // Misc.set({
  //   key: 'playlistOffset', value: ++playlistOffset
  // }, function(err, o) {});

  Media.add = function(req, res, body, cb) {
    if (validUrl.is_web_uri(body.url) === undefined) {
      return errorDo(null, 400, 'invalid url', cb);
    }
    switch (body.target) {
      case 'youtubedl':
        Youtubedl.download(req, res, body.url, function(err, obj) {
          Media.upsert(obj, function(err, info) {
            if (err) return errorDo(err, 500);
            console.log(info.state + ': ' + info.url);
          });
        });
        console.log('adding youtubedl: ' + body.url);
        break;
      default:
        addStream(body.url, function(err, info){
          if (err) return errorDo(err, 500);
          console.log(info.state + ': ' + info.url);
        });
        console.log('adding stream: ' + body.url);
    }
    cb(null, {statusCode: 200});
  };
  Media.add.shared = true;
  Media.add.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'body', type: 'string',  'http': {source: 'body'}}
  ];
  Media.add.http = {path: '/add', verb: 'post'};
  Media.add.returns = {root: true};

  var addStream = function(url, cb) {
    var slug = generateSlug(url);
    Media.upsert({
      url: url,
      title: slug,
      mediatype: 'stream',
      mediaid: slug,
      filename: '',
      filepath: '',
      time: new Date(),
      state: 'done',
      slug: slug
    }, cb);
  };


  Media.search = function(req, res, query, cb) {

    switch (query.target) {
      case 'youtube':
        var search = require('youtube-search');
        search(query.text, {
          maxResults: 10, startIndex: 1
        }, function(err, results) {
          if (err) return errorDo(err, 500);
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
          whereArray.push({slug: {like: '.*'+generateSlug(query.text)+'.*'}});
        }
        if (query.persist) {
          for (var i=0; i<query.persist.length; i++) {
            whereArray.push({mediaid: query.persist[i].mediaid});
          }
        }
        Media.find({
          where: (_.isEmpty(whereArray)?{}:{or: whereArray}),
          limit: 10, order: 'time DESC'
        }, function(err, objects) {
          if (err) return errorDo(err, 500);
          var result = [];
          for (var i=0; i<objects.length; i++) {
            result.push({
              title: objects[i].title,
              state: objects[i].state,
              mediaid: objects[i].mediaid,
              url: objects[i].url
            });
          }
          cb(null, result);
        });
    }
  };
  Media.search.shared = true;
  Media.search.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'query', type: 'object', 'http': {source: 'body'}}
  ];
  Media.search.returns = {root: true};
  Media.search.http = {path: '/search', verb: 'post'};


  Media.download = function(req, res, mediaid, cb) {
    Media.findOne({where: {mediaid: mediaid}}, function(err, o) {
      if (err) return errorDo(err, 500);
      var readstream = fs.createReadStream(o.filepath);
      readstream.on('error', function (err) {
        errorDo(err, 500);
      });
      res.setHeader('Content-Type', 'video/m4a');
      res.setHeader(
        'Content-Disposition', 'attachment; filename=' + o.filename
      );
      readstream.pipe(res);
    });
  };
  Media.download.shared = true;
  Media.download.accepts = [
    {arg: 'req',  type: 'object',  'http': {source: 'req'}},
    {arg: 'res',  type: 'object',  'http': {source: 'res'}},
    {arg: 'mediaid', type: 'string', 'http': {source: 'path'}}
  ];
  Media.download.http = {path: '/download/:mediaid', verb: 'get'};

  setMethodsVisibility(Media);

};
