// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global describe, it*/
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

describe('flatten', function () {
    it('should be a function', function () {
        assert.equal(typeof r.flatten, 'function');
    });
    it('should create a function', function () {
        assert.equal(typeof r.flatten(), 'function');
    });
    it('should throw with a non function first argument', function () {
        assert.throws(_.partial(r.flatten, undefined), Exception);
        assert.throws(_.partial(r.flatten, 0), Exception);
        assert.throws(_.partial(r.flatten, 1), Exception);
        assert.throws(_.partial(r.flatten, true), Exception);
        assert.throws(_.partial(r.flatten, false), Exception);
        assert.throws(_.partial(r.flatten, {}), Exception);
        assert.throws(_.partial(r.flatten, []), Exception);
        assert.throws(_.partial(r.flatten, null), Exception);
        assert.throws(_.partial(r.flatten, ''), Exception);
        assert.throws(_.partial(r.flatten, 'value'), Exception);
        assert.throws(_.partial(r.flatten, / /), Exception);
    });
    it('should not invoke accumulate during construction', function () {
        var accumulate = sinon.spy(),
            policy = r.reduce(accumulate);
        r.flatten(policy);
        assert.ok(accumulate.notCalled);
    });
    it('should not invoke terminate during construction', function () {
        var terminate = sinon.spy(),
            policy = r.reduce(sinon.spy(), {}, terminate);
        r.flatten(policy);
        assert.ok(terminate.notCalled);
    });
    it('should not invoke accumulate if no element is passed', function () {
        var accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flatten(policy);
        assert.equal(invoke([], reduce), undefined);
        assert.ok(accumulate.notCalled);
    });
    it('should not invoke accumulate if no element is passed one level deep', function () {
        var accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flatten(policy);
        assert.equal(invoke([[], []], reduce), undefined);
        assert.ok(accumulate.notCalled);
    });
    it('should invoke accumulate if no element is passed two levels deep', function () {
        var accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flatten(policy);
        assert.equal(invoke([[[]], [[]]], reduce), undefined);
        assert.ok(accumulate.called);
    });
    it('should not invoke accumulate if one element is passed', function () {
        var first = {},
            accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flatten(policy);
        assert.equal(invoke([first], reduce), first);
        assert.ok(accumulate.notCalled);
    });
    it('should not invoke accumulate if one element is passed one level deep', function () {
        var first = {},
            accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.flatten(policy);
        assert.equal(invoke([[first], []], reduce), first);
        assert.ok(accumulate.notCalled);
    });
    it('should invoke accumulate if two elements are passed', function () {
        var first = {},
            second = {},
            result = {},
            accumulate = sinon.spy(function () { return result; }),
            policy = r.reduce(accumulate),
            reduce = r.flatten(policy);
        assert.equal(invoke([first, second], reduce), result);
        assert.ok(accumulate.calledOnce);
        assert.ok(accumulate.calledWith(first, second));
    });
    it('should invoke accumulate if two elements are passed one level deep', function () {
        var first = {},
            second = {},
            result = {},
            accumulate = sinon.spy(function () { return result; }),
            policy = r.reduce(accumulate),
            reduce = r.flatten(policy);
        assert.equal(invoke([[first], [second], []], reduce), result);
        assert.ok(accumulate.calledOnce);
        assert.ok(accumulate.calledWith(first, second));
    });
    it('should invoke accumulate if two elements are passed two levels deep', function () {
        var first = {},
            second = [{}, []],
            result = {},
            accumulate = sinon.spy(function () { return result; }),
            policy = r.reduce(accumulate),
            reduce = r.flatten(policy);
        assert.equal(invoke([[first], [second], []], reduce), result);
        assert.ok(accumulate.calledOnce);
        assert.ok(accumulate.calledWith(first, second));
    });
    it('should invoke accumulate if one element and the accumulator are passed', function () {
        var first = {},
            accumulator = {accumulator: true},
            result = {},
            accumulate = sinon.spy(function () { return result; }),
            policy = r.reduce(accumulate, accumulator),
            reduce = r.flatten(policy);
        assert.equal(invoke([first], reduce), result);
        assert.ok(accumulate.calledOnce);
        assert.ok(accumulate.calledWith(sinon.match.object, first));
        assert.notEqual(accumulate.getCall(0).args[0], accumulator);
        assert.deepEqual(accumulate.getCall(0).args[0], accumulator);

    });
    it('should invoke accumulate if one element and the accumulator are passed one level deep', function () {
        var first = {},
            accumulator = {accumulator: true},
            result = {},
            accumulate = sinon.spy(function () { return result; }),
            policy = r.reduce(accumulate, accumulator),
            reduce = r.flatten(policy);
        assert.equal(invoke([[first], []], reduce), result);
        assert.ok(accumulate.calledOnce);
        assert.ok(accumulate.calledWith(sinon.match.object, first));
        assert.notEqual(accumulate.getCall(0).args[0], accumulator);
        assert.deepEqual(accumulate.getCall(0).args[0], accumulator);
    });
    it('should invoke accumulate if one element and the accumulator are passed two levels deep', function () {
        var first = [{}, {}],
            accumulator = {accumulator: true},
            result = {},
            accumulate = sinon.spy(function () { return result; }),
            policy = r.reduce(accumulate, accumulator),
            reduce = r.flatten(policy);
        assert.equal(invoke([[first], []], reduce), result);
        assert.ok(accumulate.calledOnce);
        assert.ok(accumulate.calledWith(sinon.match.object, first));
        assert.notEqual(accumulate.getCall(0).args[0], accumulator);
        assert.deepEqual(accumulate.getCall(0).args[0], accumulator);
    });
    it('should invoke terminate if no elements are passed', function () {
        var terminate = sinon.spy(),
            accumulator = {a: 1},
            policy = r.reduce(_.noop, accumulator, terminate),
            reduce = r.flatten(policy);
        assert.equal(invoke([], reduce), undefined);
        assert.ok(terminate.calledOnce);
        assert.notEqual(terminate.getCall(0).args[0], accumulator);
        assert.deepEqual(terminate.getCall(0).args[0], accumulator);
    });
    it('should invoke terminate if no elements are passed one level deep', function () {
        var terminate = sinon.spy(),
            accumulator = {a: 1},
            policy = r.reduce(_.noop, accumulator, terminate),
            reduce = r.flatten(policy);
        assert.equal(invoke([[], []], reduce), undefined);
        assert.ok(terminate.calledOnce);
        assert.notEqual(terminate.getCall(0).args[0], accumulator);
        assert.deepEqual(terminate.getCall(0).args[0], accumulator);
    });
    it('should invoke terminate if no elements are passed two levels deep', function () {
        var terminate = sinon.spy(),
            accumulator = {a: 1},
            policy = r.reduce(_.noop, accumulator, terminate),
            reduce = r.flatten(policy);
        assert.equal(invoke([[[]], []], reduce), undefined);
        assert.ok(terminate.calledOnce);
        assert.notEqual(terminate.getCall(0).args[0], accumulator);
        assert.deepEqual(terminate.getCall(0).args[0], undefined);
    });
    it('should return terminate result', function () {
        var result = {},
            terminate = sinon.spy(function () {
                return result;
            }),
            policy = r.reduce(_.identity, undefined, terminate),
            reduce = r.flatten(policy);
        assert.equal(invoke([{}], reduce), result);
        assert.ok(terminate.calledOnce);
    });
    it('should concat by default', function () {
        var first = {},
            second = {},
            third = [{}, {}],
            reduce = r.flatten(),
            result = invoke([first, [], [second], [third]], reduce);
        assert.ok(_.isArray(result));
        assert.equal(result.length, 3);
        assert.equal(result[0], first);
        assert.equal(result[1], second);
        assert.equal(result[2], third);
    });
});
