
/*@preserve
***Version 2.44.1***
*/

/*@license
 *                       Copyright 2002 - 2018 Qualtrics, LLC.
 *                                All rights reserved.
 *
 * Notice: All code, text, concepts, and other information herein (collectively, the
 * "Materials") are the sole property of Qualtrics, LLC, except to the extent
 * otherwise indicated. The Materials are proprietary to Qualtrics and are protected
 * under all applicable laws, including copyright, patent (as applicable), trade
 * secret, and contract law. Disclosure or reproduction of any Materials is strictly
 * prohibited without the express prior written consent of an authorized signatory
 * of Qualtrics. For disclosure requests, please contact notice@qualtrics.com.
 */

try {
  !function(t){var i={};function e(n){if(i[n])return i[n].exports;var o=i[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,e),o.l=!0,o.exports}e.m=t,e.c=i,e.d=function(t,i,n){e.o(t,i)||Object.defineProperty(t,i,{enumerable:!0,get:n})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,i){if(1&i&&(t=e(t)),8&i)return t;if(4&i&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(e.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&i&&"string"!=typeof t)for(var o in t)e.d(n,o,function(i){return t[i]}.bind(null,o));return n},e.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(i,"a",i),i},e.o=function(t,i){return Object.prototype.hasOwnProperty.call(t,i)},e.p="",e(e.s=0)}([function(t,i,e){t.exports=e(1)},function(t,i){QSI.Link=QSI.util.Creative({initialize:function(t){this.globalInitialize(t),this.options.locators&&(QSI.PipedText.setLocators(this.options.locators),this.options.text=QSI.PipedText.evaluateLocators(this.options.text)),this.shouldShow()&&this.insertLink()},insertLink:function(){if(this.options.insertionLocation&&this.options.targetURL){var t=this.options.text||this.options.targetURL;this.link=QSI.util.build("a",{className:"QSILink "+this.id+"_Link",href:"javascript:void(0);"},t),new QSI.Target(this.link,this.getTargetHelper(),this.actionOptions,this),QSI.util.$(this.options.insertionLocation).appendChild(this.link),this.impress(),this.displayed.resolve()}},remove:function(){this.link&&QSI.util.remove(this.link)}})}]);
} catch(e) {
  if (typeof QSI !== 'undefined' && QSI.dbg && QSI.dbg.e) {
    QSI.dbg.e(e);
  }
}