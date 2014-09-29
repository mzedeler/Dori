'use strict';

var archiver = require('archiver'),
    http = require('http'),
    url = require('url'),
    glob = require('glob'),
    fs = require('fs');

module.exports = function(path, serverUrl, key, callback) {
  var options = url.parse(serverUrl);
  options.method = 'POST';
  var req = http.request(options, function(response) {
    var body = '';
    response.on('data', function(chunk) { body += chunk; });
    response.on('end', function() {
      var error;
      if(response.statusCode !== 200) {
        error = body.trim();
      }
      callback(error);
    });
  });
  
  var archive = archiver('zip');
  archive.pipe(req);
  glob(path, function(err, files) {
    if(!err) {
      files.forEach(function(file) {
        if(fs.lstatSync(file).isFile()) {
          archive.append(fs.createReadStream(file), {name: file});
        }
      });
      req.end();
    } else {
      throw(err);
    }
  });
};
