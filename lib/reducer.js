// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
"use strict";

var _ = require('lodash'),
    Exception = require('./exception');

var first = _.head,
    last = _.last,
    min = _.min,
    max = _.max,
    concat = _.identity;

function toArray(value) {
    if (Array.isArray(value)) { return value; }
    return [value];
}

function makeCompacter(policy, property) {
    if (typeof policy === 'function') { return policy; }
    switch (policy) {
    case 'first':
        return first;
    case 'last':
        return last;
    case 'min':
        return min;
    case 'max':
        return max;
    case 'concat':
    case undefined:
        return concat;
    default:
        throw new Exception('invalid reduce configuration for "' + property + '"');
    }
}

function makeReducer(compacters) {
    var mapValue = function (zip, property) {
        var values = _.chain(zip)
            .map(1)
            .map(toArray)
            .flatten()
            .value();
        if (compacters[property]) {
            return compacters[property](values);
        }
        return values;
    };
    return function (values) {
        return _.chain(values)
            .map(_.toPairs)
            .flatten()
            .groupBy(0)
            .mapValues(mapValue)
            .value();
    };
}

function Reducer(config) {
    if (config !== undefined && typeof config !== 'object') {
        throw new Exception('invalid configuration');
    }
    var compacters = _.mapValues(config || {}, makeCompacter);
    return makeReducer(compacters);
}

// Helpers
Reducer.first = first;
Reducer.last = last;
Reducer.min = min;
Reducer.max = max;
Reducer.concat = concat;

module.exports = Reducer;
