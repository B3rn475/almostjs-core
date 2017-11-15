// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global it*/
"use strict";

var _ = require('lodash'),
    assert = require('assert'),
    r = require('../../lib/reducer');

it('should be an object', function () {
    assert.equal(typeof r, 'object');
});
it('shouldn\'t be an array', function () {
    assert.ok(!_.isArray(r));
});
