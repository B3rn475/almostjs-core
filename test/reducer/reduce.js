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
        assert.throws(_.partial(r.reduce, undefined), Exception);
        assert.throws(_.partial(r.reduce, 0), Exception);
        assert.throws(_.partial(r.reduce, 1), Exception);
        assert.throws(_.partial(r.reduce, true), Exception);
        assert.throws(_.partial(r.reduce, false), Exception);
        assert.throws(_.partial(r.reduce, {}), Exception);
        assert.throws(_.partial(r.reduce, []), Exception);
        assert.throws(_.partial(r.reduce, null), Exception);
        assert.throws(_.partial(r.reduce, ''), Exception);
        assert.throws(_.partial(r.reduce, 'value'), Exception);
        assert.throws(_.partial(r.reduce, / /), Exception);
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
        var accumulator = {accumulator: true},
            reduce = r.reduce(_.noop, accumulator);
        assert.notEqual(reduce.accumulator, accumulator);
        assert.deepEqual(reduce.accumulator, accumulator);
    });
    it('should throw with a non function third argument', function () {
        var partial = _.partial(r.reduce, _.noop, null);
        assert.throws(_.partial(partial, undefined), Exception);
        assert.throws(_.partial(partial, 0), Exception);
        assert.throws(_.partial(partial, 1), Exception);
        assert.throws(_.partial(partial, true), Exception);
        assert.throws(_.partial(partial, false), Exception);
        assert.throws(_.partial(partial, {}), Exception);
        assert.throws(_.partial(partial, []), Exception);
        assert.throws(_.partial(partial, null), Exception);
        assert.throws(_.partial(partial, ''), Exception);
        assert.throws(_.partial(partial, 'value'), Exception);
        assert.throws(_.partial(partial, / /), Exception);
    });
    it('should accept a function as third argument', function () {
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
    it('should not invoke the reducer if no element is passed', function () {
        var accumulate = sinon.spy(),
            reduce = r.reduce(accumulate);
        assert.equal(invoke([], reduce), undefined);
        assert.ok(!accumulate.called);
    });
    it('should not invoke the reducer if one element is passed', function () {
        var first = {},
            accumulate = sinon.spy(),
            reduce = r.reduce(accumulate);
        assert.equal(invoke([first], reduce), first);
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
            reduce = r.reduce(accumulate);
        assert.equal(invoke([first, second], reduce), result);
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
            reduce = r.reduce(accumulate, accumulator);
        assert.equal(invoke([first], reduce), result);
        assert.ok(accumulate.calledOnce);
    });
    it('should invoke terminate even if no elements are passed', function () {
        var terminate = sinon.spy(),
            reduce = r.reduce(_.noop, undefined, terminate);
        assert.equal(invoke([], reduce), undefined);
        assert.ok(terminate.calledOnce);
    });
    it('should return terminate result', function () {
        var result = [],
            accumulator = {},
            terminate = sinon.spy(function (accumulated) {
                assert.notEqual(accumulated, accumulator);
                assert.deepEqual(accumulated, accumulator);
                return result;
            }),
            reduce = r.reduce(_.noop, accumulator, terminate);
        assert.equal(invoke([], reduce), result);
    });
});
