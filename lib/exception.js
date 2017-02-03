// Copyright (c) 2016, the ALMOsT project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by a MIT-style license that can be found in the LICENSE file.
/*jslint node: true, nomen: true */
"use strict";

function Exception(message) {
    if (!(this instanceof Exception)) { return new Exception(message); }
    this.message = message;
}

Exception.prototype = Error.prototype;

module.exports = Exception;
