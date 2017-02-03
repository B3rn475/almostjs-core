// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
"use strict";

var _ = require('lodash'),
    createReducer = require('./reducer'),
    Exception = require('./exception');

function compactRules(model, element, relation) {
    return {
        model: (model || []).slice(),
        element: (element || []).slice(),
        relation: (relation || []).slice(),
    };
}

function makeTransformer(rules, reducer) {
    function mapValue(values) {
        return reducer(_.map(values, 1));
    }
    return function (model) {
        function applyModel(rule) { return rule.invoke(model); }
        function applyElement(rule) {
            return _.chain(model.elements)
                .flatMap(function (element) {
                    return rule.invoke(element, model);
                })
                .filter()
                .value();
        }
        function applyRelation(rule) {
            return _.chain(model.relations)
                .flatMap(function (relation) {
                    return rule.invoke(relation, model);
                })
                .filter()
                .value();
        }
        return _.chain(_.map(rules.model, applyModel))
            .concat(_.map(rules.element, applyElement))
            .concat(_.map(rules.relation, applyRelation))
            .flatten()
            .flatMap(_.toPairs)
            .groupBy(0)
            .mapValues(mapValue)
            .value();
    };
}

function Transformer(options) {
    if (!(this instanceof Transformer)) { return new Transformer(options); }

    if (options === undefined) { throw new Exception('missing options'); }
    if (options.model !== undefined && !Array.isArray(options.model)) {
        throw new Exception('invalid model rules array');
    }
    if (options.element !== undefined && !Array.isArray(options.element)) {
        throw new Exception('invalid element rules array');
    }
    if (options.relation !== undefined && !Array.isArray(options.relation)) {
        throw new Exception('invalid relation rules array');
    }
    if (options.reduce !== undefined && typeof options.reduce !== 'object') {
        throw new Exception('invalid reduce configuration');
    }

    var rules = compactRules(options.model, options.element, options.relation),
        reducer = createReducer(options.reduce);

    return makeTransformer(rules, reducer);
}

module.exports = Transformer;
