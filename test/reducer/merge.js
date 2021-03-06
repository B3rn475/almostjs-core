// Copyright (c) 2018, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global describe, it, before*/
"use strict";

var _ = require('lodash'),
    assert = require('assert'),
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

var NumberConstructor = Number,
    StringConstructor = String,
    BooleanConstructor = Boolean;

describe('merge', function () {
    it('should be a function', function () {
        assert.equal(typeof r.merge, 'function');
    });
    it('should return empty object with not elements', function () {
        var reduce = r.merge();
        assert.deepStrictEqual(invoke([], reduce), {});
    });
    it('should return a single element', function () {
        var reduce = r.merge();
        assert.deepStrictEqual(invoke([{}], reduce), {});
    });
    it('should return an object with more elements', function () {
        var reduce = r.merge();
        assert.deepStrictEqual(invoke([{}, {}], reduce), {});
    });
    it('should return an array if all elements are arrays', function () {
        var reduce = r.merge(),
            result = invoke([[], []], reduce);
        assert.deepStrictEqual(result, []);
        assert.ok(_.isArray(result));
    });
    it('should return an array if all elements are arrays 1 deep', function () {
        var reduce = r.merge(),
            result = invoke([{a: []}, {a: []}], reduce);
        assert.deepStrictEqual(result, {a: []});
        assert.ok(_.isArray(result.a));
    });
    it('should return an object if elements are mixed object or arrays', function () {
        var reduce = r.merge();
        assert.ok(!_.isArray(invoke([{a: []}, {a: {}}], reduce)));
        assert.ok(!_.isArray(invoke([{a: {}}, {a: []}], reduce)));
    });
    it('should return an object if elements are mixed object or arrays 1 deep', function () {
        var reduce = r.merge();
        assert.ok(!_.isArray(invoke([{a: []}, {a: {}}], reduce), {a: {}}));
        assert.ok(!_.isArray(invoke([{a: {}}, {a: []}], reduce), {a: {}}));
    });

    it('should deep merge elements by default', function () {
        var reduce = r.merge();
        assert.deepStrictEqual(invoke([{a: {b: {c: 1}}}, {a: {b: {d: 2}}}], reduce),
            {a: {b: {c: 1, d: 2}}});
    });
    describe('should throw exception if merging non plain objects', function () {
        var reduce;
        before(function () {
            reduce = r.merge();
        });
        it('both elements', function () {
            assert.throws(function () {
                invoke([1, 2], reduce);
            }, Exception);
        });
        it('first element', function () {
            assert.throws(function () {
                invoke([1, {}], reduce);
            }, Exception);
        });
        it('second element', function () {
            assert.throws(function () {
                invoke([{}, 1], reduce);
            }, Exception);
        });
        it('undefined', function () {
            assert.throws(function () {
                invoke([undefined, {}], reduce);
            }, Exception);
        });
        it('null', function () {
            assert.throws(function () {
                invoke([null, {}], reduce);
            }, Exception);
        });
        it('number', function () {
            assert.throws(function () {
                invoke([1, {}], reduce);
            }, Exception);
        });
        it('Number', function () {
            assert.throws(function () {
                invoke([new NumberConstructor(0), {}], reduce);
            }, Exception);
        });
        it('boolean', function () {
            assert.throws(function () {
                invoke([true, {}], reduce);
            }, Exception);
        });
        it('Boolean', function () {
            assert.throws(function () {
                invoke([new BooleanConstructor(false), {}], reduce);
            }, Exception);
        });
        it('string', function () {
            assert.throws(function () {
                invoke(['', {}], reduce);
            }, Exception);
        });
        it('String', function () {
            assert.throws(function () {
                invoke([new StringConstructor(''), {}], reduce);
            }, Exception);
        });
        it('regexp', function () {
            assert.throws(function () {
                invoke([/ /, {}], reduce);
            }, Exception);
        });
        it('non plain object', function () {
            function Constructor() {
                this.field = true;
            }
            assert.throws(function () {
                invoke([new Constructor(), {}], reduce);
            }, Exception);
        });
    });
    describe('should throw exception if merging with specials an array', function () {
        var reduce = r.merge(r.mergeOrSingle, {});
        assert.throws(function () {
            invoke([[], {}], reduce);
        }, Exception);
    });
    it('should use the default policy', function () {
        var first = {a: 1},
            second = {b: 2},
            reduce = r.merge(r.first());
        assert.deepStrictEqual(invoke([{a: first}, {a: second}], reduce),
            {a: first});
    });
    it('should use the default policy even on single values', function () {
        var first = {},
            reduce = r.merge(r.concat());
        assert.deepStrictEqual(invoke([{a: first}], reduce),
            {a: [first]});
    });
    it('should use the terminate on the policy', function () {
        var first = {},
            second = {},
            third = {},
            reduce = r.merge(r.flatten());
        assert.deepStrictEqual(
            invoke([{a: first}, {a: [second, third]}], reduce),
            {a: [first, second, third]}
        );
    });
    describe('should throw with invalid overloaded policies', function () {
        it('undefined', function () {
            assert.throws(function () {
                r.merge(r.first(), undefined);
            });
        });
        it('bool (false)', function () {
            assert.throws(function () {
                r.merge(r.first(), false);
            });
        });
        it('bool (true)', function () {
            assert.throws(function () {
                r.merge(r.first(), true);
            });
        });
        it('string (empty)', function () {
            assert.throws(function () {
                r.merge(r.first(), '');
            });
        });
        it('string', function () {
            assert.throws(function () {
                r.merge(r.first(), 'string');
            });
        });
        it('number', function () {
            assert.throws(function () {
                r.merge(r.first(), 0);
            });
        });
    });
    it('should use the overloaded policies', function () {
        var first = {},
            second = {},
            reduce = r.merge(r.first(), {b: r.last()}),
            result = invoke([{a: first, b: first}, {a: second}], reduce);
        assert.ok(_.isPlainObject(result));
        assert.deepStrictEqual(result, {a: first, b: second});
    });
    it('should initialize accumulation if no data is provided', function () {
        var first = {},
            second = {},
            third = {},
            reduce = r.merge(r.first(), {b: r.concat()}),
            result = invoke([{a: first}, {a: [second, third]}], reduce);
        assert.ok(_.isPlainObject(result));
        assert.deepStrictEqual(result, {a: first, b: []});
    });
    it('should use the terminate on overloaded policies', function () {
        var first = {},
            second = {},
            third = {},
            reduce = r.merge(r.first(), {a: r.flatten()}),
            result = invoke([{a: first}, {a: [second, third]}], reduce);
        assert.ok(_.isPlainObject(result));
        assert.deepStrictEqual(result, {a: [first, second, third]});
    });
    it('should not store overloaded policies if reducer returns undefined', function () {
        var first = {},
            second = {},
            third = {},
            reduce = r.merge(r.first(), {a: r.reduce(_.noop)}),
            result = invoke([{a: first}, {a: [second, third]}], reduce);
        assert.ok(_.isPlainObject(result));
        assert.deepStrictEqual(result, {});
    });
});
