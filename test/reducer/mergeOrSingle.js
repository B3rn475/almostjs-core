// Copyright (c) 2018, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global describe, it, before*/
"use strict";

var _ = require('lodash'),
    assert = require('assert'),
    r = require('../../lib/reducer'),
    Exception = require('../../lib/exception');

function invoke(input, reducer) {
    var accumulated;
    if (reducer.hasOwnProperty('accumulator')) {
        accumulated = _(input).reduce(reducer, _.cloneDeep(reducer.accumulator));
    } else {
        accumulated = _(input).reduce(reducer);
    }
    if (reducer.hasOwnProperty('terminate')) {
        return reducer.terminate(accumulated);
    }
    return accumulated;
}

var NumberConstructor = Number,
    StringConstructor = String,
    BooleanConstructor = Boolean;

describe('mergeOrSingle', function () {
    var reduce;
    before(function () {
        reduce = r.mergeOrSingle();
    });
    it('should be a function', function () {
        assert.equal(typeof r.mergeOrSingle, 'function');
    });
    it('should return empty object with no elements', function () {
        assert.deepStrictEqual(invoke([], reduce), {});
    });
    it('should return the element with one element', function () {
        assert.deepStrictEqual(invoke([{}], reduce), {});
    });
    it('should merge all the elements', function () {
        assert.deepStrictEqual(invoke([{a: 1}, {b: 2}], reduce), {a: 1, b: 2});
    });
    describe('should preserve non plain objects', function () {
        it('undefined', function () {
            var value = _.noop();
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('null', function () {
            var value = null;
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('number (0)', function () {
            var value = 0;
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('number (1)', function () {
            var value = 1;
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('boolean (true)', function () {
            var value = true;
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('boolean (false)', function () {
            var value = false;
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('Boolean (true)', function () {
            var value = new BooleanConstructor(true);
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('Boolean (false)', function () {
            var value = new BooleanConstructor(false);
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('string', function () {
            var value = 'string';
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('string (empty)', function () {
            var value = '';
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('String', function () {
            var value = new StringConstructor('string');
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('String (empty)', function () {
            var value = new StringConstructor('');
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('regexp', function () {
            var value = / /;
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
        it('non plain object', function () {
            function Constructor() {
                this.field = true;
            }
            var value = new Constructor();
            assert.deepStrictEqual(invoke([value], reduce), value);
        });
    });
    describe('should throw exception if merging non plain objects', function () {
        it('both elements', function () {
            assert.throws(function () {
                invoke([1, 2], reduce);
            }, Exception);
        });
        it('first element', function () {
            assert.throws(function () {
                invoke([1, {}], reduce);
            }, Exception);
        });
        it('second element', function () {
            assert.throws(function () {
                invoke([{}, 1], reduce);
            }, Exception);
        });
        it('undefined', function () {
            assert.throws(function () {
                invoke([undefined, {}], reduce);
            }, Exception);
        });
        it('null', function () {
            assert.throws(function () {
                invoke([null, {}], reduce);
            }, Exception);
        });
        it('number', function () {
            assert.throws(function () {
                invoke([1, {}], reduce);
            }, Exception);
        });
        it('Number', function () {
            assert.throws(function () {
                invoke([new NumberConstructor(0), {}], reduce);
            }, Exception);
        });
        it('boolean', function () {
            assert.throws(function () {
                invoke([true, {}], reduce);
            }, Exception);
        });
        it('Boolean', function () {
            assert.throws(function () {
                invoke([new BooleanConstructor(false), {}], reduce);
            }, Exception);
        });
        it('string', function () {
            assert.throws(function () {
                invoke(['', {}], reduce);
            }, Exception);
        });
        it('String', function () {
            assert.throws(function () {
                invoke([new StringConstructor(''), {}], reduce);
            }, Exception);
        });
        it('regexp', function () {
            assert.throws(function () {
                invoke([/ /, {}], reduce);
            }, Exception);
        });
        it('non plain object', function () {
            function Constructor() {
                this.field = true;
            }
            assert.throws(function () {
                invoke([new Constructor(), {}], reduce);
            }, Exception);
        });
    });
});
