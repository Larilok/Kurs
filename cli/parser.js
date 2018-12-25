'use strict';

const err = require('./errors.js');

class Parser {
    constructor() {
        this.scanParameters = this.parseArgs();
    }

    parsePorts(ports) {
        if (ports.indexOf('-') !== -1) {
            return ports.split(',').map(port => {
                if (port.indexOf('-') !== -1) {
                    let range = port.split('-');
                    Parser.checkPortRangeValidity(range);
                    let length = range[1] - range[0] + 1;
                    return [...Array(length).keys()].map(x => (x + parseInt(range[0])).toString());
                }
                return port;
            }).reduce((first, second) => first.concat(second), []);
        } else return ports.split(',');
    };

    parseHosts(hosts) {
        let isIPV6 = false;
        let isURL = false;
        hosts.split(',').map((host) => {
            if(host.indexOf(':') !== -1) isIPV6 = true;
            else if( isNaN(parseInt(host.split('.').pop())) ) isURL = true;
        });
        if(!isURL && !isIPV6) {
            if (hosts.indexOf('-') !== -1) {
                return hosts.split(',').map(host => {
                    if (host.indexOf('-') !== -1) {
                        let range = host.split('-');
                        range[1] = range[0].slice(0, range[0].lastIndexOf('.') + 1) + range[1];
                        Parser.checkIPV4HostRangeValidity(range);
                        let length = range[1].slice(range[1].lastIndexOf('.') + 1) - range[0].slice(range[0].lastIndexOf('.') + 1) + 1;
                        return [...Array(length).keys()].map(x => range[0]
                                .slice(0, range[0].lastIndexOf('.') + 1) +
                            (x + parseInt(range[0].slice(range[0].lastIndexOf('.') + 1))).toString());
                    }
                    return host;
                }).reduce((first, second) => first.concat(second), []);
            } else return hosts.split(',');
        } else if(isURL) {
            if(hosts.indexOf(',') !== -1) return hosts.split(',');
            else {
                const returner = [];
                returner.push(hosts);
                return returner;
            }
        } else if(isIPV6) {
            if (hosts.indexOf('-') !== -1) {
                return hosts.split(',').map(host => {
                    if (host.indexOf('-') !== -1) {//has range
                        let range = host.split('-');
                        range[1] = range[0].slice(0, range[0].lastIndexOf(':') + 1) + range[1];
                        Parser.checkIPV6HostRangeValidity(range);
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

    static checkPortRangeValidity(range) {
        if (range[0] === "" || range[1] === "") throw new err.RangeError('Unbounded port range', range);
        if (parseInt(range[0]) > parseInt(range[1])) {
            let tempZero = range[0];
            range[0] = range[1];
            range[1] = tempZero;
        }
    };

    static checkIPV6HostRangeValidity(range) {
        if ((range[0].lastIndexOf(':') === range[0].length - 1 && range[0] !== '::')//':' is the last elem, but address is not '::'
            || (range[1].lastIndexOf(':') === range[1].length - 1) && range[1] !== '::') throw new err.RangeError('Unbounded host range', range);
        if (parseInt(range[0].slice(range[0].lastIndexOf(':') + 1), 16) > parseInt(range[1].slice(range[1].lastIndexOf(':') + 1), 16)) {
            let tempZero = range[0];
            range[0] = range[1];
            range[1] = tempZero;
        }
    };

    static checkIPV4HostRangeValidity(range) {
        if (range[0].lastIndexOf('.') === range[0].length - 1
            || range[1].lastIndexOf('.') === range[1].length - 1) throw new err.RangeError('Unbounded host range', range);
        if (parseInt(range[0].slice(range[0].lastIndexOf('.') + 1)) > parseInt(range[1].slice(range[1].lastIndexOf('.') + 1))) {
            let tempZero = range[0];
            range[0] = range[1];
            range[1] = tempZero;
        }
    };

    static showHelp() {
        console.log(`Port scanner help:
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
        `);
    };

    parseArgs() {
        let ports = [];
        let hosts = [];
        let wantTcp = false;
        let wantUdp = false;
        let wantIPV4 = false;
        let wantIPV6 = false;

        let args = process.argv;
        let fullPortRange = '1-65535';
        let localhost = '127.0.0.1';
        try {
            switch (args.length) {
                case 2://no args
                    ports = this.parsePorts(fullPortRange);
                    hosts = this.parseHosts(localhost);
                    wantTcp = true;
                    wantIPV4 = true;
                    break;
                case 3://1 arg
                    //arg 1
                    if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg is hosts
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(args[2]);
                        wantTcp = true;
                        wantIPV4 = true;
                    } else if (parseInt(args[2])) {//arg is ports
                        ports = this.parsePorts(args[2]);
                        hosts = this.parseHosts(localhost);
                        wantTcp = true;
                        wantIPV4 = true;
                    } else if (args[2] === 'tcp' || args[2] === 'ipv4') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantTcp = true;
                        wantIPV4 = true;
                    } else if (args[2] === 'udp') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantUdp = true;
                        wantIPV4 = true;
                    } else if (args[2] === 'ipv6') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantTcp = true;
                        wantIPV6 = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    break;
                case 4://2 args
                    //arg 1
                    if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg 1 is hosts
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(args[2]);
                    } else if (parseInt(args[2])) {//arg 1 is ports
                        ports = this.parsePorts(args[2]);
                    } else if (args[2] === 'tcp') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantTcp = true;
                    } else if (args[2] === 'udp') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantUdp = true;
                    } else if (args[2] === 'ipv4') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantTcp = true;
                        wantIPV4 = true;
                    } else if (args[2] === 'ipv6') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantTcp = true;
                        wantIPV6 = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 2
                    if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                        if (hosts.length !== 0) {//hosts already present
                            Parser.showHelp();
                            process.exit(0);
                        }
                        hosts = this.parseHosts(args[3]);
                        wantTcp = true;
                        wantIPV4 = true;
                    } else if (args[3] === 'tcp' || args[3] === 'ipv4') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantTcp = true;
                        wantIPV4 = true;
                    } else if (args[3] === 'udp') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantUdp = true;
                        wantIPV4 = true;
                    } else if (args[3] === 'ipv6') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantTcp = true;
                        wantIPV6 = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    break;
                case 5://3 args
                    //arg 1
                    if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg 1 is hosts
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(args[2]);
                    } else if (parseInt(args[2])) {//arg 1 is ports
                        ports = this.parsePorts(args[2]);
                    } else if (args[2] === 'tcp') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantTcp = true;
                    } else if (args[2] === 'udp') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantUdp = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 2
                    if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                        if (hosts.length !== 0) {//hosts already present
                            Parser.showHelp();
                            process.exit(0);
                        }
                        hosts = this.parseHosts(args[3]);
                    } else if (args[3] === 'tcp') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantTcp = true;
                    } else if (args[3] === 'udp') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantUdp = true;
                    } else if (args[3] === 'ipv4') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantIPV4 = true;
                    } else if (args[3] === 'ipv6') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantIPV6 = true;
                    } else {
                        Parser.showHelp();
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
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    break;
                case 6://4 args
                    //arg 1
                    if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg 1 is hosts
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(args[2]);
                    } else if (parseInt(args[2])) {//arg 1 is ports
                        ports = this.parsePorts(args[2]);
                    } else if (args[2] === 'tcp') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantTcp = true;
                    } else if (args[2] === 'udp') {
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(localhost);
                        wantUdp = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 2
                    if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                        if (hosts.length !== 0) {//hosts already present
                            Parser.showHelp();
                            process.exit(0);
                        }
                        hosts = this.parseHosts(args[3]);
                    } else if (args[3] === 'tcp') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantTcp = true;
                    } else if (args[3] === 'udp') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantUdp = true;
                    } else {
                        Parser.showHelp();
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
                        Parser.showHelp();
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
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    break;
                case 7://5 args
                    //arg 1
                    if (args[2].indexOf('.') !== -1 || args[2].indexOf(':') !== -1) {//arg 1 is hosts
                        ports = this.parsePorts(fullPortRange);
                        hosts = this.parseHosts(args[2]);
                    } else if (parseInt(args[2])) {//arg 1 is ports
                        ports = this.parsePorts(args[2]);
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 2
                    if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                        if (hosts.length !== 0) {//hosts already present
                            Parser.showHelp();
                            process.exit(0);
                        }
                        hosts = this.parseHosts(args[3]);
                    } else if (args[3] === 'tcp') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantTcp = true;
                    } else if (args[3] === 'udp') {
                        if (hosts.length === 0) hosts = this.parseHosts(localhost);
                        else if (ports.length === 0) ports = this.parsePorts(fullPortRange);
                        wantUdp = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 3
                    if (args[4] === 'tcp') {
                        wantTcp = true;
                    } else if (args[4] === 'udp') {
                        wantUdp = true;
                    } else {
                        Parser.showHelp();
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
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 5
                    if (args[6] === 'ipv4') {
                        wantIPV4 = true;
                    } else if (args[6] === 'ipv6') {
                        wantIPV6 = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    break;
                case 8://6 args
                    //arg 1
                    if (parseInt(args[2]) && args[2].indexOf('.') === -1 && args[2].indexOf(':') === -1) {//arg 1 is ports
                        ports = this.parsePorts(args[2]);
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 2
                    if (args[3].indexOf('.') !== -1 || args[3].indexOf(':') !== -1) {//arg 2 is hosts
                        hosts = this.parseHosts(args[3]);
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 3
                    if (args[4] === 'tcp') {
                        wantTcp = true;
                    } else if (args[4] === 'udp') {
                        wantUdp = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 4
                    if (args[5] === 'tcp') {
                        wantTcp = true;
                    } else if (args[5] === 'udp') {
                        wantUdp = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 5
                    if (args[6] === 'ipv4') {
                        wantIPV4 = true;
                    } else if (args[6] === 'ipv6') {
                        wantIPV6 = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    //arg 6
                    if (args[7] === 'ipv4') {
                        wantIPV4 = true;
                    } else if (args[7] === 'ipv6') {
                        wantIPV6 = true;
                    } else {
                        Parser.showHelp();
                        return process.exit(0);
                    }
                    break;
                default://too many args
                    console.log('Too many args');
                    Parser.showHelp();
                    return process.exit(0);
            }
        } catch (e) {
            if (e instanceof err.BadHostNotationError) {
                console.log(e.name);
                console.log(e.message + ": " + e.host);
                console.log(e.stack);
                process.exit(1);
            } else if (e instanceof err.RangeError) {
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

}

module.exports = Parser;
