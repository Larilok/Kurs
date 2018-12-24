'use strict';

const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const port = process.argv[2] || 8888;

http.createServer((request, response) => {
    const uri = url.parse(request.url).pathname;
    let filename = path.join(__dirname, uri);

    const check = (exists) => {
        if(!exists) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();
            return;
        }
        if (fs.statSync(filename).isDirectory()) filename += '/index.html';

        fs.readFile(filename, "binary", function(err, file) {
            if(err) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(err + "\n");
                response.end();
                return;
            }

            response.writeHead(200);
            response.write(file, "binary");
            response.end();
        });
    };
    check(fs.existsSync(filename));
}).listen(parseInt(port, 10));

console.log(__dirname);
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
