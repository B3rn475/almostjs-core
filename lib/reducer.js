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
    if (arguments.length < 1) { error = 'element was not expected'; }
    return reduce(function () { throw new Exception(error); }, null);
}

function single(error) {
    if (arguments.length < 1) { error = 'a single element was expected'; }
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

function createGroupByReducer(key, policy) {
    return function (accumulator, object) {
        var group = object[key];
        if (accumulator.hasOwnProperty(group)) {
            accumulator[group] = policy(accumulator[group], object);
        } else if (policy.hasOwnProperty('accumulator')) {
            accumulator[group] = policy(_.cloneDeep(policy.accumulator), object);
        } else {
            accumulator[group] = object;
        }
        return accumulator;
    };
}

function groupBy(key, policy) {
    if (arguments.length < 1) {
        throw new Exception('missing group by key configuration');
    }
    if (arguments.length < 2) { policy = concat(); }
    return reduce(createGroupByReducer(key, policy), {}, function (accumulated) {
        if (!policy.hasOwnProperty('terminate')) { return accumulated; }
        return _.mapValues(accumulated, function (value) {
            return policy.terminate(value);
        });
    });
}

function reduceBy(key, policy) {
    if (arguments.length < 1) {
        throw new Exception('missing group by key configuration');
    }
    if (arguments.length < 2) { policy = merge(); }
    return reduce(createGroupByReducer(key, policy), {}, function (accumulated) {
        var chain = _(accumulated).values();
        if (policy.hasOwnProperty('terminate')) {
            chain = chain.map(function (value) {
                return policy.terminate(value);
            });
        }
        return chain.value();
    });
}

function _flattenUnpack(status) {
    return status && status.accumulated;
}

function _flattenTerminate(policy) {
    if (policy.hasOwnProperty('terminate')) {
        return function (status) {
            return policy.terminate(_flattenUnpack(status));
        };
    }
    return _flattenUnpack;
}

function _flattenReducer(policy, mapper) {
    function iteratee(status, value) {
        value = mapper(value);
        if (value.length) {
            if (!status.started) {
                if (policy.hasOwnProperty('accumulator')) {
                    status.accumulated = _.cloneDeep(policy.accumulator);
                } else {
                    status.accumulated = _.first(value);
                    value = _.tail(value);
                }
                status.started = true;
            }
            status.accumulated = _.reduce(value, policy, status.accumulated);
        }
        return status;
    }
    return reduce(iteratee, {}, _flattenTerminate(policy));
}

function flatten(policy) {
    if (arguments.length < 1) {
        policy = concat();
    }
    if (typeof policy !== 'function') {
        throw new Exception('invalid policy');
    }
    return _flattenReducer(policy, function (value) {
        if (_.isArray(value)) {
            return value;
        }
        return [value];
    });
}

function flattenDeep(policy) {
    if (arguments.length < 1) {
        policy = concat();
    }
    if (typeof policy !== 'function') {
        throw new Exception('invalid policy');
    }
    return _flattenReducer(policy, function (value) {
        if (_.isArray(value)) {
            return _.flattenDeep(value);
        }
        return [value];
    });
}

module.exports = {
    reduce: reduce,
    reduceBy: reduceBy,
    none: none,
    single: single,
    first: first,
    last: last,
    merge: merge,
    groupBy: groupBy,
    concat: concat,
    flatten: flatten,
    flattenDeep: flattenDeep
};
