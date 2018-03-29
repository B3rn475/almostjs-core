// Copyright (c) 2018, the ALMOsT project authors. Please see the
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

describe('lazy', function () {
    it('should be a function', function () {
        assert.equal(typeof r.lazy, 'function');
    });
    it('should throw without argument', function () {
        assert.throws(r.lazy, Exception);
    });
    it('should throw with a non function first argument', function () {
        assert.throws(_.partial(r.lazy, undefined), Exception);
        assert.throws(_.partial(r.lazy, 0), Exception);
        assert.throws(_.partial(r.lazy, 1), Exception);
        assert.throws(_.partial(r.lazy, true), Exception);
        assert.throws(_.partial(r.lazy, false), Exception);
        assert.throws(_.partial(r.lazy, {}), Exception);
        assert.throws(_.partial(r.lazy, []), Exception);
        assert.throws(_.partial(r.lazy, null), Exception);
        assert.throws(_.partial(r.lazy, ''), Exception);
        assert.throws(_.partial(r.lazy, 'value'), Exception);
        assert.throws(_.partial(r.lazy, / /), Exception);
    });
    it('should not invoke accumulate during construction', function () {
        var accumulate = sinon.spy(),
            policy = r.reduce(accumulate);
        r.lazy(policy);
        assert.ok(accumulate.notCalled);
    });
    it('should not invoke terminate during construction', function () {
        var terminate = sinon.spy(),
            policy = r.reduce(sinon.spy(), {}, terminate);
        r.lazy(policy);
        assert.ok(terminate.notCalled);
    });
    it('should not invoke accumulate if no element is passed', function () {
        var accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.lazy(policy);
        assert.equal(invoke([], reduce), undefined);
        assert.ok(accumulate.notCalled);
    });
    it('should not invoke accumulate if one element is passed', function () {
        var first = {first: true},
            accumulate = sinon.spy(),
            policy = r.reduce(accumulate),
            reduce = r.lazy(policy);
        assert.equal(invoke([first], reduce), first);
        assert.ok(accumulate.notCalled);
    });
    it('should not invoke accumulate if two elements are passed', function () {
        var first = {first: true},
            second = {second: true},
            accumulate = sinon.spy(_.identity),
            policy = r.reduce(accumulate),
            reduce = r.lazy(policy);
        assert.equal(invoke([first, second], reduce), first);
        assert.ok(accumulate.calledOnce);
        assert.ok(accumulate.calledWith(first, second));
    });
    it('should not invoke terminate if no element is passed', function () {
        var terminate = sinon.spy(),
            policy = r.reduce(_.noop, undefined, terminate),
            reduce = r.lazy(policy);
        assert.equal(invoke([], reduce), undefined);
        assert.ok(terminate.notCalled);
    });
    it('should invoke terminate if one element is passed', function () {
        var result = {result: true},
            accumulator = {accumulator: true},
            terminate = sinon.spy(function () { return result; }),
            policy = r.reduce(_.identity, accumulator, terminate),
            reduce = r.lazy(policy);
        assert.equal(invoke([{}], reduce), result);
        assert.ok(terminate.calledOnce);
        assert.notEqual(terminate.getCall(0).args[0], accumulator);
        assert.deepEqual(terminate.getCall(0).args[0], accumulator);
    });
});
