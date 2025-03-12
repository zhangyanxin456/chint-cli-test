'use strict';

const ctrequest = require('..');
const assert = require('assert').strict;

assert.strictEqual(ctrequest(), 'Hello from ctrequest');
console.info('ctrequest tests passed');
