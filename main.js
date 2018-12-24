//TODO ipv6 support
//TODO udp support - somewhat done - still very unreliable
//TODO rewrite in OOP
//TODO add error classes
//TODO deal with promise.reject on wrong method in scanPortRange - should it throw an error?
//TODO fix udp breakdown on large port range
//DONE//TODO fix refuse to exit on large port range
//TODO rewrite parseArgs
//TODO rewrite error throws in parsePorts and parseHosts

'use strict';

const net = require('net');
const dgram = require('dgram');

const err = require('./errors.js');

console.log(process.argv);

const scanPortUDP = (port, host, family, success, callback) => {
  let socket;
  if (family === 4) socket = dgram.createSocket('udp4');
  else if (family === 6) socket = dgram.createSocket('udp6');

  // socket.bind(parseInt(port), host);
  socket.bind(60001, '192.168.1.212');
    try {
        socket.send('my packet', 0, 9, parseInt(port), host
            , (err, bytes) => {
            console.log("ERROR: " + err, bytes);
            socket.close();
        }
        );
    } catch (e) {
      console.warn(e);
    }

  socket.on('error', (err) => {
      //console.log(`socket error:\n${err.stack}`);
      console.log("called error");
      console.log(err);
      success.push({port: port, host: host, family: 'ipv' + family});
      socket.unref();
      // socket.close();
      if(callback) callback('closed');
  });

  socket.on('message', (msg, info) => {
    
      console.log(`socket got: ${msg} from ${info.address}:${info.port}`);
  });

  socket.on('listening', () => {//empty arg list
      console.log(`server listening ${socket.address().address}:${socket.address().port}`);
      // socket.unref();
      // socket.close();
      // if(callback) callback('open');
  });
};

const scanPort = (port, host, family, success, callback) => {
  let socket = net.createConnection({port: port, host: host, family: family});

  socket.on('error', err => {
      socket.unref();
      socket.end();
      if(callback) callback('closed');
  });

  socket.on('connect', () => {
      success.push({port: socket.remotePort, host: socket.remoteAddress, family: 'ipv' + family});
      socket.unref();
      socket.end();
      if(callback) callback('open');
      // return {port: socket.remotePort, host: socket.remoteAddress};
  });

    // socket.on('data', (data) => {
    //     console.log(data.toString());
    //     // socket.end();
    // });
};

const scanPortRange = (ports, hosts, method, family) => {
    let success = [];
    Promise.all(hosts.map(host => {
        return ports.map(port => {
            if(method === 'tcp') return new Promise((resolve, reject) => scanPort(port, host, family, success, (arg) => resolve(arg)));
            else if(method === 'udp') return new Promise((resolve, reject) => scanPortUDP(port, host, family, success, (arg) => resolve(arg)));
            else return Promise.reject('Unknown method used');
        });
    }).reduce((first, second) => first.concat(second), []))
        .then((res) => {
            // console.log(res);
            return showOpenGates(success);
        }, (err) => {
            console.log(err);
            process.exit(1);
        });
};

const showOpenGates = gates => {
  console.log('Scanning complete. Open ports:');
  console.log(gates);
};

const parsePorts = ports => {
    if (ports.indexOf('-') !== -1) {
        return ports.split(',').map(port => {
            if (port.indexOf('-') !== -1) {
                let range = port.split('-');
                checkPortRangeValidity(range);
                let length = range[1] - range[0] + 1;
                return [...Array(length).keys()].map(x => (x + parseInt(range[0])).toString());
            }
            return port;
        }).reduce((first, second) => first.concat(second), []);
    } else return ports.split(',');
};

