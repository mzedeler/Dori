'use strict';

var tar = require('tar-fs'),
    zlib = require('zlib');

module.exports = {
  pack: function(src) {
    return tar.pack(src).pipe(zlib.createGzip());
  },
  unpack: function(stream, dest, callback) {
    var untar = tar.extract(dest);
    var done = function(err) {
      if(callback) {
        callback(err);
      }
      done = function() {};
    };
    function failed() {
      done('Error while extracting archive');
    }
    untar.on('finish', done);
    untar.on('error', failed);
    var gunzip = zlib.createGunzip();
    gunzip.on('error', failed);
    stream.pipe(gunzip).pipe(untar);
  }
};

