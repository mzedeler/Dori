'use strict';

var archiver = require('archiver');
var http = require('http');
var url = require('url');
var glob = require('glob');

module.exports = function(path, serverUrl, key, callback) {
  var options = url.parse(serverUrl);
  options.method = 'POST';
  var req = http.request(options, function(response) {
    
  });
  
  var archive = archiver('zip');
  archive.pipe(req);
  glob(path).forEach(function(file) {
    archive.append(fs.createReadStream(file), {name: file});
  });
};
