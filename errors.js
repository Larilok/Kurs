'use strict';

class BadHostNotationError extends Error {
    constructor(msg, badHost) {
        super(msg);
        this.name = 'BadHostNotationError';
        this.host = badHost;
    }
}

class RangeError extends Error {
    constructor(msg, badRange) {
        super(msg);
        this.name = 'RangeError';
        this.range = badRange[0] + '-' + badRange[1];
    }
};

module.exports = {BadHostNotationError, RangeError};
