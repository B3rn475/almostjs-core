// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global describe, it*/
"use strict";

var assert = require('assert'),
    async = require('async'),
    sinon = require('sinon'),
    createReducer = require('../lib/reducer');

function noop() { return undefined; }

describe('Reducer', function () {
    it('should be a function', function () {
        assert.equal(typeof createReducer, 'function');
    });
    it('should accept 1 argument', function () {
        assert.equal(createReducer.length, 1);
    });
    describe('Creation', function () {
        it('should return a function', function () {
            var reducer = createReducer();
            assert.equal(typeof reducer, 'function');
        });
        it('should throw if bad config', function () {
            assert.throws(function () { createReducer(''); });
            assert.throws(function () { createReducer(0); });
            assert.throws(function () { createReducer(1); });
            assert.throws(function () { createReducer({prop: null}); });
            assert.throws(function () { createReducer({prop: {}}); });
            assert.throws(function () { createReducer({prop: / /}); });
            assert.throws(function () { createReducer({prop: ''}); });
            assert.throws(function () { createReducer({prop: 0}); });
            assert.throws(function () { createReducer({prop: 1}); });
        });
    });
    describe('Invocation', function () {
        it('should work with not objects', function () {
            var reduced = createReducer()([]);
            assert.equal(typeof reduced, 'object');
        });
        it('should work with 1 object', function () {
            var value = {},
                reduced = createReducer()([{prop: value}]);
            assert.equal(typeof reduced, 'object');
            assert.equal(Array.isArray(reduced.prop), true);
            assert.equal(reduced.prop.length, 1);
            assert.equal(reduced.prop[0], value);
        });
        it('should not change the date by default', function () {
            var value1 = {},
                value2 = {},
                reduced = createReducer()([{prop: value1}, {prop: value2}]);
            assert.equal(typeof reduced, 'object');
            assert.equal(Array.isArray(reduced.prop), true);
            assert.equal(reduced.prop.length, 2);
            assert.equal(reduced.prop[0], value1);
            assert.equal(reduced.prop[1], value2);
        });
    });
    describe('Methods', function () {
        it('should use first', function () {
            var values = [{prop: 1}, {prop: 0}, {prop: 2}],
                reduced = createReducer({prop: 'first'})(values);
            assert.equal(typeof reduced, 'object');
            assert.equal(reduced.prop, values[0].prop);
        });
        it('should use last', function () {
            var values = [{prop: 2}, {prop: 0}, {prop: 1}],
                reduced = createReducer({prop: 'last'})(values);
            assert.equal(typeof reduced, 'object');
            assert.equal(reduced.prop, values[2].prop);
        });
        it('should use min', function () {
            var values = [{prop: 2}, {prop: 0}, {prop: 1}],
                reduced = createReducer({prop: 'min'})(values);
            assert.equal(typeof reduced, 'object');
            assert.equal(reduced.prop, values[1].prop);
        });
        it('should use max', function () {
            var values = [{prop: 0}, {prop: 2}, {prop: 1}],
                reduced = createReducer({prop: 'max'})(values);
            assert.equal(typeof reduced, 'object');
            assert.equal(reduced.prop, values[1].prop);
        });
        it('should use concat', function () {
            var value1 = {},
                value2 = {},
                reduced = createReducer({prop: 'concat'})([{prop: value1}, {prop: value2}]);
            assert.equal(typeof reduced, 'object');
            assert.equal(Array.isArray(reduced.prop), true);
            assert.equal(reduced.prop.length, 2);
            assert.equal(reduced.prop[0], value1);
            assert.equal(reduced.prop[1], value2);
        });
        it('should use concat (by default)', function () {
            var value1 = {},
                value2 = {},
                reduced = createReducer({prop: undefined})([{prop: value1}, {prop: value2}]);
            assert.equal(typeof reduced, 'object');
            assert.equal(Array.isArray(reduced.prop), true);
            assert.equal(reduced.prop.length, 2);
            assert.equal(reduced.prop[0], value1);
            assert.equal(reduced.prop[1], value2);
        });
        it('should use custom', function () {
            var values = [{prop: 0}, {prop: 2}, {prop: 1}],
                custom = sinon.spy(function (values) {
                    assert.equal(Array.isArray(values), true);
                    assert.equal(values.length, 3);
                    return values[1];
                }),
                reduced = createReducer({prop: custom})(values);
            assert.equal(typeof reduced, 'object');
            assert.equal(reduced.prop, values[1].prop);
            assert.equal(custom.called, true);
        });
    });
});
