// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global describe, it*/
"use strict";

var _ = require('lodash'),
    assert = require('assert'),
    async = require('async'),
    sinon = require('sinon'),
    r = require('../lib/reducer'),
    Exception = require('../lib/exception');

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

describe('Reducer', function () {
    it('should be an object', function () {
        assert.equal(typeof r, 'object');
    });
    it('shouldn\'t be an array', function () {
        assert.ok(!Array.isArray(r));
    });
    describe('reduce', function () {
        it('should be a function', function () {
            assert.equal(typeof r.reduce, 'function');
        });
        it('shouldn throw with no arguments', function () {
            assert.throws(function () {
                r.reduce();
            }, Exception);
        });
        it('should throw with a non function first argument', function () {
            assert.throws(function () { r.reduce(undefined); }, Exception);
            assert.throws(function () { r.reduce(0); }, Exception);
            assert.throws(function () { r.reduce(1); }, Exception);
            assert.throws(function () { r.reduce(true); }, Exception);
            assert.throws(function () { r.reduce(false); }, Exception);
            assert.throws(function () { r.reduce({}); }, Exception);
            assert.throws(function () { r.reduce([]); }, Exception);
            assert.throws(function () { r.reduce(null); }, Exception);
            assert.throws(function () { r.reduce(''); }, Exception);
            assert.throws(function () { r.reduce('value'); }, Exception);
            assert.throws(function () { r.reduce(/ /); }, Exception);
        });
        it('should accept a function as first argument', function () {
            r.reduce(_.noop);
        });
        it('should return a function', function () {
            assert.equal(typeof r.reduce(_.noop), 'function');
        });
        it('should not return the same function', function () {
            assert.notEqual(r.reduce(_.noop), _.noop);
        });
        it('should return a function', function () {
            assert.equal(typeof r.reduce(_.noop), 'function');
        });
        it('should not invoke the function during initialization', function () {
            var accumulate = sinon.spy();
            r.reduce(accumulate);
            assert.ok(!accumulate.called);
        });
        it('should attach a copy of the accumulator', function () {
            var accumulator = {},
                reduce = r.reduce(_.noop, accumulator);
            assert.notEqual(reduce.accumulator, accumulator);
            assert.deepEqual(reduce.accumulator, accumulator);
        });
        it('should throw with a non function third argument', function () {
            assert.throws(function () { r.reduce(_.noop, null, undefined); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, 0); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, 1); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, true); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, false); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, {}); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, []); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, null); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, ''); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, 'value'); }, Exception);
            assert.throws(function () { r.reduce(_.noop, null, / /); }, Exception);
        });
        it('should accept a function as thirde argument', function () {
            r.reduce(_.noop, null, _.noop);
        });
        it('should not invoke the terminate function during initialization', function () {
            var terminate = sinon.spy();
            r.reduce(_.noop, null, terminate);
            assert.ok(!terminate.called);
        });
        it('should attach a copy of the accumulator', function () {
            var terminate = sinon.spy(),
                reduce = r.reduce(_.noop, null, terminate);
            assert.equal(reduce.terminate, terminate);
        });
        describe('should not invoke the reducer if no element is passed', function () {
            var accumulate = sinon.spy(),
                reduce = r.reduce(accumulate);
            assert.equal(_([]).reduce(reduce), undefined);
            assert.ok(!accumulate.called);
        });
        describe('should not invoke the reducer if one element is passed', function () {
            var first = {},
                accumulate = sinon.spy(),
                reduce = r.reduce(accumulate);
            assert.equal(_([first]).reduce(reduce), first);
            assert.ok(!accumulate.called);
        });
        describe('should invoke the reducer if two elements are passed', function () {
            var first = {},
                second = {},
                result = {},
                accumulate = sinon.spy(function (accumulated, value) {
                    assert.equal(accumulated, first);
                    assert.equal(value, second);
                    return result;
                }),
                reduce = r.reduce(accumulate);
            assert.equal(_([first, second]).reduce(reduce), result);
            assert.ok(accumulate.calledOnce);
        });
        describe('should invoke the reducer if one element and the accumulator are passed', function () {
            var first = {},
                accumulator = {},
                result = {},
                accumulate = sinon.spy(function (accumulated, value) {
                    assert.equal(accumulated, accumulator);
                    assert.equal(value, first);
                    return result;
                }),
                reduce = r.reduce(accumulate, accumulator);
            assert.equal(_([first]).reduce(reduce, accumulator), result);
            assert.ok(accumulate.calledOnce);
        });
    });
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
                assert.deepEqual(invoke([], reduce), []);
            });
            it('should return an array of one element', function () {
                var element = {},
                    reduce = r.concat();
                assert.deepEqual(invoke([element], reduce), [element]);
            });
            it('should return all the elements', function () {
                var first = {$first: 1},
                    second = {$second: 1},
                    reduce = r.concat();
                assert.deepEqual(invoke([first, second], reduce), [first, second]);
            });
            it('shouldn\'t flatten', function () {
                var first = {$first: 1},
                    second = {$second: 1},
                    reduce = r.concat();
                assert.deepEqual(invoke([first, [second]], reduce), [first, [second]]);
            });
        });
        describe('flatten', function () {
            it('should be a function', function () {
                assert.equal(typeof r.flatten, 'function');
            });
            it('should return empty array with not elements', function () {
                var reduce = r.flatten();
                assert.deepEqual(invoke([], reduce), []);
            });
            it('should return an array of one element', function () {
                var element = {},
                    reduce = r.flatten();
                assert.deepEqual(invoke([element], reduce), [element]);
            });
            it('should return all the elements', function () {
                var first = {$first: 1},
                    second = {$second: 1},
                    reduce = r.flatten();
                assert.deepEqual(invoke([first, second], reduce), [first, second]);
            });
            it('should flatten one level', function () {
                var first = {$first: 1},
                    second = {$second: 1},
                    reduce = r.flatten();
                assert.deepEqual(invoke([first, [second]], reduce), [first, second]);
            });
            it('shouldn\'t flatten two levels', function () {
                var first = {$first: 1},
                    second = {$second: 1},
                    reduce = r.flatten();
                assert.deepEqual(invoke([first, [[second]]], reduce), [first, [second]]);
            });
        });
        describe('flattenDeep', function () {
            it('should be a function', function () {
                assert.equal(typeof r.flattenDeep, 'function');
            });
            it('should return empty array with not elements', function () {
                var reduce = r.flattenDeep();
                assert.deepEqual(invoke([], reduce), []);
            });
            it('should return an array of one element', function () {
                var element = {},
                    reduce = r.flattenDeep();
                assert.deepEqual(invoke([element], reduce), [element]);
            });
            it('should return all the elements', function () {
                var first = {$first: 1},
                    second = {$second: 1},
                    reduce = r.flattenDeep();
                assert.deepEqual(invoke([first, second], reduce), [first, second]);
            });
            it('should flatten one level', function () {
                var first = {$first: 1},
                    second = {$second: 1},
                    reduce = r.flattenDeep();
                assert.deepEqual(invoke([first, [second]], reduce), [first, second]);
            });
            it('should flatten two levels', function () {
                var first = {$first: 1},
                    second = {$second: 1},
                    reduce = r.flattenDeep();
                assert.deepEqual(invoke([first, [[second]]], reduce), [first, second]);
            });
        });
        describe('merge', function () {
            it('should be a function', function () {
                assert.equal(typeof r.merge, 'function');
            });
            it('should return empty object with not elements', function () {
                var reduce = r.merge();
                assert.deepEqual(invoke([], reduce), {});
            });
            it('should return a single element', function () {
                var reduce = r.merge();
                assert.deepEqual(invoke([{}], reduce), {});
            });
            it('should return an object with more elements', function () {
                var reduce = r.merge();
                assert.deepEqual(invoke([{}, {}], reduce), {});
            });
            it('should keep the last element by default', function () {
                var first = {},
                    second = {},
                    reduce = r.merge();
                assert.deepEqual(invoke([{a: first}, {a: second}], reduce), {a: second});
            });
            it('should use the default policy', function () {
                var first = {},
                    second = {},
                    reduce = r.merge(r.first());
                assert.deepEqual(invoke([{a: first}, {a: second}], reduce), {a: first});
            });
            it('should use the default policy even on single values', function () {
                var first = {},
                    reduce = r.merge(r.concat());
                assert.deepEqual(invoke([{a: first}], reduce), {a: [first]});
            });
            it('should use the overloaded policies', function () {
                var first = {},
                    second = {},
                    reduce = r.merge(r.first(), {b: r.concat()});
                assert.deepEqual(invoke([{a: first, b: second}, {a: second}], reduce), {a: first, b: [second]});
            });
            it('should use the accumulator on overloaded policies', function () {
                var first = {},
                    reduce = r.merge(r.first(), {b: r.concat()});
                assert.deepEqual(invoke([{a: first}], reduce), {a: first, b: []});
            });
        });
    });
});
