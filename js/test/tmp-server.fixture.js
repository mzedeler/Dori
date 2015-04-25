'use strict';

/* global after */

var tmp = require('tmp'),
    rm = require('shelljs').rm,
    cp = require('shelljs').cp,
    Server = require('../server.js');

var serverRoots = [];

after(function() {
  serverRoots.forEach(function(root) {
    rm('-r', root);
  });
});

module.exports = function(uploadKey, callback) {
  tmp.dir(
    { unsafeCleanup: true },
    function(err, serverRoot) {
      if(!err) {
        serverRoots.push(serverRoot);
        cp('-r', 'fixtures', serverRoot);
        callback(new Server(serverRoot, uploadKey));
      }
    }
  );
};

