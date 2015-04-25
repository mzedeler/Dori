'use strict';
/* global describe, it, before, after */

var assert = require('chai').assert,
    request = require('supertest'),
    rm = require('shelljs').rm,
    cp = require('shelljs').cp,
    tmp = require('tmp'),
    tmpServer = require('./tmp-server.fixture.js'),
    uploader = require('../uploader.js');

describe('Uploader', function() {
  
  describe('Initialization', function() {
    it('Should be possible to import uploader', function(done) {
      assert.isFunction(uploader, 'Require uploader returns a function');
      done();
    });
  });
  
  describe('Uploading', function() {
    
    describe('Uploading tests', function() {
      tmpServer('abc', function(app) {
        it('Is possible to upload fixtures', function(done) {
          var server = app.listen(0, function() {
            app.on('dori:configUpdated', function() { done(); });
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

});
