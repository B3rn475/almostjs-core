// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true*/
"use strict";

var Transformer = require('./lib/transformer'),
    Rule = require('./lib/rule'),
    Reducer = require('./lib/reducer'),
    Exception = require('./lib/exception');

// Constructors
exports.Transformer = Transformer;
exports.Rule = Rule;
exports.Exception = Exception;

// Maker Functions
exports.createTransformer = Transformer;
exports.createRule = Rule;

// Helpers
exports.first = Reducer.first;
exports.last = Reducer.last;
exports.min = Reducer.min;
exports.max = Reducer.max;
exports.concat = Reducer.concat;
