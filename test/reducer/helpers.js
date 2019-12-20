// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global describe, it, before*/
"use strict";

var _ = require('lodash'),
    assert = require('assert'),
    sinon = require('sinon'),
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

describe('helpers', function () {
    describe('none', function () {
        it('should be a function', function () {
            assert.equal(typeof r.none, 'function');
        });
        it('should return undefined with not elements', function () {
            var reduce = r.none();
            assert.equal(invoke([], reduce), undefined);
        });
        it('should throw with one element', function () {
            var reduce = r.none();
            assert.throws(function () {
                invoke([1], reduce);
            });
        });
        it('should throw with more elements', function () {
            var reduce = r.none();
            assert.throws(function () {
                invoke([1, 2], reduce);
            });
        });
        it('should throw a message', function () {
            var reduce = r.none();
            try {
                invoke([1], reduce);
            } catch (e) {
                assert.equal(typeof e.message, 'string');
            }
        });
        it('should throw the forwarded message', function () {
            var message = {},
                reduce = r.none(message);
            try {
                invoke([1], reduce);
            } catch (e) {
                assert.equal(e.message, message);
            }
        });
    });
    describe('single', function () {
        it('should be a function', function () {
            assert.equal(typeof r.single, 'function');
        });
        it('should return undefined with not elements', function () {
            var reduce = r.single();
            assert.equal(invoke([], reduce), undefined);
        });
        it('should return a single element', function () {
            var element = {},
                reduce = r.single();
            assert.equal(invoke([element], reduce), element);
        });
        it('should throw with more elements', function () {
            var reduce = r.single();
            assert.throws(function () {
                invoke([1, 2], reduce);
            });
        });
        it('should throw a message', function () {
            var reduce = r.single();
            try {
                invoke([], reduce);
            } catch (e) {
                assert.equal(typeof e.message, 'string');
            }
        });
        it('should throw the forwarded message', function () {
            var message = {},
                reduce = r.single(message);
            try {
                invoke([], reduce);
            } catch (e) {
                assert.equal(e.message, message);
            }
        });
    });
    describe('first', function () {
        it('should be a function', function () {
            assert.equal(typeof r.first, 'function');
        });
        it('should return undefined with not elements', function () {
            var reduce = r.first();
            assert.equal(invoke([], reduce), undefined);
        });
        it('should return a single element', function () {
            var element = {},
                reduce = r.first();
            assert.equal(invoke([element], reduce), element);
        });
        it('should return the first with more elements', function () {
            var first = {},
                second = {},
                reduce = r.first();
            assert.equal(invoke([first, second], reduce), first);
        });
    });
    describe('last', function () {
        it('should be a function', function () {
            assert.equal(typeof r.last, 'function');
        });
        it('should return undefined with not elements', function () {
            var reduce = r.last();
            assert.equal(invoke([], reduce), undefined);
        });
        it('should return a single element', function () {
            var element = {},
                reduce = r.last();
            assert.equal(invoke([element], reduce), element);
        });
        it('should return the last with more elements', function () {
            var first = {},
                second = {},
                reduce = r.last();
            assert.equal(invoke([first, second], reduce), second);
        });
    });
    describe('concat', function () {
        it('should be a function', function () {
            assert.equal(typeof r.concat, 'function');
        });
        it('should return empty array with not elements', function () {
            var reduce = r.concat();
            assert.deepStrictEqual(invoke([], reduce), []);
        });
        it('should return an array of one element', function () {
            var element = {},
                reduce = r.concat();
            assert.deepStrictEqual(invoke([element], reduce), [element]);
        });
        it('should return all the elements', function () {
            var first = {$first: 1},
                second = {$second: 1},
                reduce = r.concat();
            assert.deepStrictEqual(invoke([first, second], reduce), [first, second]);
        });
        it('should not flatten', function () {
            var first = {$first: 1},
                second = {$second: 1},
                reduce = r.concat();
            assert.deepStrictEqual(invoke([first, [second]], reduce), [first, [second]]);
        });
    });
    describe('reduceBy', function () {
        it('should be a function', function () {
            assert.equal(typeof r.reduceBy, 'function');
        });
        it('should throw with missing key', function () {
            assert.throws(function () { r.reduceBy(); });
        });
        it('should return empty array with not elements', function () {
            var reduce = r.reduceBy('a');
            assert.equal(invoke([], reduce).length, 0);
        });
        it('should return a single element', function () {
            var reduce = r.reduceBy('b');
            assert.equal(invoke([{b: 1}], reduce).length, 1);
        });
        it('should return an object with same keys', function () {
            var reduce = r.reduceBy('c');
            assert.equal(invoke([{c: 1}, {c: 1}], reduce).length, 1);
        });
        it('should return all the same elements with different keys', function () {
            var reduce = r.reduceBy('d');
            assert.equal(invoke([{d: 1}, {d: 2}], reduce).length, 2);
        });
        it('should merge by default', function () {
            var first = {},
                second = {},
                reduce = r.reduceBy('d');
            assert.deepStrictEqual(invoke([{d: 1, a: first}, {d: 1, b: second}], reduce),
                [{d: 1, a: first, b: second}]);
        });
        it('should use the policy', function () {
            var first = {},
                second = {},
                reduce = r.reduceBy('e', r.first());
            assert.deepStrictEqual(invoke([{e: 1, a: first}, {e: 1, a: second}], reduce),
                [{e: 1, a: first}]);
        });
        it(
            'should use the default policy even on single values',
            function () {
                var first = {},
                    reduce = r.reduceBy('f', r.concat());
                assert.deepStrictEqual(invoke([{f: 1, a: first}], reduce),
                    [[{f: 1, a: first}]]);
            }
        );
        it('should use the terminate on the policy', function () {
            var first = {},
                second = {},
                reduce = r.reduceBy('g', r.flatten());
            assert.deepStrictEqual(
                invoke([{g: 1, a: first}, {g: 1, a: second}], reduce),
                [[{g: 1, a: first}, {g: 1, a: second}]]
            );
        });
    });
    describe('groupBy', function () {
        it('should be a function', function () {
            assert.equal(typeof r.groupBy, 'function');
        });
        it('should throw with missing key', function () {
            assert.throws(function () { r.groupBy(); });
        });
        it('should return empty object', function () {
            var reduce = r.groupBy('a');
            assert.deepStrictEqual(invoke([], reduce), {});
        });
        it('should return a single key', function () {
            var reduce = r.groupBy('b');
            assert.deepStrictEqual(invoke([{b: 1}], reduce), {'1': [{b: 1}]});
        });
        it('should return a single key with both elements', function () {
            var first = {},
                second = {},
                reduce = r.groupBy('c');
            assert.deepStrictEqual(invoke([{c: 1, a: first}, {c: 1, b: second}], reduce),
                {'1': [{c: 1, a: first}, {c: 1, b: second}]});
        });
        it('should return all the same elements with different keys', function () {
            var first = {},
                second = {},
                reduce = r.groupBy('d');
            assert.deepStrictEqual(invoke([{d: 1, a: first}, {d: 2, a: second}], reduce),
                {'1': [{d: 1, a: first}], '2': [{d: 2, a: second}]});
        });
        it('should concat by default', function () {
            var first = {},
                second = {},
                reduce = r.groupBy('d');
            assert.deepStrictEqual(invoke([{d: 1, a: first}, {d: 1, b: second}], reduce),
                {'1': [{d: 1, a: first}, {d: 1, b: second}]});
        });
        it('should use the policy', function () {
            var first = {},
                second = {},
                reduce = r.groupBy('e', r.first());
            assert.deepStrictEqual(invoke([{e: 1, a: first}, {e: 1, a: second}], reduce),
                {'1': {e: 1, a: first}});
        });
        it('should use the default policy even on single values', function () {
            var first = {},
                reduce = r.groupBy('f', r.merge());
            assert.deepStrictEqual(invoke([{f: 1, a: first}], reduce),
                {'1': {f: 1, a: first}});
        });
        it('should use the terminate on the policy', function () {
            var first = {},
                second = {},
                reduce = r.groupBy('g', r.flatten());
            assert.deepStrictEqual(
                invoke([{g: 1, a: first}, {g: 1, a: second}], reduce),
                {'1': [{g: 1, a: first}, {g: 1, a: second}]}
            );
        });
    });
});
