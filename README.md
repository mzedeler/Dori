# Dori

Converts test scripts written in any language to URLs that can be monitored.

## Usage

### To set up a monitoring server

    bin/server --key=sup3rs3cr3t --path=server_root_dir

### To upload tests

    bin/uploader --key=sup3rs3cr3t --url=http://my.host.name/test/my_test_suite --tests=my_test_suite

### To run tests

    curl http://my.host.name/test/my_test_suite/some_test


## Quick start

Dori is a monitoring server that is able to run tests that you provide and return their output over http.

All you need to do, is write a script or some other executable that uses its exit code to indicate whether
the test succeeded or failed. The protocol is simple:

 * Exit code 0: test ok.
 * Exit code 1: test not ok.

Standard out and standard error is provided as information to the client, but does not have any effect on the
status of the test.

When you've written your test, you need to upload it to Dori, which is done using a small upload script. The
upload script uses, so you can upload from any place that can otherwise reach Dori. To let Dori know how to
run the test, you need to provide a file named `test.manifest`. This is a JSON file containing an object with
the following keys:

 * install: (object)
   * command: command to run when installing test
   * args: parameters to provide to install command
 * tests: (array of objects)
   * name: the relative url path that the test will get.
   * command: the command to run when running the test.
   * parameters: what parameters to provide to the test command.

### A short example

`my-suite/test.manifest`:

    {
      "install": {
        "command": "npm",
        "args": ["install"]
      },
      "tests": [
        {
          "name": "my-simple-test",
          "command": "npm",
          "parameters": ["run"]
        }
      ]
    }

`my-suite/package.json`:
    {
      "name": "simple-test",
      "version": "1.0.0",
      "description": "Demo suite for Dori",
      "main": "my.simple.test.js",
    }

`my-suite/my.simple.test.js`:
    'use strict';

    console.log('Hello world. This test returns ok.');
    process.exit(0);


Lets say we uploaded like this:

    bin/uploader --key=some-s3cr3t-key --url=http://my.local.server/my-suite my-suite

You should now be able to run the test `my.simple.test.js` like this:

    curl http://my.local.server/my-suite/simple-test

The protocol is as follows:

 * HTTP Status 200: the test was run and returned ok.
 * HTTP Status 525: the test was run and returned not ok.
 * Any other status code: running the test failed.


## Developing

Everything is done using test driven development. Patches are only accepted if they are accompanied by additional
tests that demonstrate that they work as expected.

If you find a bug, I'd greatly appreciate if you can provide a failing test as well.


## Author and copyright

Written by Michael Zedeler <michael@zedeler.dk>, copyright Nota (see nota.dk).

## License

This software is Open Source. See the LICENSE file.
