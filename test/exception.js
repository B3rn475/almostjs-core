// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true*/
/*global describe, it*/
"use strict";

var assert = require('assert'),
    Exception = require('../lib/exception'),
    createException = Exception;

describe('Exception', function () {
    it('should be a function', function () {
        assert.equal(typeof Exception, 'function');
    });
    it('should be invocable with new', function () {
        var exception = new Exception();
        assert.equal(typeof exception, 'object');
        assert.ok(exception instanceof Exception);
    });
    it('should be invocable without new', function () {
        var exception = createException();
        assert.equal(typeof exception, 'object');
        assert.ok(exception instanceof Exception);
    });
    it('should not set message by default', function () {
        var exception = createException();
        assert.equal(exception.message, undefined);
    });
    it('should set message', function () {
        var message = {},
            exception = createException(message);
        assert.equal(exception.message, message);
    });
});
