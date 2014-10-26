'use strict';
/* global describe, it */

var assert = require('chai').assert;

var Tests = require('../tests.js');

describe('Initialization', function() {
  it('Should be possible to initialize Tests', function() {
    assert.isFunction(Tests, 'Require Tests returns a function');
    var tests = new Tests('some_path', 'some_mount');
    assert.isObject(tests, 'Call to Tests constructor returns object.');
    assert.equal(tests.path, 'some_path', 'Path has been set correctly.');
    assert.equal(tests.mount, 'some_mount', 'Mount has been set correctly.');
  });
});

describe('Configuring and running tests', function() {
  var tests = new Tests('fixtures', '/tests');
  it('Should be possible to add directory with tests', function() {
    ['/tests/somedir1/ok.simpletest.js',
     '/tests/somedir1/error.simpletest.js',
     '/tests/somedir1/somedir2/ok.simpletest.js'].forEach(function(url) {
       assert(tests.index().tests[url], 'The url ' + url + ' must be present in the test list');
     });
    assert.equal(Object.keys(tests.index().tests).length, 3, 'Just three test scripts');
  });

  it('Should be possible to run an ok test', function(done) {
    var ok_test = tests.get('/somedir1/ok.simpletest.js');
    assert(ok_test, 'Ok test exists.');
    assert.equal(ok_test.name, 'ok.simpletest.js', 'Ok test has right name.');
    ok_test.run(function(exitCode, output) {
      assert.equal(exitCode, 0, 'Ok test exited with exit code 0');
      assert.match(output, /writing to stdout/, 'Ok test wrote to stdout');
      assert.match(output, /writing to stderr/, 'Ok test wrote to stderr');
      done();
    });
  });

  it('Should be possible to run a failing test', function(done) {
    var ok_test = tests.get('/somedir1/error.simpletest.js');
    assert(ok_test, 'Failing test exists.');
    assert.equal(ok_test.name, 'error.simpletest.js', 'Failing test has right name.');
    ok_test.run(function(exitCode, output) {
      assert.notEqual(exitCode, 0, 'Failing test exited with nonzero exit code');
      done();
    });
  });
  
  it('Should be possible to insert new test directories');
});
