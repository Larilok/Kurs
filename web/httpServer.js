'use strict';

const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
// const buff = require("buffer");

const Parser = require("./src/webParser");
const Scanner = require("../util/Scanner")
const Printer = require("../util/Printer")
const port = process.argv[2] || 4242;

http.createServer((req, res) => {
    const uri = url.parse(req.url).pathname;

    // console.log("uri", uri);
    // console.log("search", url.parse(req.url).search);

    let filename = path.join(__dirname, uri);

    // console.log("filename", filename);
    // console.log(req,res);

    if(req.method === 'POST') {
      if(uri === '/USSR'){
        let buffer;

        // console.log(req);

        req.on('data', chunk => {       
          buffer = JSON.parse(chunk);
          const scanner = new Scanner(Parser, buffer);
          new Promise((resolve) =>{
             scanner.performScan((arg) => resolve(arg));
          })
          .then((result) => {
            const printer = new Printer(result);
            res.writeHead(200, {'Context-Type': 'text/plain'});
            // console.log("\nout: ",result);
            res.write(printer.showOpenGatesMixed());
            res.end()
          })
        })
        
      };
      return;
    };
    const check = (exists) => {
      console.log("exists: ", exists,"\n");
        if(!exists) {
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not Found\n");
            res.end();
            return;
        }
        if (fs.statSync(filename).isDirectory()) filename += '/index.html';

        fs.readFile(filename, "binary", function(err, file) {
            if(err) {
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.write(err + "\n");
                res.end();
                return;
            }

            res.writeHead(200);
            res.write(file, "binary");
            res.end();
        });
    };
    check(fs.existsSync(filename));
}).listen(parseInt(port, 10));

console.log(__dirname);
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
