// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
"use strict";

var _ = require('lodash'),
    Exception = require('./exception');

function reduce(iteratee, accumulator, terminate) {
    if (arguments.length === 0) {
        throw new Exception('missing iteratee function');
    }
    if (typeof iteratee !== 'function') {
        throw new Exception('invalid iteratee function');
    }
    function accumulate(accumulator, value) {
        return iteratee(accumulator, value);
    }
    if (arguments.length > 1) { accumulate.accumulator = _.cloneDeep(accumulator); }
    if (arguments.length > 2) {
        if (typeof terminate !== 'function') {
            throw new Exception('invalid terminate function');
        }
        accumulate.terminate = terminate;
    }
    return accumulate;
}

function none(error) {
    if (arguments.length > 0) { error = 'element was not expected'; }
    return reduce(function () { throw new Exception(error); }, null);
}

function single(error) {
    if (arguments.length > 0) { error = 'a single element was expected'; }
    return reduce(function () { throw new Exception(error); });
}


var _first = reduce(function (accumulator) { return accumulator; });
function first() { return _first; }

/*jslint unparam: true*/
var _last = reduce(function (accumulator, value) { return value; });
/*jslint unparam: false*/
function last() { return _last; }

function concat_accumulate(array, value) { array.push(value); return array; }
var _concat = reduce(concat_accumulate, []);
function concat() { return _concat; }

function flatten_terminate(array) { return _.flatten(array); }
var _flatten = reduce(concat_accumulate, [], flatten_terminate);
function flatten() { return _flatten; }

function flattenDeep_terminate(array) { return _.flattenDeep(array); }
var _flattenDeep = reduce(concat_accumulate, [], flattenDeep_terminate);
function flattenDeep() { return _flattenDeep; }

function createAccumulator(specials) {
    if (typeof specials !== 'object') {
        throw new Exception('invalid keys merge configuration');
    }
    var accumulator = {};
    _.forEach(specials, function (reduce, key) {
        if (reduce.hasOwnProperty('accumulator')) {
            accumulator[key] = _.cloneDeep(reduce.accumulator);
        }
    });
    return accumulator;
}
function merge(policy, specials) {
    if (arguments.length < 1) { policy = last(); }
    if (arguments.length < 2) { specials = {}; }
    return reduce(function (accumulator, object) {
        _.forEach(object, function (value, key) {
            var reduce = specials[key] || policy;
            if (accumulator.hasOwnProperty(key)) {
                accumulator[key] = reduce(accumulator[key], value);
            } else if (reduce.hasOwnProperty('accumulator')) {
                accumulator[key] = reduce(_.cloneDeep(reduce.accumulator), value);
            } else {
                accumulator[key] = value;
            }
        });
        return accumulator;
    }, createAccumulator(specials), function (accumulated) {
        return _.mapValues(accumulated, function (value, key) {
            var reduce = specials[key] || policy;
            if (reduce.hasOwnProperty('terminate')) {
                return reduce.terminate(value);
            }
            return value;
        });
    });
}

module.exports = {
    reduce: reduce,
    none: none,
    single: single,
    first: first,
    last: last,
    merge: merge,
    concat: concat,
    flatten: flatten,
    flattenDeep: flattenDeep
};
