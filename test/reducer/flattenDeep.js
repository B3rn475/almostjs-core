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

describe('flattenDeep', function () {
    it('should be a function', function () {
        assert.equal(typeof r.flattenDeep, 'function');
    });
    it('should create a function', function () {
        assert.equal(typeof r.flattenDeep(), 'function');
    });
    it('should throw with a non function first argument', function () {
        assert.throws(_.partial(r.flattenDeep, undefined), Exception);
        assert.throws(_.partial(r.flattenDeep, 0), Exception);
        assert.throws(_.partial(r.flattenDeep, 1), Exception);
        assert.throws(_.partial(r.flattenDeep, true), Exception);
        assert.throws(_.partial(r.flattenDeep, false), Exception);
        assert.throws(_.partial(r.flattenDeep, {}), Exception);
        assert.throws(_.partial(r.flattenDeep, []), Exception);
        assert.throws(_.partial(r.flattenDeep, null), Exception);
        assert.throws(_.partial(r.flattenDeep, ''), Exception);
        assert.throws(_.partial(r.flattenDeep, 'value'), Exception);
        assert.throws(_.partial(r.flattenDeep, / /), Exception);
    });
    it('should not invoke the policy during construction', function () {
        var iteratee = sinon.spy(),
            policy = r.reduce(iteratee);
        r.flattenDeep(policy);
        assert.ok(!iteratee.called);
    });
    it('should not invoke terminate during construction', function () {
        var terminate = sinon.spy(),
            policy = r.reduce(sinon.spy(), {}, terminate);
        r.flattenDeep(policy);
        assert.ok(!terminate.called);
    });
    it('should not invoke the reducer if no element is passed', function () {
        var accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([], reduce), undefined);
        assert.ok(!accumulate.called);
    });
    it('should not invoke the reducer if no element is passed one level deep', function () {
        var accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([[], []], reduce), undefined);
        assert.ok(!accumulate.called);
    });
    it('should not invoke the reducer if no element is passed two levels deep', function () {
        var accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([[[]], [[]]], reduce), undefined);
        assert.ok(!accumulate.called);
    });
    it('should not invoke the reducer if one element is passed', function () {
        var first = {},
            accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([first], reduce), first);
        assert.ok(!accumulate.called);
    });
    it('should not invoke the reducer if one element is passed one level deep', function () {
        var first = {},
            accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([[first], []], reduce), first);
        assert.ok(!accumulate.called);
    });
    it('should invoke the reducer if two elements are passed', function () {
        var first = {},
            second = {},
            result = {},
            accumulate = sinon.spy(function (accumulated, value) {
                assert.equal(accumulated, first);
                assert.equal(value, second);
                return result;
            }),
            policy = r.reduce(accumulate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([first, second], reduce), result);
        assert.ok(accumulate.calledOnce);
    });
    it('should invoke the reducer if two elements are passed one level deep', function () {
        var first = {},
            second = {},
            result = {},
            accumulate = sinon.spy(function (accumulated, value) {
                assert.equal(accumulated, first);
                assert.equal(value, second);
                return result;
            }),
            policy = r.reduce(accumulate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([[first], [second], []], reduce), result);
        assert.ok(accumulate.calledOnce);
    });
    it('should invoke the reducer if two elements are passed two levels deep', function () {
        var first = {},
            second = {},
            result = {},
            accumulate = sinon.spy(function (accumulated, value) {
                assert.equal(accumulated, first);
                assert.equal(value, second);
                return result;
            }),
            policy = r.reduce(accumulate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([[first], [[second, []]], []], reduce), result);
        assert.ok(accumulate.calledOnce);
    });
    it('should invoke the reducer if one element and the accumulator are passed', function () {
        var first = {},
            accumulator = {accumulator: true},
            result = {},
            accumulate = sinon.spy(function (accumulated, value) {
                assert.notEqual(accumulated, accumulator);
                assert.deepEqual(accumulated, accumulator);
                assert.equal(value, first);
                return result;
            }),
            policy = r.reduce(accumulate, accumulator),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([first], reduce), result);
        assert.ok(accumulate.calledOnce);
    });
    it('should invoke the reducer if one element and the accumulator are passed one level deep', function () {
        var first = {},
            accumulator = {accumulator: true},
            result = {},
            accumulate = sinon.spy(function (accumulated, value) {
                assert.notEqual(accumulated, accumulator);
                assert.deepEqual(accumulated, accumulator);
                assert.equal(value, first);
                return result;
            }),
            policy = r.reduce(accumulate, accumulator),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([[first], []], reduce), result);
        assert.ok(accumulate.calledOnce);
    });
    it('should invoke the reducer if one element and the accumulator are passed two levels deep', function () {
        var first = {},
            accumulator = {accumulator: true},
            result = {},
            accumulate = sinon.spy(function (accumulated, value) {
                assert.notEqual(accumulated, accumulator);
                assert.deepEqual(accumulated, accumulator);
                assert.equal(value, first);
                return result;
            }),
            policy = r.reduce(accumulate, accumulator),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([[[first]], []], reduce), result);
        assert.ok(accumulate.calledOnce);
    });
    it('should not invoke terminate if no elements are passed', function () {
        var terminate = sinon.spy(),
            policy = r.reduce(_.noop, undefined, terminate),
            reduce = r.flatten(policy);
        assert.equal(invoke([], reduce), undefined);
        assert.ok(!terminate.called);
    });
    it('should not invoke terminate if no elements are passed one level deep', function () {
        var terminate = sinon.spy(),
            policy = r.reduce(_.noop, undefined, terminate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([[], []], reduce), undefined);
        assert.ok(!terminate.called);
    });
    it('should not invoke terminate if no elements are passed two level deep', function () {
        var terminate = sinon.spy(),
            policy = r.reduce(_.noop, undefined, terminate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([[[]], []], reduce), undefined);
        assert.ok(!terminate.called);
    });
    it('should return terminate result', function () {
        var result = {},
            accumulator = {accumulator: true},
            terminate = sinon.spy(function (accumulated) {
                assert.notEqual(accumulated, accumulator);
                assert.deepEqual(accumulated, accumulator);
                return result;
            }),
            policy = r.reduce(_.identity, accumulator, terminate),
            reduce = r.flattenDeep(policy);
        assert.equal(invoke([{}], reduce), result);
        assert.ok(terminate.calledOnce);
    });
    it('should concat by default', function () {
        var first = {},
            second = {},
            third = {},
            reduce = r.flattenDeep(),
            result = invoke([first, [], [[second], [third]]], reduce);
        assert.ok(_.isArray(result));
        assert.equal(result.length, 3);
        assert.equal(result[0], first);
        assert.equal(result[1], second);
        assert.equal(result[2], third);
    });
});
