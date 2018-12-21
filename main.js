'use strict';

//scan ports hosts

function log(...args) {return console.log(...args)}

console.log(process.argv);

function parsePorts(hosts) {
    hosts = hosts.split(',');
    // console.log(hosts);
    let hostIntervals = [];
    hosts.forEach(host => {
        if(host.indexOf('-') !== -1) {//working on intervals
            // console.log(host);
            host.split('-').forEach(h => hostIntervals.push(h));
            hosts.splice(hosts.indexOf(host), 1);
        }
    });
    // console.log(hosts);
    // console.log(hostIntervals);
    if(hostIntervals.length % 2 !== 0) throw new Error("Trailing interval in hosts");
    return [hosts, hostIntervals];
}

function parseArgs() {
    if(process.argv.length === 2 || process.argv[2] === "help") {
        log(`Port scanner help:
        Use this tool to check for open ports on one or more TCP/UDP host
        Use:
        main.js ports [hosts] [tcp] [udp]
        ports: specifies the ports to scan. Use "," for single ports and "-" for port ranges
                    ex: main.js 80,400-500,8080
        hosts: optional parameter, def = 127:0:0:1
        tcp: use to perform a tcp scan, def = true
        udp: use to perform a udp scan, def = false`);
    }


    if(process.argv[2]) log(parsePorts(process.argv[2]));
    // parseHosts(process.argv[3]);

}

/*Main()*/{
    parseArgs();
}
