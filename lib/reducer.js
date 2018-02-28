// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
"use strict";

var _ = require('lodash'),
    Exception = require('./exception');

function _isPlainObjectOrArray(value) {
    return _.isArray(value) || _.isPlainObject(value);
}

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

var _mergeOrSingle = reduce(function _reduce(accumulator, value) {
    accumulator.accumulated += 1;
    if (accumulator.accumulated === 1) {
        if (_isPlainObjectOrArray(value)) {
            accumulator.value = {};
            accumulator.isArray = _.isArray(value);
        } else {
            accumulator.value = value;
            accumulator.isSimpleValue = true;
            return accumulator;
        }
    } else {
        if (accumulator.accumulated === 2 && accumulator.isSimpleValue) {
            throw new Exception('fields with a merge policy should always be objects or arrays');
        }
        if (!_isPlainObjectOrArray(value)) {
            throw new Exception('fields with a merge policy should always be objects or arrays');
        }
    }
    accumulator.isArray = accumulator.isArray && _.isArray(value);
    _.forEach(value, function (value, key) {
        if (accumulator.value.hasOwnProperty(key)) {
            accumulator.value[key] = _reduce(accumulator.value[key], value);
        } else {
            accumulator.value[key] = _reduce({accumulated: 0}, value);
        }
    });
    return accumulator;
}, {accumulated: 0}, function _terminate(accumulated) {
    if (accumulated.isSimpleValue) {
        return accumulated.value;
    }
    if (accumulated.isArray) {
        return _.map(accumulated.value, _terminate);
    }
    return _.mapValues(accumulated.value, _terminate);
});

function mergeOrSingle() {
    return _mergeOrSingle;
}

function createAccumulator(specials) {
    if (typeof specials !== 'object') {
        throw new Exception('invalid keys merge configuration');
    }
    var accumulator = {
        value: {},
        isArray: true,
        started: {}
    };
    _.forEach(specials, function (reduce, key) {
        if (reduce.hasOwnProperty('accumulator')) {
            accumulator.value[key] = _.cloneDeep(reduce.accumulator);
        }
    });
    return accumulator;
}

function merge(policy, specials) {
    if (arguments.length < 1) { policy = mergeOrSingle(); }
    if (arguments.length < 2) { specials = {}; }
    return reduce(function (accumulator, object) {
        if (_isPlainObjectOrArray(object)) {
            accumulator.isArray = accumulator.isArray && _.isArray(object);
        } else {
            throw new Exception('fields with a merge policy should always be objects or arrays');
        }
        _.forEach(object, function (value, key) {
            var reduce = specials[key] || policy;
            if (accumulator.value.hasOwnProperty(key)) {
                accumulator.value[key] = reduce(accumulator.value[key], value);
            } else if (reduce.hasOwnProperty('accumulator')) {
                accumulator.value[key] = reduce(_.cloneDeep(reduce.accumulator), value);
            } else {
                accumulator.value[key] = value;
            }
            accumulator.started[key] = true;
        });
        return accumulator;
    }, createAccumulator(specials), function (accumulated) {
        var object = accumulated.isArray ? [] : {};
        _.forEach(accumulated.value, function (value, key) {
            if (specials[key] && !accumulated.started[key]) {
                return;
            }
            var reduce = specials[key] || policy;
            if (reduce.hasOwnProperty('terminate')) {
                object[key] = reduce.terminate(value);
                return;
            }
            object[key] = value;
        });
        return object;
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
    var specials = {};
    specials[key] = first();
    if (arguments.length < 2) { policy = merge(mergeOrSingle(), specials); }
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
    if (status.started) {
        return status && status.accumulated;
    }
}

function _flattenTerminate(policy) {
    if (policy.hasOwnProperty('terminate')) {
        return function (status) {
            if (status.started) {
                return policy.terminate(status && status.accumulated);
            }
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
    mergeOrSingle: mergeOrSingle,
    groupBy: groupBy,
    concat: concat,
    flatten: flatten,
    flattenDeep: flattenDeep
};
