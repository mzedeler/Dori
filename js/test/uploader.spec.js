'use strict';
/* global describe, it */

var assert = require('chai').assert;
var request = require('supertest');

var Server = require('../server.js');
var uploader = require('../uploader.js');

describe('Uploader', function() {
  
  describe('Initialization', function() {
    it('Should be possible to import uploader', function(done) {
      assert.isFunction(uploader, 'Require uploader returns a function');
      done();
    });
  });
  
  describe('Uploading', function() {
  
    // module.exports = function(path, serverUrl, key, callback) {
    
    describe('Uploading tests', function() {
      it('Is possible to upload fixtures', function(done) {
        var app = new Server('fixtures', 'abc');
        var server = app.listen(0, function() {
          app.on('dori:configUpdated', function() {
            // XXX: Without this, the tests doesn't get uploaded.
            //      For some reason, this is only a problem in the test.
            setTimeout(done, 1000);
          });
          uploader(
            'fixtures/somedir1',
            'http://localhost:' + server.address().port + '/tests/tmp/',
            'abc',
            function(error) {
              assert(!error, 'Uploader finishes without error (got ' + error + ')');
            }
          );
        });
      });
      it('Lists the fixtures that were just uploaded', function(done) {
        var app = new Server('fixtures');
        request(app)
          .get('/tests/')
          .end(function(err, res) {
            ['/tests/tmp/ok.simpletest.js',
             '/tests/tmp/error.simpletest.js',
             '/tests/tmp/somedir2/ok.simpletest.js'].forEach(function(url) {
               assert(res.body.tests[url], 'The url ' + url + ' must be present in the test list');
             });
            done();
          });
      });
    });
  });

});
