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
    create = require('../lib/transformer'),
    Exception = require('../lib/exception');

describe('Transformer', function () {
    it('should be an function', function () {
        assert.equal(typeof create, 'function');
    });
    it('should throw with no arguments', function () {
        assert.throws(function () { create(); }, Exception);
    });
    it('should throw with invalid traverse', function () {
        assert.throws(function () { create(undefined); }, Exception);
        assert.throws(function () { create(null); }, Exception);
        assert.throws(function () { create(0); }, Exception);
        assert.throws(function () { create(1); }, Exception);
        assert.throws(function () { create(false); }, Exception);
        assert.throws(function () { create(true); }, Exception);
        assert.throws(function () { create(''); }, Exception);
        assert.throws(function () { create('value'); }, Exception);
        assert.throws(function () { create(/ /); }, Exception);
        assert.throws(function () { create({}); }, Exception);
    });
    it('shouldn\'t throw with missing reduce', function () {
        create(_.noop);
    });
    it('should throw with invalid reduce', function () {
        assert.throws(function () { create(_.noop, undefined); }, Exception);
        assert.throws(function () { create(_.noop, null); }, Exception);
        assert.throws(function () { create(_.noop, 0); }, Exception);
        assert.throws(function () { create(_.noop, 1); }, Exception);
        assert.throws(function () { create(_.noop, false); }, Exception);
        assert.throws(function () { create(_.noop, true); }, Exception);
        assert.throws(function () { create(_.noop, ''); }, Exception);
        assert.throws(function () { create(_.noop, 'value'); }, Exception);
        assert.throws(function () { create(_.noop, / /); }, Exception);
        assert.throws(function () { create(_.noop, {}); }, Exception);
    });
    it('should return a function', function () {
        var t = create(_.noop);
        assert.equal(typeof t, 'function');
    });
    it('should invoke the traverse function once during execution', function () {
        var input = {},
            traverse = sinon.spy(function (object, emit) {
                assert.equal(object, input);
                assert.equal(typeof emit, 'function');
            }),
            t = create(traverse);
        assert.ok(!traverse.called);
        t(input);
        assert.ok(traverse.calledOnce);
    });
    /*jslint unparam: true*/
    it('should invoke the emitted functions once during execution', function () {
        var input = {},
            e1 = sinon.spy(function (i) { assert.equal(i, input); }),
            e2 = sinon.spy(),
            traverse = function (object, emit) {
                emit(e1);
                emit([e2]);
            },
            t = create(traverse);
        t(input);
        assert.ok(e1.calledOnce);
        assert.ok(e2.calledOnce);
    });
    it('should invoke the reduce function once during execution', function () {
        var input = {},
            traverse = function (object, emit) {
                emit(function () { return {}; });
                emit(function () { return {}; });
            },
            reduce = sinon.spy(),
            t = create(traverse, reduce);
        assert.ok(!reduce.called);
        t(input);
        assert.ok(reduce.called);
    });
    /*jslint unparam: false*/
    it('should concat by default', function () {
        var first = {},
            second = {},
            input = [first, second],
            traverse = function (input, emit) {
                input.forEach(function (value) {
                    emit(function () { return value; });
                });
            },
            t = create(traverse);
        assert.deepEqual(t(input), input);
    });
    it('should follow the reduction policy', function () {
        var first = {},
            second = {},
            input = [first, second],
            traverse = function (input, emit) {
                input.forEach(function (value) {
                    emit(function () { return value; });
                });
            },
            reduce = function (accumulated) { return accumulated; },
            t = create(traverse, reduce);
        assert.equal(t(input), first);
    });
    it('should use the accumulator', function () {
        var first = {},
            input = [first],
            traverse = function (input, emit) {
                input.forEach(function (value) {
                    emit(function () { return value; });
                });
            },
            reduce = function (accumulated) { return accumulated; },
            t;
        reduce.accumulator = 1;
        t = create(traverse, reduce);
        assert.equal(t(input), reduce.accumulator);
    });
    it('should clone the accumulator', function () {
        var first = {},
            input = [first],
            traverse = function (input, emit) {
                input.forEach(function (value) {
                    emit(function () { return value; });
                });
            },
            reduce = function (accumulated) { return accumulated; },
            t;
        reduce.accumulator = [1, 2];
        t = create(traverse, reduce);
        assert.notEqual(t(input), reduce.accumulator);
        assert.deepEqual(t(input), reduce.accumulator);
    });
    it('should invoke terminate', function () {
        var first = {},
            second = {},
            input = [first, second],
            traverse = function (input, emit) {
                input.forEach(function (value) {
                    emit(function () { return value; });
                });
            },
            reduce = function (accumulated) { return accumulated; },
            t;
        reduce.terminate = sinon.spy();
        t = create(traverse, reduce);
        assert.ok(!reduce.terminate.called);
        t(input);
        assert.ok(reduce.terminate.calledOnce);
    });
    it('should forward the accumulated value to terminate', function () {
        var first = {},
            second = {},
            input = [first, second],
            traverse = function (input, emit) {
                input.forEach(function (value) {
                    emit(function () { return value; });
                });
            },
            reduce = function (accumulated) { return accumulated; },
            t;
        reduce.terminate = function (accumulated) {
            assert.equal(accumulated, first);
        };
        t = create(traverse, reduce);
        t(input);
    });
    it('should return the result of terminate', function () {
        var first = {},
            second = {},
            final = {},
            input = [first, second],
            traverse = function (input, emit) {
                input.forEach(function (value) {
                    emit(function () { return value; });
                });
            },
            reduce = function (accumulated) { return accumulated; },
            t;
        reduce.terminate = function () {
            return final;
        };
        t = create(traverse, reduce);
        assert.equal(t(input), final);
    });
});
