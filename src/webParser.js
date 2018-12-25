

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

// const web = require('./HtmlHelper');
const err = require('./errors.js');

// console.log(process.argv);

class Parser {
    constructor(obj) {
        this.scanParameters = this.parseArgs(obj);
        this._output = "";
    }

    performScan(callback) {
      let promise = new Promise((resolve,reject) => {
      console.log("perfScan");
      if(this._output !== "") return;
      // console.log(this.scanParameters);
      // console.log(this._output);
      if(this.scanParameters.tcp) {
          if(this.scanParameters.ipv4) this.scanPortRange(this.scanParameters.ports, this.scanParameters.hosts, 'tcp', 4, (arg) => resolve(arg));
          if(this.scanParameters.ipv6) this.scanPortRange(this.scanParameters.ports, this.scanParameters.hosts, 'tcp', 6, (arg) => resolve(arg));
      }
      if(this.scanParameters.udp) {
          if(this.scanParameters.ipv4) this.scanPortRange(this.scanParameters.ports, this.scanParameters.hosts, 'udp', 4, (arg) => resolve(arg));
          if(this.scanParameters.ipv6) this.scanPortRange(this.scanParameters.ports, this.scanParameters.hosts, 'udp', 6, (arg) => resolve(arg));
      }
    })
    .then((result) =>{ if(callback) callback('done')})
     
    }

    getOutput() {
      return this._output;
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
            this._output += "called error\n";
            this._output += JSON.stringify(err);
            success.closed.push({port: port, host: host, method: 'UDP', family: 'ipv' + family});
            // socket.unref();
            // socket.close();
            if (callback) callback('closed');
        });

        socket.on('message', (msg, info) => {
            // console.log(`socket got: ${msg} from ${info.address}:${info.port}`);
            success.open.push({port: port, host: host, method: 'UDP', family: 'ipv' + family});
            if (callback) callback('open');
        });

        socket.on('listening', () => {//empty arg list
            // console.log(`server listening ${socket.address().address}:${socket.address().port}`);
        });
    };

    // const
    scanPort(port, host, family, success, callback) {
        let socket = net.createConnection({port: port, host: host, family: family});
        // console.log("In tcp");
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
            // console.log(data.toString());
            // socket.end();
        });
    };

    // const
    scanPortRange(ports, hosts, method, family, callback) {
        let success = {
            open: [],
            closed: []
        };
        console.log('In scanPortRange');
        Promise.all(hosts.map(host => {
            // console.log("host");
            return ports.map(port => {
              // console.log("port",method);
                if (method === 'tcp') return new Promise((resolve, reject) => this.scanPort(port, host, family, success, (arg) => resolve(arg)));
                else if (method === 'udp') return new Promise((resolve, reject) => this.scanPortUDP(port, host, family, success, (arg) => resolve(arg)));
                else {
                  this._output +="error";
                  return Promise.reject('Unknown method used');
                }
            });
        }).reduce((first, second) => first.concat(second), []))
            .then((res) => {
                // console.log(res);
                if(callback) callback('done');
                return this.showOpenGates(success, method);
                
            }, (err) => {
              this._output += err;
              return;
              // process.exit(1);
            });
            
    };

    // const
    showOpenGates(success, method) {
        console.log("in show Gates!!!!!!! ");
        this._output += 'Scanning complete\n';
        if (method === 'tcp') {
            if (success.open.length <= success.closed.length) {//less open ports than closed
              this._output += 'Open ports are:\n';
                success.open.map(port => {
                  this._output += JSON.stringify(port) +'\n';
                });
            } else {//less closed ports
              this._output +='Too many open ports. Closed ports are:\n';
                success.closed.map(port => {
                  this._output += JSON.stringify(port) +'\n';
                })
            }
        } else if (method === 'udp') {
            this._output += 'All ports that are not in use are presumed open. Ports in use are:\n/';
            success.open.map(port => {
              this._output += JSON.stringify(port) +'\n';
            })
        }
    };

    // const
    parsePorts(ports) {
      console.log('in Ports');
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
            console.log('is URL');        // TODO make an this._output
            let resolvedHosts = [];
            hosts.split(',').map(host => {
                dns.lookup(host, (error, address) => {
                    if (error) throw new Error('failed DNS lookup');//TODO//replace with custom error
                    else {
                        // console.log("address:\n", address);
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
    // showHelp() {
    //     console.log(`Port scanner help:
    //     Use this tool to check for open ports on one or more TCP/UDP host
    //     Use:
    //     main.js [ports] [hosts] [tcp] [udp] [ipv4] [ipv6]
    //     ports: specifies the ports to scan. Use "," for single ports and "-" for port ranges, def = 1-65535
    //     hosts: optional parameter, def = 127.0.0.1
    //     tcp: use to perform a tcp scan, def = true
    //     udp: use to perform a udp scan, def = false
    //     ipv4: use to perform ipv4 scan when using URL as a host, def = true
    //     ipv6: use to perform ipv6 scan when using URL as a host, def = false
    //     ex:
    //         $:main.js 80,400-500,8080 127.0.0.1-20 udp
    //     will perform scan for selected ports on each selected host using udp ipv4 protocol
    //     `);
    // };

    // const
    parseArgs(obj) {
      // console.log("obj is ",obj);
        let ports = obj.ports,
            hosts = obj.hosts,
            wantTcp = obj.wantTcp,
            wantUdp = obj.wantUdp,
            wantIPV4 = obj.wantIPV4,
            wantIPV6 = obj.wantIPV6;

        const fullPortRange = '1-65535',
              localhost = '127.0.0.1';

        try {
          if(!wantIPV4 && !wantIPV6) wantIPV4 = true;
          if(!wantTcp && !wantUdp) wantTcp = true;
          // console.log(typeof(ports),[]);
          console.log(hosts,ports);
          if(ports[0] === '')  ports = this.parsePorts(fullPortRange);
          else ports = this.parsePorts(ports);
          if(hosts[0] === '')  hosts = this.parseHosts(localhost);
          else hosts = this.parseHosts(hosts);
        } catch (e) {
            if (e instanceof err.BadHostNotationError) {
                this._output += e.name + '\n' + e.message + ": " + e.host + '\n' + e.stack;
                // process.exit(1);
                return;
            } else if (e instanceof err.RangeError) {
              this._output = e.name + '\n' + e.message + ": " + e.range + '\n' + e.stack;
                // process.exit(1);
                return;
            } else {
              this._output = 'Unknown error:' + e.name + '\n' + e.message + '\n' + e.stack;
              return;
                // process.exit(1);
            }
        }
        // console.log(ports,hosts);
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

module.exports = Parser;
