// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
"use strict";

var _ = require('lodash'),
    Exception = require('./exception');

function concat(chain) {
    return chain.flatten().value();
}

function makeTransformer(traverse, reduce) {
    return function (input) {
        var chain = _([]),
            final;
        traverse(input, function (subchain) { chain = chain.push(subchain); });
        chain = chain
            .flattenDeep()
            .map(function (invokable) { return invokable(input); });
        if (reduce) {
            if (reduce.hasOwnProperty('accumulator')) {
                final = chain.reduce(reduce, _.cloneDeep(reduce.accumulator));
            }
            final = chain.reduce(reduce);
            if (reduce.hasOwnProperty('terminate')) {
                return reduce.terminate(final);
            }
            return final;
        }
        return chain.value();
    };
}

function createTransformer(options) {
    if (options === undefined) { throw new Exception('missing options'); }
    if (typeof options.traverse !== 'function') {
        throw new Exception('invalid traverse function');
    }
    if (options.hasOwnProperty('reduce') && typeof options.reduce !== 'function') {
        throw new Exception('invalid reduce function');
    }

    return makeTransformer(options.traverse, options.reduce);
}

module.exports = createTransformer;
