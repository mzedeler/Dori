#!/bin/bash

inotifywait -rme modify,attrib,move,close_write,create,delete,delete_self js bin package.json | \
    perl -MTime::HiRes=ualarm -ne '$|++; $SIG{ALRM} = sub { print "js\n" }; ualarm 100000;' | \
    xargs -L1 sh -c 'reset && node_modules/mocha/bin/mocha --ui tdd --recursive js'