'use strict';

const Scanner = require("../util/scanner");
const Parser = require("./parser");

/*Main()*/{
    let scanner = new Scanner(Parser,process.argv);
    scanner.performScan();
}
