'use strict';
var assert = require('chai').assert;
var request = require('supertest');

var Server = require('../server.js');

describe('Initialization', function() {
  it('Should be possible to initialize Server', function(done) {
    assert.isFunction(Server, 'Require Server returns a function');
    var server = Server();
    assert.isFunction(server, 'Call to Server constructor returns function.');
    done();
  });
});

describe('Serving', function() {

  describe('Listing tests', function() {
    it('Serves JSON and returns status code 200 on /tests/', function(done) {
      var app = new Server();
      request(app)
        .get('/tests/')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
    it('Serves JSON and returns status code 200 on /tests (no trailing slash)', function(done) {
      var app = new Server();
      request(app)
        .get('/tests')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
    it('Lists the right test fixtures', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/')
        .end(function(err, res) {
          ['/tests/somedir1/ok.simpletest.js',
           '/tests/somedir1/error.simpletest.js',
           '/tests/somedir1/somedir2/ok.simpletest.js'].forEach(function(url) {
             assert(res.body.tests[url], 'The url ' + url + ' must be present in the test list');
           });
          assert.equal(Object.keys(res.body.tests).length, 3, 'Just three test scripts');
          done();
        });
    });
  });
  
  describe('Running tests', function() {
    it('Runs an ok test and returns status code 200', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/somedir1/ok.simpletest.js')
        .expect(200, done);
    });
    it('Runs a failing test and returns status code 525', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/somedir1/error.simpletest.js')
        .expect(525, done);
    });
    it('Returns output written to stdout and stderr', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/somedir1/ok.simpletest.js')
        .expect(/writing to stdout/)
        .expect(/writing to stderr/)
        .expect(200, done);
    });

  });
  
  describe('Error handling', function() {
    it('Returns status 404 for non-existing tests', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/-nonexisting-')
        .expect(404, done);
    });
    it('Returns status 404 for requests outside mount point', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/')
        .expect(404, done);
    });
    it('Returns status 409 on the second run of an already running test');
  });
  
});
