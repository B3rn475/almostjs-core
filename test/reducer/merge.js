// Copyright (c) 2018, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global describe, it, before*/
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

var NumberConstructor = Number,
    StringConstructor = String,
    BooleanConstructor = Boolean;

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
    it('should deep merge elements by default', function () {
        var reduce = r.merge();
        assert.deepEqual(invoke([{a: {b: {c: 1}}}, {a: {b: {d: 2}}}], reduce),
            {a: {b: {c: 1, d: 2}}});
    });
    describe('should throw exception if merging non plain objects', function () {
        var reduce;
        before(function () {
            reduce = r.merge();
        });
        describe('top level', function () {
            it('both elements', function () {
                assert.throws(function () {
                    invoke([1, 2], reduce);
                });
            });
            it('first element', function () {
                assert.throws(function () {
                    invoke([1, {}], reduce);
                });
            });
            it('second element', function () {
                assert.throws(function () {
                    invoke([{}, 1], reduce);
                });
            });
            it('undefined', function () {
                assert.throws(function () {
                    invoke([undefined, {}], reduce);
                });
            });
            it('null', function () {
                assert.throws(function () {
                    invoke([null, {}], reduce);
                });
            });
            it('number', function () {
                assert.throws(function () {
                    invoke([1, {}], reduce);
                });
            });
            it('Number', function () {
                assert.throws(function () {
                    invoke([new NumberConstructor(0), {}], reduce);
                });
            });
            it('boolean', function () {
                assert.throws(function () {
                    invoke([true, {}], reduce);
                });
            });
            it('Boolean', function () {
                assert.throws(function () {
                    invoke([new BooleanConstructor(false), {}], reduce);
                });
            });
            it('string', function () {
                assert.throws(function () {
                    invoke(['', {}], reduce);
                });
            });
            it('String', function () {
                assert.throws(function () {
                    invoke([new StringConstructor(''), {}], reduce);
                });
            });
            it('regexp', function () {
                assert.throws(function () {
                    invoke([/ /, {}], reduce);
                });
            });
            it('non plain object', function () {
                function Constructor() {
                    this.field = true;
                }
                assert.throws(function () {
                    invoke([new Constructor(), {}], reduce);
                });
            });
        });
        describe('nested level', function () {
            it('both elements', function () {
                assert.throws(function () {
                    invoke([{a: 1}, {a: 1}], reduce);
                });
            });
            it('first element', function () {
                assert.throws(function () {
                    invoke([{a: 1}, {a: {}}], reduce);
                });
            });
            it('second element', function () {
                assert.throws(function () {
                    invoke([{a: {}}, {a: 1}], reduce);
                });
            });
            it('undefined', function () {
                assert.throws(function () {
                    invoke([{a: undefined}, {a: {}}], reduce);
                });
            });
            it('null', function () {
                assert.throws(function () {
                    invoke([{a: null}, {a: {}}], reduce);
                });
            });
            it('number', function () {
                assert.throws(function () {
                    invoke([{a: 1}, {a: {}}], reduce);
                });
            });
            it('Number', function () {
                assert.throws(function () {
                    invoke([{a: new NumberConstructor(0)}, {a: {}}], reduce);
                });
            });
            it('boolean', function () {
                assert.throws(function () {
                    invoke([{a: true}, {a: {}}], reduce);
                });
            });
            it('Boolean', function () {
                assert.throws(function () {
                    invoke([{a: new BooleanConstructor(false)}, {a: {}}], reduce);
                });
            });
            it('string', function () {
                assert.throws(function () {
                    invoke([{a: ''}, {a: {}}], reduce);
                });
            });
            it('String', function () {
                assert.throws(function () {
                    invoke([{a: new StringConstructor('')}, {a: {}}], reduce);
                });
            });
            it('regexp', function () {
                assert.throws(function () {
                    invoke([{a: / /}, {a: {}}], reduce);
                });
            });
            it('non plain object', function () {
                function Constructor() {
                    this.field = true;
                }
                assert.throws(function () {
                    invoke([{a: new Constructor()}, {a: {}}], reduce);
                });
            });
        });
    });
    it('should use the default policy', function () {
        var first = {a: 1},
            second = {b: 2},
            reduce = r.merge(r.first());
        assert.deepEqual(invoke([{a: first}, {a: second}], reduce),
            {a: first});
    });
    it(
        'should use the default policy even on single values',
        function () {
            var first = {},
                reduce = r.merge(r.concat());
            assert.deepEqual(invoke([{a: first}], reduce),
                {a: [first]});
        }
    );
    it('should use the terminate on the policy', function () {
        var first = {},
            second = {},
            third = {},
            reduce = r.merge(r.flatten());
        assert.deepEqual(
            invoke([{a: first}, {a: [second, third]}], reduce),
            {a: [first, second, third]}
        );
    });
    describe(
        'should throw with invalid overloaded policies',
        function () {
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
        }
    );
    it('should use the overloaded policies', function () {
        var first = {},
            second = {},
            reduce = r.merge(r.first(), {b: r.last()});
        assert.deepEqual(
            invoke([{a: first, b: first}, {a: second}], reduce),
            {a: first, b: second}
        );
    });
    it('should not initialize accumulation if no data is provided', function () {
        var first = {},
            second = {},
            third = {},
            reduce = r.merge(r.first(), {b: r.flatten()});
        assert.deepEqual(
            invoke([{a: first}, {a: [second, third]}], reduce),
            {a: first}
        );
    });
    it('should use the terminate on overloaded policies', function () {
        var first = {},
            second = {},
            third = {},
            reduce = r.merge(r.first(), {a: r.flatten()});
        assert.deepEqual(
            invoke([{a: first}, {a: [second, third]}], reduce),
            {a: [first, second, third]}
        );
    });
});
