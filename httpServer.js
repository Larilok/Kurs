'use strict';

const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");

// const parser = require("./src/webParser");
const port = process.argv[2] || 8888;

http.createServer((req, res) => {
    const uri = url.parse(req.url).pathname;
    console.log("uri", uri);
    console.log("search", url.parse(req.url).search);
    let filename = path.join(__dirname, uri);
    console.log("filename", filename);
    
    if(req.method === 'POST') {
      if(uri === '/USSR'){
        let buffer = '';
        // console.log(req);
        req.on('data', chunk => {
          console.log(typeof(chunk));
          fs.readFile(chunk, "binary", (err,data) =>{
          if(err) console.log(err);
          // console.log("Data:" , data);
          console.log("Data:" , data)});
          console.log("Chunk: %j",chunk);
          console.log("Chunk: ",chunk);
          buffer += chunk;
        })
        console.log(buffer);
        // res.writeHead(200, {'Context-Type': 'application/json'});
        // res.end()
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