//TODO distinguish between ipv4, ipv6 and URL
const parseHosts = hosts => {
    // if(hosts.indexOf('.') === -1) throw new err.BadHostNotationError('Incorrect host notation', hosts);
    hosts.split(',').map((host) => {
        // if(host.split('.').length !== 4) throw new err.BadHostNotationError('Incorrect host notation', hosts);
    });
    if (hosts.indexOf('-') !== -1) {
        return hosts.split(',').map(port => {
            if (port.indexOf('-') !== -1) {
                let range = port.split('-');
                range[1] = range[0].slice(0, range[0].lastIndexOf('.')+1) + range[1];
                checkHostRangeValidity(range);
                let length = range[1].slice(range[1].lastIndexOf('.')+1) - range[0].slice(range[0].lastIndexOf('.')+1) + 1;
                return [...Array(length).keys()].map(x => range[0]
                    .slice(0, range[0].lastIndexOf('.')+1) +
                    (x + parseInt(range[0].slice(range[0].lastIndexOf('.')+1))).toString());
            }
            return port;
        }).reduce((first, second) => first.concat(second), []);
    } else return hosts.split(',');
};

const replaceColons = hosts => {
    if(hosts.indexOf(':') !== -1) {
        return hosts.split(':').join('.');
    } else return hosts;
};

const checkPortRangeValidity = range => {
    if(range[0] === "" || range[1] === "") throw new err.RangeError('Unbounded port range', range);
    if(parseInt(range[0]) > parseInt(range[1])) {
        let tempZero = range[0];
        range[0] = range[1];
        range[1] = tempZero;
    }
};

const checkHostRangeValidity = range => {
    if(range[0].lastIndexOf('.') === range[0].length - 1
        || range[1].lastIndexOf('.') === range[1].length - 1) throw new err.RangeError('Unbounded host range', range);
    if(parseInt(range[0].slice(range[0].lastIndexOf('.')+1)) > parseInt(range[1].slice(range[1].lastIndexOf('.')+1))) {
        let tempZero = range[0];
        range[0] = range[1];
        range[1] = tempZero;
    }
};

const showHelp = () => {
    console.log(`Port scanner help:
        Use this tool to check for open ports on one or more TCP/UDP host
        Use:
        main.js [ports] [hosts] [tcp] [udp] [ipv4] [ipv6]
        ports: specifies the ports to scan. Use "," for single ports and "-" for port ranges, def = 1-65535
        hosts: optional parameter, def = 127.0.0.1
        tcp: use to perform a tcp scan, def = true
        udp: use to perform a udp scan, def = false
        ipv4: use to perform ipv4 scan, def = true
        ipv6: use to perform ipv6 scan, def = false
        ex:
            $:main.js 80,400-500,8080 127.0.0.1-20 udp
        will perform scan for selected ports on each selected host using udp ipv4 protocol
        `);
};

