'use strict';

class RangeError extends Error {
    constructor(msg, range) {
        super(msg);
        this.name = 'RangeError';
        this.faultyRange = range;
    }
};

module.exports = {RangeError};
