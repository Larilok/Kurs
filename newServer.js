'use strict';

const http = require('http');

const html =`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script>
  <title>Document</title>
  <style>
    body{
      margin: 1.75rem;
    }
  </style>
</head>
<body>
  
  <div id="container-fluid ml-5">
    <h1 class ="display-2 align-center">Welcome to TCP/UDP port scanner powered by <kbd>Node.js</kbd> </h1>
  </div>

  <div class="d-flex flex-column ">
      <button type="button" class="btn mt-3" data-toggle="collapse" data-target="#demo">Show help</button>
      <div id="demo" class="collapse ">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit,
        sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </div>
  <form>
    <div class="form-group mt-4">
      <label for="hosts"><h3>Hosts:</h3></label>
      <input type="text" class="form-control" id="hosts" placeholder="Enter host" name="hosts">
    </div>
    <div class="form-group">
      <label for="ports"><h3>Ports:</h3></label>
      <input type="text" class="form-control" id="ports" placeholder="Enter ports" name="ports">
    </div>
    <div class="d-flex justify-content-around">
      <div class="custom-control custom-checkbox">
        <input type="checkbox" class="custom-control-input" id="TCP" name="tcp">
        <label class="custom-control-label" for="TCP">TCP</label>
      </div>
      <div class="custom-control custom-checkbox">
        <input type="checkbox" class="custom-control-input " id="UDP" name="udp">
        <label class="custom-control-label" for="UDP">UPD</label>
      </div>
      <div class="custom-control custom-checkbox">
        <input type="checkbox" class="custom-control-input " id="IPv4" name="ipv4">
        <label class="custom-control-label" for="IPv4">IPv4</label>
      </div>
      <div class="custom-control custom-checkbox">
        <input type="checkbox" class="custom-control-input " id="IPv6" name="ipv6">
        <label class="custom-control-label" for="IPv6">IPv6</label>
      </div>
  </div>
  <button type="submit" class="btn btn-primary mt-3" id="scanBTN">Scan</button>
</form>
<textarea name="output" id="output" cols="30" rows="10" readonly placeholder="Results wil apper in here"></textarea>
</div>
<script src="./app.js"></script> 
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
//DONE//TODO ipv6 support
//TODO udp support - somewhat done - still very unreliable
//TODO rewrite in OOP
//DONE//TODO add error classes
//TODO deal with promise.reject on wrong method in scanPortRange - should it throw an error?
//TODO fix udp breakdown on large port range
//DONE//TODO fix refuse to exit on large port range
//DONE//TODO rewrite parseArgs
//DONE//TODO rewrite error throws in parsePorts and parseHosts

'use strict';

const net = require("net");
const dgram = require("dgram");
const dns = require('dns');

const web = require('./HtmlHelper');
const err = require('./errors.js');

// console.log(process.argv);

class Parser {
    constructor() {
        this.scanParameters = this.parseArgs();
    }

    performScan() {
      console.log("In perfScan");
        if(this.scanParameters.tcp) {
            if(this.scanParameters.ipv4) this.scanPortRange(this.scanParameters.ports, this.scanParameters.hosts, 'tcp', 4);
            if(this.scanParameters.ipv6) this.scanPortRange(this.scanParameters.ports, this.scanParameters.hosts, 'tcp', 6);
        }
        if(this.scanParameters.udp) {
            if(this.scanParameters.ipv4) this.scanPortRange(this.scanParameters.ports, this.scanParameters.hosts, 'udp', 4);
            if(this.scanParameters.ipv6) this.scanPortRange(this.scanParameters.ports, this.scanParameters.hosts, 'udp', 6);
        }
    }

    // const
    scanPortUDP(port, host, family, success, callback) {
        let socket;
        console.log("In udp");
        if (family === 4) socket = dgram.createSocket('udp4');
        else if (family === 6) socket = dgram.createSocket('udp6');
        // socket.bind(parseInt(port), host);
        // socket.bind(60001, '192.168.1.212');
        socket.send('my packet', 0, 9, parseInt(port), host
            , (err, bytes) => {
                // console.log("ERROR: " + err, bytes);
                // success.push({port: port, host: host, method:'UDP', family: 'ipv' + family});
                setTimeout(() => {
                    socket.unref();
                    socket.close();
                    if (callback) callback('closed');
                }, 2000);
                // socket.unref();
                // socket.close();
            }
        );

        socket.on('error', (err) => {
            console.log("called error");
            console.log(err);
            success.closed.push({port: port, host: host, method: 'UDP', family: 'ipv' + family});
            // socket.unref();
            // socket.close();
            if (callback) callback('closed');
        });

        socket.on('message', (msg, info) => {
            console.log('socket got: ' + msg + ' from ' +info.address+ ':' + info.port);
            success.open.push({port: port, host: host, method: 'UDP', family: 'ipv' + family});
            if (callback) callback('open');
        });

        socket.on('listening', () => {//empty arg list
            console.log('server listening'+ socket.address().address+':'+socket.address().port);
        });
    };

    // const
    scanPort(port, host, family, success, callback) {
        let socket = net.createConnection({port: port, host: host, family: family});

        socket.on('error', err => {
            success.closed.push({
                port: socket.remotePort,
                host: socket.remoteAddress,
                method: 'TCP',
                family: 'ipv' + family
            });
            socket.unref();
            socket.end();
            if (callback) callback('closed');
        });

        socket.on('connect', () => {
            success.open.push({
                port: socket.remotePort,
                host: socket.remoteAddress,
                method: 'TCP',
                family: 'ipv' + family
            });
            socket.unref();
            socket.end();
            if (callback) callback('open');
            // return {port: socket.remotePort, host: socket.remoteAddress};
        });

        socket.on('data', (data) => {
            console.log(data.toString());
            // socket.end();
        });
    };

    // const
    scanPortRange(ports, hosts, method, family) {
        let success = {
            open: [],
            closed: []
        };
        console.log('In scanPortRange');
        Promise.all(hosts.map(host => {
            console.log("host");
            return ports.map(port => {
              console.log("port",method);
                if (method === 'tcp') return new Promise((resolve, reject) => this.scanPort(port, host, family, success, (arg) => resolve(arg)));
                else if (method === 'udp') return new Promise((resolve, reject) => this.scanPortUDP(port, host, family, success, (arg) => resolve(arg)));
                else {
                  console.log("error");
                  return Promise.reject('Unknown method used');
                }
            });
        }).reduce((first, second) => first.concat(second), []))
            .then((res) => {
                // console.log(res);
                return this.showOpenGates(success, method);
            }, (err) => {
                web.el('#output').innerText = (err);
                // process.exit(1);
            });
    };

    // const
    showOpenGates(success, method) {
        let output = web.el('#output');
        output.innerText = 'Scanning complete';
        if (method === 'tcp') {
            if (success.open.length <= success.closed.length) {//less open ports than closed
              output.innerText += 'Open ports are:\\n';
                success.open.map(port => {
                  output.innerText += (port);
                });
            } else {//less closed ports
              output.innerText +='\\nToo many open ports. Closed ports are:\\n';
                success.closed.map(port => {
                  output.innerText += port;
                })
            }
        } else if (method === 'udp') {
            console.log('All ports that are not in use are presumed open. Ports in use are: ');
            success.open.map(port => {
                console.log(port);
            })
        }
    };

    // const
    parsePorts(ports) {
        if (ports.indexOf('-') !== -1) {
            return ports.split(',').map(port => {
                if (port.indexOf('-') !== -1) {
                    let range = port.split('-');
                    this.checkPortRangeValidity(range);
                    let length = range[1] - range[0] + 1;
                    return [...Array(length).keys()].map(x => (x + parseInt(range[0])).toString());
                }
                return port;
            }).reduce((first, second) => first.concat(second), []);
        } else return ports.split(',');
    };

    // const
    parseHosts(hosts) {
        let isIPV6 = false;
        let isURL = false;
        // if(hosts.indexOf('.') === -1) throw new err.BadHostNotationError('Incorrect host notation', hosts);
        // if(host.split('.').length !== 4) throw new err.BadHostNotationError('Incorrect host notation', hosts);
        hosts.split(',').map((host) => {
            if (host.indexOf(':') !== -1) isIPV6 = true;
            else if (isNaN(parseInt(host.split('.').pop()))) isURL = true;
        });
        if (!isURL && !isIPV6) {
            if (hosts.indexOf('-') !== -1) {
                return hosts.split(',').map(host => {
                    if (host.indexOf('-') !== -1) {
                        let range = host.split('-');
                        range[1] = range[0].slice(0, range[0].lastIndexOf('.') + 1) + range[1];
                        this.checkIPV4HostRangeValidity(range);
                        let length = range[1].slice(range[1].lastIndexOf('.') + 1) - range[0].slice(range[0].lastIndexOf('.') + 1) + 1;
                        return [...Array(length).keys()].map(x => range[0]
                                .slice(0, range[0].lastIndexOf('.') + 1) +
                            (x + parseInt(range[0].slice(range[0].lastIndexOf('.') + 1))).toString());
                    }
                    return host;
                }).reduce((first, second) => first.concat(second), []);
            } else return hosts.split(',');
        } else if (isURL) {
            //DOES NOT WORK, finishes before dns resolves
            console.log('is URL');
            let resolvedHosts = [];
            hosts.split(',').map(host => {
                dns.lookup(host, (error, address) => {
                    if (error) throw new Error('failed DNS lookup');//TODO//replace with custom error
                    else {
                        console.log("address:\\n", address);
                        resolvedHosts.push(address);
                    }
                });
            });
            return resolvedHosts;
        } else if (isIPV6) {//seems to be working
            if (hosts.indexOf('-') !== -1) {
                return hosts.split(',').map(host => {
                    if (host.indexOf('-') !== -1) {//has range
                        let range = host.split('-');
                        range[1] = range[0].slice(0, range[0].lastIndexOf(':') + 1) + range[1];
                        this.checkIPV6HostRangeValidity(range);
                        let snd = parseInt(range[1].slice(range[1].lastIndexOf(':') + 1), 16);
                        let fst = parseInt(range[0].slice(range[0].lastIndexOf(':') + 1), 16);
                        // console.log(fst, snd);
                        let length = snd - fst + 1;
                        // console.log(range, length);
                        return [...Array(length).keys()].map(x => range[0]
                                .slice(0, range[0].lastIndexOf(':') + 1) +
                            (x + parseInt(range[0].slice(range[0].lastIndexOf(':') + 1), 16)).toString(16));
                    }
                    return host;
                }).reduce((first, second) => first.concat(second), []);
            } else return hosts.split(',');
        } else throw new err.BadHostNotationError('Incorrect host notation', hosts);
    };

    // const
    replaceColons(hosts) {
        if (hosts.indexOf(':') !== -1) {
            return hosts.split(':').join('.');
        } else return hosts;
    };

    // const
    checkPortRangeValidity(range) {
        if (range[0] === "" || range[1] === "") throw new err.RangeError('Unbounded port range', range);
        if (parseInt(range[0]) > parseInt(range[1])) {
            let tempZero = range[0];
            range[0] = range[1];
            range[1] = tempZero;
        }
    };

    // const
    checkIPV6HostRangeValidity(range) {
        if ((range[0].lastIndexOf(':') === range[0].length - 1 && range[0] !== '::')//':' is the last elem, but address is not '::'
            || (range[1].lastIndexOf(':') === range[1].length - 1) && range[1] !== '::') throw new err.RangeError('Unbounded host range', range);
        if (parseInt(range[0].slice(range[0].lastIndexOf(':') + 1), 16) > parseInt(range[1].slice(range[1].lastIndexOf(':') + 1), 16)) {
            let tempZero = range[0];
            range[0] = range[1];
            range[1] = tempZero;
        }
    };

    // const
    checkIPV4HostRangeValidity(range) {
        if (range[0].lastIndexOf('.') === range[0].length - 1
            || range[1].lastIndexOf('.') === range[1].length - 1) throw new err.RangeError('Unbounded host range', range);
        if (parseInt(range[0].slice(range[0].lastIndexOf('.') + 1)) > parseInt(range[1].slice(range[1].lastIndexOf('.') + 1))) {
            let tempZero = range[0];
            range[0] = range[1];
            range[1] = tempZero;
        }
    };

    // const
    showHelp() {
        console.log(\`Port scanner help:
        Use this tool to check for open ports on one or more TCP/UDP host
        Use:
        main.js [ports] [hosts] [tcp] [udp] [ipv4] [ipv6]
        ports: specifies the ports to scan. Use "," for single ports and "-" for port ranges, def = 1-65535
        hosts: optional parameter, def = 127.0.0.1
        tcp: use to perform a tcp scan, def = true
        udp: use to perform a udp scan, def = false
        ipv4: use to perform ipv4 scan when using URL as a host, def = true
        ipv6: use to perform ipv6 scan when using URL as a host, def = false
        ex:
            $:main.js 80,400-500,8080 127.0.0.1-20 udp
        will perform scan for selected ports on each selected host using udp ipv4 protocol
        \`);
    };

    // const
    parseArgsOld() {
        let ports = [];
        let hosts = [];
        let wantTcp = false;
        let wantUdp = false;
        //bad args or help request
        if ((process.argv[2] && isNaN(parseInt(process.argv[2])) && (process.argv[2] !== 'tcp' && process.argv[2] !== 'udp'))
            || process.argv[2] === "help") {
            showHelp();
            return process.exit(0);
        }//insufficient or wrong args or help call
        process.argv = process.argv.map(arg => replaceColons(arg));

        //1st arg being dealt with
        if (process.argv.length === 2 || process.argv[2].indexOf('.') !== -1
            || process.argv[2] === 'tcp' || process.argv[2] === 'udp') {//no 1st arg or it is unrelated to ports
            // console.log('first arg not ports');
            let fullPortRange = '0-65535';
            ports = parsePorts(fullPortRange);
            if (process.argv.length === 2) {
                let localhost = '127.0.0.1';
                hosts = parseHosts(localhost);
                wantTcp = true;
            } else if (process.argv[2].indexOf('.') !== -1) hosts = parseHosts(process.argv[2]);//1st arg is hosts
            else if (process.argv[2] === 'tcp') wantTcp = true;//1st arg is tcp request
            else if (process.argv[2] === 'udp') wantUdp = true;//1st arg is udp request
        } else {//first arg is not hosts or type specifier -> ports then
            ports = parsePorts(process.argv[2]);

            //2nd arg being dealt with
            if (process.argv.length === 3 || process.argv[3] === 'tcp' || process.argv[3] === 'udp') {//no 2nd arg or i is unrelated to hosts
                console.log("HEY: " + process.argv.length);
                if (hosts.length === 0) {//1st one was ports
                    let localhost = '127.0.0.1';
                    hosts = parseHosts(localhost);
                }
                if (process.argv[3] === 'tcp') wantTcp = true;//2nd arg is tcp request
                else if (process.argv[3] === 'udp') wantUdp = true;//2nd arg is udp request
            } else {
                hosts = parseHosts(process.argv[3]);

                //3rd arg being dealt with
                if (process.argv.length <= 4 && wantUdp === false) wantTcp = true;//no 3rd arg and udp not  wanted
                else {
                    if (process.argv[4] === 'tcp') wantTcp = true;//3rd arg is tcp request
                    else if (process.argv[4] === 'udp') wantUdp = true;//3rd arg is udp request

                    //4th arg being dealt with
                    if (process.argv[5] === 'tcp') wantTcp = true;//4th arg is tcp request
                    else if (process.argv[5] === 'udp') wantUdp = true;//3rd arg is udp request
                }
            }
        }
        return {
            ports: ports,
            hosts: hosts,
            tcp: wantTcp,
            udp: wantUdp
        };
    };

    // const
    parseArgs() {
        let ports = (web.el('#ports').value.trim()).split(',');
        let hosts = (web.el('#hosts').value.trim()).split(',');
       
        let wantTcp = web.el('#TCP').checked;
        let wantUdp = web.el('#UDP').checked;
        let wantIPV4 = web.el('#IPv4').checked;
        let wantIPV6 = web.el('#IPv6').checked;
        let output = web.el('#output');
        // process.argv = process.argv.map(arg => replaceColons(arg));
        // let args = process.argv;
        let fullPortRange = '1-65535';
        let localhost = '127.0.0.1';
        try {
          if(!wantIPV4 && !wantIPV6) wantIPV4 = true;
          if(!wantTcp && !wantUdp) wantTcp = true;
console.log(typeof(ports),[]);
console.log(hosts,ports)
          if(ports === '')  ports = this.parsePorts(fullPortRange);
          else ports = this.ParsePorts(ports);
          if(hosts === '')  hosts = this.parsePorts(localhost);
          else hosts = this.ParsePorts(hosts);
        } catch (e) {
            if (e instanceof err.BadHostNotationError) {
                output.innerText = e.name + '\\n' + e.message + ": " + e.host + '\\n' + e.stack;
                // process.exit(1);
            } else if (e instanceof err.RangeError) {
              output.innerText = e.name + '\\n' + e.message + ": " + e.range + '\\n' + e.stack;
                // process.exit(1);
            } else {
              output.innerText = 'Unknown error:' + e.name + '\\n' + e.message + '\\n' + e.stack;
                // process.exit(1);
            }
        }

        return {
            ports: ports,
            hosts: hosts,
            tcp: wantTcp,
            udp: wantUdp,
            ipv4: wantIPV4,
            ipv6: wantIPV6
        };
    };

}


web.el('#scanBTN').addEventListener('click', () =>
/*Main()*/{
    // const scanParameters = parseArgs();
    // console.log(scanParameters);
    let parser = new Parser();
    parser.performScan();
})
`;

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
}).listen(3500,() => console.log('Server : ON'));