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
          output += JSON.stringify(port).slice(1, JSON.stringify(port).length-1) +'\n';
        });
      } else {//less closed ports
         putput += 'Too many open ports. Closed ports are:';
          this._value.closed.map(port => {
            output += JSON.stringify(port).slice(1, JSON.stringify(port).length-1) +'\n';
          })
        }
      return output;
    }
    
    showOpenGatesMixed() {
         console.log("in show Gates!!!!!!! ");
      let output = '';
      output += 'Scanning complete\n';
      console.log('Scanning complete');
      if (this._value.open.length <= this._value.closed.length || this._value.open.length <= 100) {//less open ports than closed
        output += 'Open ports are:\n';
        console.log('Open ports are:');
        this._value.open.map(port => {
          output += JSON.stringify(port).slice(1, JSON.stringify(port).length-1) +'\n';
          console.log(JSON.stringify(port).slice(1, JSON.stringify(port).length-1));
        });
      } else {//less closed ports
         output += 'Too many open ports. Closed ports are:';
         console.log('Too many open ports. Closed ports are:');
          this._value.closed.map(port => {
            output += JSON.stringify(port).slice(1, JSON.stringify(port).length-1) +'\n';
              console.log(JSON.stringify(port).slice(1, JSON.stringify(port).length-1));
          })
        }
        console.log(output);
      return output;
    }
}

module.exports = Printer;
