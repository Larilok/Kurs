'use strict';

const el = (str) => {
  if (str.startsWith('#'))
    return document.getElementById(str.slice(1));
  else if (str.startsWith('.'))
    return document.getElementsByClassName(str.slice(1));
}

window.addEventListener('DOMContentLoaded', () => {
  el('#help').innerHTML = `Use this tool to check for open ports on one or more TCP/UDP host
  <br>Hosts: specifies the hosts to check. You may use:
  <br>      ipv4(xxx.xxx.xxx.255 or xxx.xxx.xxx.),
  <br>      ipv6(xxxx: xxxx: xxxx: xxxx: ffff: ffff: ffff: ffff)
  <br>      url(example.com or http://example.com) 
  <br>      <strong>def = 127.0.0.1 </strong>
  <br>Ports: specifies the ports to scan. Use "," for single ports and "-" for port ranges, <strong>def = 1-65535 </strong>
  <br>TCP: use to perform a tcp scan, <strong>def = true </strong>
  <br>UDP: use to perform a udp scan, <strong>def = false </strong>
  <br>IPv4: use to perform ipv4 scan when using URL as a host, <strong>def = true</strong>
  <br>IPv6: use to perform ipv6 scan when using URL as a host, <strong>def = false</strong>
  <br>ex:
  <br>    Hosts: 127.0.0.1-20
  <br>    Ports: 80,400-500,8080  
  <br>will perform scan for selected ports on each selected host using TCP IPv4 protocol
  `;
},true);


el('#scanBTN').addEventListener('click', () => {
  el('#output').innerHTML = "Scanning..."
  let data = {
    ports: el('#ports').value.trim(),
    hosts: el('#hosts').value.trim(),
    wantTcp: el('#TCP').checked,
    wantUdp: el('#UDP').checked,
    wantIPV4: el('#IPv4').checked,
    wantIPV6: el('#IPv6').checked
  }
  console.log(data);
  
  postData(`http://localhost:4242/USSR`,data)
    
});

function postData(url = ``, data = {}){
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
        // 'Content-type': 'multipart/mixed; charset=UTF-8'
      },
      body:  JSON.stringify(data),
    })
    .then(response => {
      if(!response.ok) el('#output').innerHTML = "HTTP error, status = " + response.status;
      return response.text();})
    .then(data => {
      console.log((data));
      el('#output').innerHTML = (data)
      })
    .catch(error => el('#output').innerHTML = error.message);
}
