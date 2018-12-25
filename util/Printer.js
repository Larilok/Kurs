'use strict'


class Printer{

  constructor(val){
    this._value =  val;
  }

  showOpenGates() {
    console.log('Scanning complete');
      if (this._value.open.length <= this._value.closed.length || this._value.open.length <= 100) {//less open ports than closed
        console.log('Open ports are:');
        this._value.open.map(port => {
          console.log(port);
        });
      } else {//less closed ports
          console.log('Too many open ports. Closed ports are:');
          this._value.closed.map(port => {
              console.log(port);
          })
      }
    };

    showOpenGatesWeb() {
      let output = '';
      output += 'Scanning complete';
      if (this._value.open.length <= this._value.closed.length || this._value.open.length <= 100) {//less open ports than closed
        output += 'Open ports are:';
        this._value.open.map(port => {
          output += port;
        });
      } else {//less closed ports
         putput += 'Too many open ports. Closed ports are:';
          this._value.closed.map(port => {
              output += port;
          })
        }
      return output;
    }
    
    showOpenGatesMixed() {
      let output = '';
      output += 'Scanning complete';
      console.log('Scanning complete');
      if (this._value.open.length <= this._value.closed.length || this._value.open.length <= 100) {//less open ports than closed
        output += 'Open ports are:';
        console.log('Open ports are:');
        this._value.open.map(port => {
          output += port;
          console.log(port);
        });
      } else {//less closed ports
         putput += 'Too many open ports. Closed ports are:';
         console.log('Too many open ports. Closed ports are:');
          this._value.closed.map(port => {
              output += port;
              console.log(port);
          })
        }
      return output;
    }

  getData() {
    return this._value;
  }
}