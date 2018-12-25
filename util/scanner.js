'use strict';

const net = require('net');
const dgram = require('dgram');

const Printer = require('../util/Printer');

class Scanner {
    constructor(Parser, args) {
      this.parser = new Parser(args);
    }

    performScan() {
        let success = [];
        new Promise((resolve) => {
            if(this.parser.scanParameters.tcp) {
                if(this.parser.scanParameters.ipv4) this.scanPortRange(this.parser.scanParameters.ports, this.parser.scanParameters.hosts, 'tcp', 4, (arg, scanRes) => {
                    success.push(scanRes);
                    resolve(arg);
                });
                if(this.parser.scanParameters.ipv6) this.scanPortRange(this.parser.scanParameters.ports, this.parser.scanParameters.hosts, 'tcp', 6, (arg, scanRes) => {
                    success.push(scanRes);
                    resolve(arg);
                });
            }
            if(this.parser.scanParameters.udp) {
                if(this.parser.scanParameters.ipv4) this.scanPortRange(this.parser.scanParameters.ports, this.parser.scanParameters.hosts, 'udp', 4, (arg, scanRes) => {
                    success.push(scanRes);
                    resolve(arg);
                });
                if(this.parser.scanParameters.ipv6) this.scanPortRange(this.parser.scanParameters.ports, this.parser.scanParameters.hosts, 'udp', 6, (arg, scanRes) => {
                    success.push(scanRes);
                    resolve(arg);
                });
            }

            

        }).then(res => {
          success = success.reduce((acc, current) => { 
            acc.open = acc.open.concat(current.open); 
            acc.closed = acc.closed.concat(current.closed); 
            return acc; 
          }, {open: [], closed: []});

            const printer = new Printer(success);
            return printer.showOpenGatesMixed();
        });

    }
    
    scanPortUDP(port, host, family, success, callback) {
        let socket;
        if (family === 4) socket = dgram.createSocket('udp4');
        else if (family === 6) socket = dgram.createSocket('udp6');

        socket.send('my packet', 0, 9, parseInt(port), host
            , (err, bytes) => {
                // console.log("ERROR: " + err, bytes);
                // success.closed.push({port: port, host: host, method:'UDP', family: 'ipv' + family});
                setTimeout(() => {
                    socket.unref();
                    socket.close();
                    if(callback) callback('timeout');
                }, 2000);
            }
        );

        socket.on('error', (err) => {
            console.log("called error");
            console.log(err);
            success.closed.push({port: port, host: host, method:'UDP', family: 'ipv' + family});
            // socket.unref();
            // socket.close();
            if(callback) callback('closed');
        });

        socket.on('message', (msg, info) => {
            console.log(`socket got: ${msg} from ${info.address}:${info.port}`);
            success.open.push({port: port, host: host, method:'UDP', family: 'ipv' + family});
            if(callback) callback('open');
        });

        socket.on('listening', () => {//empty arg list
            console.log(`server listening ${socket.address().address}:${socket.address().port}`);
        });
    };

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
        });

        socket.on('data', (data) => {
            console.log(data.toString());
        });
    };

    scanPortRange(ports, hosts, method, family, callback) {
        let success = {
            open: [],
            closed: []
        };
        Promise.all(hosts.map(host => {
            return ports.map(port => {
                if (method === 'tcp') return new Promise((resolve, reject) => this.scanPort(port, host, family, success, (arg) => resolve(arg)));
                else if (method === 'udp') return new Promise((resolve, reject) => this.scanPortUDP(port, host, family, success, (arg) => resolve(arg)));
                else return Promise.reject('Unknown method used');
            });
        }).reduce((first, second) => first.concat(second), []))
            .then((res) => {
                if(callback) callback('done', success);
                else return this.showOpenGates(success);
            }, (err) => {
                console.log(err);
                process.exit(1);
            });
    };

}

module.exports = Scanner;
