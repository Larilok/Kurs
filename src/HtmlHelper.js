'use strict';

class HtmlHelper {
  constructor() {
    this.instance = null;
  }

  getInstance(){
    if(this.instance === null){
      this.instance = new HtmlHelper();
    }
    return this.instance;
  }

  el(str){
    if (str.startsWith('#'))
      return document.getElementById(str.slice(1));
    else if (str.startsWith('.'))
      return document.getElementsByClassName(str.slice(1));
  }

}

module.exports = new HtmlHelper();
