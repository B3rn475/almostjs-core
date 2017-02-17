// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true*/
"use strict";

var createTransformer = require('./lib/transformer'),
    reducers = require('./lib/reducer'),
    Exception = require('./lib/exception');


//
exports.Exception = Exception;

// Maker Functions
exports.createTransformer = createTransformer;

// Helpers
exports.reduce = reducers.reduce;
exports.none = reducers.single;
exports.single = reducers.single;
exports.first = reducers.first;
exports.last = reducers.last;
exports.concat = reducers.concat;
exports.flatten = reducers.flatten;
exports.flattenDeep = reducers.flattenDeep;
exports.merge = reducers.merge;
