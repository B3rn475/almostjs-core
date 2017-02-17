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

function createTransformer(traverse, reduce) {
    if (arguments.length < 1) { throw new Exception('missing traverse function'); }
    if (typeof traverse !== 'function') {
        throw new Exception('invalid traverse function');
    }
    if (arguments.length > 1 && typeof reduce !== 'function') {
        throw new Exception('invalid reduce function');
    }

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
            } else {
                final = chain.reduce(reduce);
            }
            if (reduce.hasOwnProperty('terminate')) {
                return reduce.terminate(final);
            }
            return final;
        }
        return chain.value();
    };
}

module.exports = createTransformer;
