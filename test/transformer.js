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
    createTransformer = require('../lib/transformer'),
    Exception = require('../lib/exception');

describe('Reducer', function () {
    it('should be an function', function () {
        assert.equal(typeof createTransformer, 'function');
    });
    it('should throw with no arguments', function () {
        assert.throws(function () { createTransformer(); }, Exception);
    });
    it('should throw with invalid argument', function () {
        assert.throws(function () {
            createTransformer(undefined);
        }, Exception);
        assert.throws(function () {
            createTransformer(null);
        }, Exception);
        assert.throws(function () {
            createTransformer(0);
        }, Exception);
        assert.throws(function () {
            createTransformer(1);
        }, Exception);
        assert.throws(function () {
            createTransformer(false);
        }, Exception);
        assert.throws(function () {
            createTransformer(true);
        }, Exception);
        assert.throws(function () {
            createTransformer('');
        }, Exception);
        assert.throws(function () {
            createTransformer('value');
        }, Exception);
        assert.throws(function () {
            createTransformer(/ /);
        }, Exception);
    });
    it('should throw with missing traverse', function () {
        assert.throws(function () {
            createTransformer({reduce: _.noop});
        }, Exception);
    });
    it('should throw with invalid traverse', function () {
        assert.throws(function () {
            createTransformer({traverse: undefined, reduce: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({traverse: null, reduce: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({traverse: 0, reduce: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({traverse: 1, reduce: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({traverse: false, reduce: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({traverse: true, reduce: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({traverse: '', reduce: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({traverse: 'value', reduce: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({traverse: / /, reduce: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({traverse: {}, reduce: _.noop});
        }, Exception);
    });
    it('shouldn\'t throw with missing reduce', function () {
        createTransformer({traverse: _.noop});
    });
    it('should throw with invalid traverse', function () {
        assert.throws(function () {
            createTransformer({reduce: undefined, traverse: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({reduce: null, traverse: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({reduce: 0, traverse: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({reduce: 1, traverse: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({reduce: false, traverse: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({reduce: true, traverse: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({reduce: '', traverse: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({reduce: 'value', traverse: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({reduce: / /, traverse: _.noop});
        }, Exception);
        assert.throws(function () {
            createTransformer({reduce: {}, traverse: _.noop});
        }, Exception);
    });
    it('should return a function', function () {
        var t = createTransformer({traverse: _.noop});
        assert.equal(typeof t, 'function');
    });
    it('should invoke the traverse function once during execution', function () {
        var input = {},
            traverse = sinon.spy(function (object, emit) {
                assert.equal(object, input);
                assert.equal(typeof emit, 'function');
            }),
            t = createTransformer({traverse: traverse});
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
            t = createTransformer({traverse: traverse});
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
            t = createTransformer({traverse: traverse, reduce: reduce});
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
            t = createTransformer({traverse: traverse});
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
            t = createTransformer({traverse: traverse, reduce: reduce});
        assert.deepEqual(t(input), first);
    });
});
