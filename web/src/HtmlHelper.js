'use strict';

class HtmlHelper {
  el(str){
    if (str.startsWith('#'))
      return document.getElementById(str.slice(1));
    else if (str.startsWith('.'))
      return document.getElementsByClassName(str.slice(1));
  }
}

module.exports = new HtmlHelper();
