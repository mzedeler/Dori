'use strict';

var archiver = require('archiver'),
    http = require('http'),
    url = require('url'),
    glob = require('glob'),
    fs = require('fs'),
    querystring = require('querystring'),
    tmp = require('tmp'),
    rm = require('shelljs').rm;

module.exports = function(path, serverUrl, key, callback) {
  tmp.tmpName(
    function (err, tmpPath) {
      if(err) {
        callback('Unable to create temporary file');
      } else {
        var options = url.parse(serverUrl + '?' + querystring.stringify({key: key}));
        options.method = 'POST';
        options.headers = {
          'Content-Type': 'application/octet-stream'
        };
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
        var output = fs.createWriteStream(tmpPath);
        archive.pipe(output);
        archive.bulk([{src: ['**/*'], dest: '.', expand: true, cwd: path}]);
        output.on('finish', function() {
          var input = fs.createReadStream(tmpPath);
          input.pipe(req);
          input.on('end', function() { 
            req.end();
            rm(tmpPath);
          });
        });
        archive.finalize();
      }
    }
  );
};
