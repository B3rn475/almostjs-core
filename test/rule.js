// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global describe, it*/
"use strict";

var assert = require('assert'),
    async = require('async'),
    sinon = require('sinon'),
    Rule = require('../lib/rule'),
    createRule = Rule;

function noop() { return undefined; }

describe('Rule', function () {
    it('should be a function', function () {
        assert.equal(typeof Rule, 'function');
    });
    it('should accept 2 arguments', function () {
        assert.equal(Rule.length, 2);
    });
    describe('Helpers', function () {
        it('should be functions', function () {
            assert.equal(typeof Rule.always, 'function');
            assert.equal(typeof Rule.never, 'function');
        });
        it('should return true', function () {
            assert.equal(Rule.always(), true);
        });
        it('should return false', function () {
            assert.equal(Rule.never(), false);
        });
    });
    describe('Creation', function () {
        it('should return a Rule if used with new', function () {
            var rule = new Rule(noop, noop);
            assert.equal(rule instanceof Rule, true);
        });
        it('should return a Rule if used without new', function () {
            var rule = createRule(noop, noop);
            assert.equal(rule instanceof Rule, true);
        });
        it('should throw if no condition', function () {
            assert.throws(function () { createRule(undefined, noop); });
            assert.throws(function () { createRule(null, noop); });
            assert.throws(function () { createRule([], noop); });
            assert.throws(function () { createRule({}, noop); });
            assert.throws(function () { createRule('', noop); });
            assert.throws(function () { createRule(/ /, noop); });
            assert.throws(function () { createRule(0, noop); });
            assert.throws(function () { createRule(1, noop); });
        });
        it('should throw if no body', function () {
            assert.throws(function () { createRule(noop); });
            assert.throws(function () { createRule(noop, undefined); });
            assert.throws(function () { createRule(noop, null); });
            assert.throws(function () { createRule(noop, []); });
            assert.throws(function () { createRule(noop, {}); });
            assert.throws(function () { createRule(noop, ''); });
            assert.throws(function () { createRule(noop, / /); });
            assert.throws(function () { createRule(noop, 0); });
            assert.throws(function () { createRule(noop, 1); });
        });
        it('should not invoke parameters during initialization', function () {
            var condition = sinon.spy(),
                body = sinon.spy();
            createRule(condition, body);
            assert.equal(condition.called, false);
            assert.equal(body.called, false);
        });
    });
    describe('Invocation', function () {
        it('should invoke condition (once)', function () {
            var condition = sinon.spy(),
                body = sinon.spy(),
                rule = createRule(condition, body);
            rule.invoke();
            assert.equal(condition.called, true);
            assert.equal(condition.calledOnce, true);
        });
        it('should not invoke body', function () {
            var condition = sinon.spy(),
                body = sinon.spy(),
                rule = createRule(condition, body);
            rule.invoke();
            assert.equal(body.called, false);
        });
        it('should invoke body (once)', function () {
            var condition = sinon.spy(function () { return true; }),
                body = sinon.spy(),
                rule = createRule(condition, body);
            rule.invoke();
            assert.equal(body.called, true);
            assert.equal(body.calledOnce, true);
        });
        it('should invoke condition first', function () {
            var condition = sinon.spy(function () { return true; }),
                body = sinon.spy(function () {
                    assert.equal(condition.called, true);
                }),
                rule = createRule(condition, body);
            rule.invoke();
            assert.equal(condition.calledOnce, true);
        });
        it('should return body result', function () {
            var result = {},
                condition = sinon.spy(function () { return true; }),
                body = sinon.spy(function () { return result; }),
                rule = createRule(condition, body);
            assert.equal(rule.invoke(), result);
        });
    });

});