const parseArgsOld = () => {
    let ports = [];
    let hosts = [];
    let wantTcp = false;
    let wantUdp = false;
    //bad args or help request
    if((process.argv[2] && isNaN(parseInt(process.argv[2])) && (process.argv[2] !== 'tcp' && process.argv[2] !== 'udp'))
        || process.argv[2] === "help") {
        showHelp();
        return process.exit(0);
    }//insufficient or wrong args or help call
    process.argv = process.argv.map(arg => replaceColons(arg));

    //1st arg being dealt with
    if(process.argv.length === 2 || process.argv[2].indexOf('.') !== -1
        || process.argv[2] === 'tcp' || process.argv[2] === 'udp') {//no 1st arg or it is unrelated to ports
        // console.log('first arg not ports');
        let fullPortRange = '0-65535';
        ports = parsePorts(fullPortRange);
        if(process.argv.length === 2) {
            let localhost = '127.0.0.1';
            hosts = parseHosts(localhost);
            wantTcp = true;
        } else if(process.argv[2].indexOf('.') !== -1) hosts = parseHosts(process.argv[2]);//1st arg is hosts
        else if(process.argv[2] === 'tcp') wantTcp = true;//1st arg is tcp request
        else if(process.argv[2] === 'udp') wantUdp = true;//1st arg is udp request
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

const parseArgs = () => {
    let ports = [];
    let hosts = [];
    let wantTcp = false;
    let wantUdp = false;
    let wantIPV4 = false;
    let wantIPV6 = false;

    // process.argv = process.argv.map(arg => replaceColons(arg));
    let args = process.argv;
    let fullPortRange = '1-65535';
    let localhost = '127.0.0.1';
    try {
        switch (args.length) {
            case 2://no args
                ports = parsePorts(fullPortRange);
                hosts = parseHosts(localhost);
                wantTcp = true;
                wantIPV4 = true;
                break;
            case 3://1 arg
                //arg 1
                if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg is hosts
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(args[2]);
                    wantTcp = true;
                    wantIPV4 = true;
                } else if (parseInt(args[2])) {//arg is ports
                    ports = parsePorts(args[2]);
                    hosts = parseHosts(localhost);
                    wantTcp = true;
                    wantIPV4 = true;
                } else if (args[2] === 'tcp' || args[2] === 'ipv4') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantTcp = true;
                    wantIPV4 = true;
                } else if (args[2] === 'udp') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantUdp = true;
                    wantIPV4 = true;
                } else if (args[2] === 'ipv6') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantTcp = true;
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                break;
            case 4://2 args
                //arg 1
                if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg 1 is hosts
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(args[2]);
                } else if (parseInt(args[2])) {//arg 1 is ports
                    ports = parsePorts(args[2]);
                } else if (args[2] === 'tcp') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantTcp = true;
                } else if (args[2] === 'udp') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantUdp = true;
                } else if (args[2] === 'ipv4') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantTcp = true;
                    wantIPV4 = true;
                } else if (args[2] === 'ipv6') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantTcp = true;
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 2
                if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                    if (hosts.length !== 0) {//hosts already present
                        showHelp();
                        process.exit(0);
                    }
                    hosts = parseHosts(args[3]);
                    wantTcp = true;
                    wantIPV4 = true;
                } else if (args[3] === 'tcp' || args[3] === 'ipv4') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantTcp = true;
                    wantIPV4 = true;
                } else if (args[3] === 'udp') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantUdp = true;
                    wantIPV4 = true;
                } else if (args[3] === 'ipv6') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantTcp = true;
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                break;
            case 5://3 args
                //arg 1
                if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg 1 is hosts
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(args[2]);
                } else if (parseInt(args[2])) {//arg 1 is ports
                    ports = parsePorts(args[2]);
                } else if (args[2] === 'tcp') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantTcp = true;
                } else if (args[2] === 'udp') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantUdp = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 2
                if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                    if (hosts.length !== 0) {//hosts already present
                        showHelp();
                        process.exit(0);
                    }
                    hosts = parseHosts(args[3]);
                } else if (args[3] === 'tcp') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantTcp = true;
                } else if (args[3] === 'udp') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantUdp = true;
                } else if (args[3] === 'ipv4') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantIPV4 = true;
                } else if (args[3] === 'ipv6') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 3
                if (args[4] === 'tcp') {
                    wantTcp = true;
                    wantIPV4 = true;
                } else if (args[4] === 'udp') {
                    wantUdp = true;
                    wantIPV4 = true;
                } else if (args[4] === 'ipv4') {
                    if (!wantUdp) wantTcp = true;//if wantUdp flag was not set, have to activate default parameter
                    wantIPV4 = true;
                } else if (args[4] === 'ipv6') {
                    if (!wantUdp) wantTcp = true;//if wantUdp flag was not set, have to activate default parameter
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                break;
            case 6://4 args
                //arg 1
                if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg 1 is hosts
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(args[2]);
                } else if (parseInt(args[2])) {//arg 1 is ports
                    ports = parsePorts(args[2]);
                } else if (args[2] === 'tcp') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantTcp = true;
                } else if (args[2] === 'udp') {
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(localhost);
                    wantUdp = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 2
                if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                    if (hosts.length !== 0) {//hosts already present
                        showHelp();
                        process.exit(0);
                    }
                    hosts = parseHosts(args[3]);
                } else if (args[3] === 'tcp') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantTcp = true;
                } else if (args[3] === 'udp') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantUdp = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 3
                if (args[4] === 'tcp') {
                    wantTcp = true;
                } else if (args[4] === 'udp') {
                    wantUdp = true;
                } else if (args[4] === 'ipv4') {
                    if (!wantUdp) wantTcp = true;//if wantUdp flag was not set, have to activate default parameter
                    wantIPV4 = true;
                } else if (args[4] === 'ipv6') {
                    if (!wantUdp) wantTcp = true;//if wantUdp flag was not set, have to activate default parameter
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 4
                if (args[5] === 'tcp') {
                    wantTcp = true;
                    wantIPV4 = true;
                } else if (args[5] === 'udp') {
                    wantUdp = true;
                    wantIPV4 = true;
                } else if (args[5] === 'ipv4') {
                    if (!wantUdp) wantTcp = true;//if wantUdp flag was not set, have to activate default parameter
                    wantIPV4 = true;
                } else if (args[5] === 'ipv6') {
                    if (!wantUdp) wantTcp = true;//if wantUdp flag was not set, have to activate default parameter
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                break;
            case 7://5 args
                //arg 1
                if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg 1 is hosts
                    ports = parsePorts(fullPortRange);
                    hosts = parseHosts(args[2]);
                } else if (parseInt(args[2])) {//arg 1 is ports
                    ports = parsePorts(args[2]);
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 2
                if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                    if (hosts.length !== 0) {//hosts already present
                        showHelp();
                        process.exit(0);
                    }
                    hosts = parseHosts(args[3]);
                } else if (args[3] === 'tcp') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantTcp = true;
                } else if (args[3] === 'udp') {
                    if (hosts.length === 0) hosts = parseHosts(localhost);
                    else if (ports.length === 0) ports = parsePorts(fullPortRange);
                    wantUdp = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 3
                if (args[4] === 'tcp') {
                    wantTcp = true;
                } else if (args[4] === 'udp') {
                    wantUdp = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 4
                if (args[5] === 'tcp') {
                    wantTcp = true;
                } else if (args[5] === 'udp') {
                    wantUdp = true;
                } else if (args[5] === 'ipv4') {
                    if (!wantUdp) wantTcp = true;//if wantUdp flag was not set, have to activate default parameter
                    wantIPV4 = true;
                } else if (args[5] === 'ipv6') {
                    if (!wantUdp) wantTcp = true;//if wantUdp flag was not set, have to activate default parameter
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 5
                if (args[6] === 'ipv4') {
                    wantIPV4 = true;
                } else if (args[6] === 'ipv6') {
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                break;
            case 8://6 args
                //arg 1
                if (parseInt(args[2]) && args[2].indexOf('.') === -1 && args[2].indexOf(':') === -1) {//arg 1 is ports
                    ports = parsePorts(args[2]);
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 2
                if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                    hosts = parseHosts(args[3]);
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 3
                if (args[4] === 'tcp') {
                    wantTcp = true;
                } else if (args[4] === 'udp') {
                    wantUdp = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 4
                if (args[5] === 'tcp') {
                    wantTcp = true;
                } else if (args[5] === 'udp') {
                    wantUdp = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 5
                if (args[6] === 'ipv4') {
                    wantIPV4 = true;
                } else if (args[6] === 'ipv6') {
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                //arg 6
                if (args[7] === 'ipv4') {
                    wantIPV4 = true;
                } else if (args[7] === 'ipv6') {
                    wantIPV6 = true;
                } else {
                    showHelp();
                    return process.exit(0);
                }
                break;
            default://too many args
                console.log('Too many args');
                showHelp();
                return process.exit(0);
        }
    } catch (e) {
        if(e instanceof err.BadHostNotationError) {
            console.log(e.name);
            console.log(e.message + ": " + e.host);
            console.log(e.stack);
            process.exit(1);
        } else if(e instanceof err.RangeError) {
            console.log(e.name);
            console.log(e.message + ": " + e.range);
            console.log(e.stack);
            process.exit(1);
        } else {
            console.log('Unknown error:');
            console.log(e.name);
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
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

/*Main()*/{
    const scanParameters = parseArgs();
    console.log(scanParameters);
    if(scanParameters.tcp) {
        if(scanParameters.ipv4) scanPortRange(scanParameters.ports, scanParameters.hosts, 'tcp', 4);
        if(scanParameters.ipv6) scanPortRange(scanParameters.ports, scanParameters.hosts, 'tcp', 6);
    }
    if(scanParameters.udp) {
        if(scanParameters.ipv4) scanPortRange(scanParameters.ports, scanParameters.hosts, 'udp', 4);
        if(scanParameters.ipv6) scanPortRange(scanParameters.ports, scanParameters.hosts, 'udp', 6);
    }
    // process.exit(0);
}
