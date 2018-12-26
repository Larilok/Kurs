'use strict';

const err = require('../../util/errors');
const net = require('net');

class Parser {
    constructor(obj) {
        this.scanParameters = this.parseArgs(obj);
    }

    parsePorts(ports) {
      if (ports.indexOf('-') !== -1) {
        return ports.split(',').map(port => {
          console.log(isNaN(parseInt(port)), parseInt(port));
          
          if (port.indexOf('-') !== -1) {
              let range = port.split('-');
              this.checkPortRangeValidity(range);
              let length = range[1] - range[0] + 1;
              return [...Array(length).keys()].map(x => (x + parseInt(range[0])).toString());
          }
            return port;
          }).reduce((first, second) => first.concat(second), []);
      } else {
        if(isNaN(parseInt(port)) || parseInt(port) < 1 || parseInt(port) > 65535) throw new Error('invalid port');
          return ports.split(',');
      }
    };

    isURL(str) {
      const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      return pattern.test(str);
    }

    parseHosts(hosts) {

      let isIPV6 = false,
          isURL = false;
        hosts = hosts.split(',').map(host => {
          console.log(!net.isIP(host) , !this.isURL(host),!(net.isIP(host) && this.isURL(host)) );
          if((!net.isIP(host) && !this.isURL(host))) throw new Error("Not a host");
          if((host.split(':')[0].slice(0,4) === 'http')) {
            return host.split(':')[1].slice(2, host.length);
          }
          else return host;
        }).toString();
        

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
            } else {
              if(!net.isIPV6)
              return hosts.split(',');
            }
        } else if (isURL) {
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

    checkPortRangeValidity(range) {
        if (range[0] === "" || range[1] === "") throw new err.RangeError('Unbounded port range', range);
        if (parseInt(range[0]) > parseInt(range[1])) {
            let tempZero = range[0];
            range[0] = range[1];
            range[1] = tempZero;
        }
    };

    checkIPV6HostRangeValidity(range) {
        if ((range[0].lastIndexOf(':') === range[0].length - 1 && range[0] !== '::')//':' is the last elem, but address is not '::'
            || (range[1].lastIndexOf(':') === range[1].length - 1) && range[1] !== '::') throw new err.RangeError('Unbounded host range', range);
        if (parseInt(range[0].slice(range[0].lastIndexOf(':') + 1), 16) > parseInt(range[1].slice(range[1].lastIndexOf(':') + 1), 16)) {
            let tempZero = range[0];
            range[0] = range[1];
            range[1] = tempZero;
        }
    };

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
    parseArgs(obj) {
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
          // console.log(hosts,ports);

          
          if(ports === '')  ports = this.parsePorts(fullPortRange);
          else ports = this.parsePorts(ports);
          if(hosts === '')  hosts = this.parseHosts(localhost);
          else hosts = this.parseHosts(hosts);
        } catch (e) {
          console.log(e);
            if (e instanceof err.BadHostNotationError) {
              console.log('1');
                return  e.name + '\n' + e.message + ": " + e.host + '\n' + e.stack;
            } else if (e instanceof err.RangeError) {
              console.log('2');
              return e.name + '\n' + e.message + ": " + e.range + '\n' + e.stack;

            } else {
              console.log('3');
              return 'Unknown error:' + e.name + '\n' + e.message + '\n' + e.stack;
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
