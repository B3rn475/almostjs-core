// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
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

var _mergeOrSingle = reduce(function _reduce(status, value) {
    status.n_accumulated += 1;
    if (status.n_accumulated === 1) {
        if (_isPlainObjectOrArray(value)) {
            status.accumulated = {};
            status.isArray = status.isArray && _.isArray(value);
        } else {
            status.accumulated = value;
            status.isSimpleValue = true;
            return status;
        }
    } else {
        if (status.n_accumulated === 2 && status.isSimpleValue) {
            throw new Exception('fields with a merge policy should always be objects or arrays');
        }
        if (!_isPlainObjectOrArray(value)) {
            throw new Exception('fields with a merge policy should always be objects or arrays');
        }
    }
    status.isArray = status.isArray && _.isArray(value);
    _.forEach(value, function (value, key) {
        if (status.accumulated.hasOwnProperty(key)) {
            status.accumulated[key] = _reduce(status.accumulated[key], value);
        } else {
            status.accumulated[key] = _reduce({n_accumulated: 0, isArray: true}, value);
        }
    });
    return status;
}, {n_accumulated: 0, isArray: true}, function _terminate(status) {
    if (status.isSimpleValue) {
        return status.accumulated;
    }
    if (status.isArray && status.n_accumulated) {
        return _.map(status.accumulated, _terminate);
    }
    return _.mapValues(status.accumulated, _terminate);
});

function mergeOrSingle() {
    return _mergeOrSingle;
}

function createStatus(specials, mayBeArray) {
    if (typeof specials !== 'object') {
        throw new Exception('invalid keys merge configuration');
    }
    var status = {
        n_accumulated: 0,
        accumulated: {},
        isArray: mayBeArray
    };
    _.forEach(specials, function (reduce, key) {
        if (reduce.hasOwnProperty('accumulator')) {
            status.accumulated[key] = reduce.accumulator;
        }
    });
    return status;
}

function _mergeCheckObjectOrArray(status, object) {
    if (_isPlainObjectOrArray(object)) {
        status.isArray = status.isArray && _.isArray(object);
    } else {
        throw new Exception('fields with a merge policy should always be objects or arrays');
    }
}

function _mergeCheckObject(status, object) {
    _.noop(status);
    if (!_.isPlainObject(object)) {
        throw new Exception('fields with a merge policy with specials should always be objects');
    }
}

function merge(policy, specials) {
    if (arguments.length < 1) { policy = mergeOrSingle(); }
    var check,
        status;
    if (arguments.length < 2) {
        specials = {};
        status = createStatus(specials, true);
        check = _mergeCheckObjectOrArray;
    } else {
        status = createStatus(specials, false);
        check = _mergeCheckObject;
    }
    return reduce(function (status, object) {
        status.n_accumulated += 1;
        check(status, object);
        _.forEach(object, function (value, key) {
            var reduce = specials[key] || policy;
            if (status.accumulated.hasOwnProperty(key)) {
                status.accumulated[key] = reduce(status.accumulated[key], value);
            } else if (reduce.hasOwnProperty('accumulator')) {
                status.accumulated[key] = reduce(_.cloneDeep(reduce.accumulator), value);
            } else {
                status.accumulated[key] = value;
            }
        });
        return status;
    }, status, function (status) {
        var result = (status.isArray && status.n_accumulated) ? [] : {};
        _.forEach(status.accumulated, function (value, key) {
            var reduce = specials[key] || policy;
            if (reduce.hasOwnProperty('terminate')) {
                value = reduce.terminate(value);
            }
            if (value !== undefined) {
                result[key] = value;
            }
        });
        return result;
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
    return status.accumulated;
}

function _flattenTerminate(policy) {
    if (policy.hasOwnProperty('terminate')) {
        return function (status) {
            return policy.terminate(status.accumulated);
        };
    }
    return _flattenUnpack;
}

function _flattenReducer(policy, mapper) {
    function flattenAccumulate(status, value) {
        value = mapper(value);
        if (value.length) {
            status.accumulated = _.reduce(value, policy, status.accumulated);
        }
        return status;
    }
    var status = {};
    if (policy.hasOwnProperty('accumulator')) {
        status.started = true;
        status.accumulated = _.cloneDeep(policy.accumulator);
        status.accumulate = flattenAccumulate;
    } else {
        status.accumulate = function (status, value) {
            status.started = true;
            value = mapper(value);
            status.accumulated = _.first(value);
            value = _.tail(value);
            status.accumulate = flattenAccumulate;
            return flattenAccumulate(status, value);
        };
    }
    function accumulate(status, value) {
        return status.accumulate(status, value);
    }
    return reduce(accumulate, status, _flattenTerminate(policy));
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

function _lazyUnpack(status) {
    if (status.started) {
        return status.accumulated;
    }
}

function _lazyTerminate(policy) {
    if (policy.hasOwnProperty('terminate')) {
        return function (status) {
            if (status.started) {
                return policy.terminate(status.accumulated);
            }
        };
    }
    return _lazyUnpack;
}

function lazy(policy) {
    if (arguments.length < 1) {
        throw new Exception('missing policy');
    }
    if (typeof policy !== 'function') {
        throw new Exception('invalid policy');
    }
    function finalAccumulate(status, value) {
        status.accumulated = policy(status.accumulated, value);
        return status;
    }
    var status = {
        accumulate: function (status, value) {
            status.started = true;
            status.accumulate = finalAccumulate;
            if (policy.hasOwnProperty('accumulator')) {
                status.accumulated = policy.accumulator;
            } else {
                status.accumulated = value;
            }
            return status;
        }
    };
    function accumulate(status, value) {
        return status.accumulate(status, value);
    }
    return reduce(accumulate, status, _lazyTerminate(policy));
}

module.exports = {
    reduce: reduce,
    reduceBy: reduceBy,
    none: none,
    single: single,
    first: first,
    last: last,
    lazy: lazy,
    merge: merge,
    mergeOrSingle: mergeOrSingle,
    groupBy: groupBy,
    concat: concat,
    flatten: flatten,
    flattenDeep: flattenDeep
};
