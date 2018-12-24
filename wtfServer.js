'use strict';

const http = require('http');

const html =`
    <!doctype>
    <html>
        <head>
            <meta charset="utf-8">
            <title>My Serser</title>
            <link rel="stylesheet" href="app.css">
        </head>
        
        <body> 
            <h1>My Server</h1>
            <button>Click on me</button>
            <script src="app.js"></script>
        </body>
    </html>
`;

const css = `
    body {
        margin: 0;
        padding: 0;
        text-align: center;
    }
    h1{
        background-color: #83d0f2;
        color: white;
        padding: .5em;
        font-family: 'Consolas'
    }
`;

const js = `
    const button = document.querySelector('button');
    button.addEventListener('click', event => alert('Wow, It works'));
`
http.createServer((req, res) =>{
  console.log(req.url);
   switch (req.url) {
        case '/':
            res.writeHead(200,{ 'Content-Type': 'text/html' });
            res.end(html);
            break;
        
        case '/app.css':
            res.writeHead(200,{ 'Content-Type': 'text/css' });
            res.end(css);
            break;

        case '/app.js':
            res.writeHead(200,{ 'Content-Type': 'text/javascript' });
            res.end(js);
            break;
        default:
            res.writeHead(404,{ 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            break;
   }
}).listen(3501,() => console.log('Server : ON'));