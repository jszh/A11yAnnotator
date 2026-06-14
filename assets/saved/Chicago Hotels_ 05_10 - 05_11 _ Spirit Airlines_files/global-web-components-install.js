;(function () {
  // The environment and domain variables affect site behavior.
  // Please take care when creating Istio Track names to avoid
  // issues with this logic.
  const hostname = window.location.hostname
  const isPriceline =
    !!hostname && /\.?priceline\.(com|localhost)$/i.test(hostname)
  const isProduction =
    !!hostname && !/(qa|dev|local)[abc]?\.|localhost/i.test(hostname)
  const environment = isProduction ? 'PROD' : 'NONPROD'
  const isSiteWideScriptLoader =
    window.__PCLN_SI_PERSISTENCE__?.isSiteWideScriptLoader

  // ==================================== INJECT GTM JS BUNDLE
  if (!isSiteWideScriptLoader) {
    // ==================================== PerimeterX
    window._pxParam5 = 'D'
    const _PX_SCRIPT = document.createElement('script')
    const pxAppIds = {
      'PCLN:PROD': 'PX9aTjSd0n',
      'PCLN:NONPROD': 'PXi2NLtINk'
    }
    const pxAppId = pxAppIds['PCLN:' + environment] || pxAppIds['PCLN:PROD']

    _PX_SCRIPT.id = 'px-script'
    // Double quote use for PX source string, in interest to avoid character
    // escaping introduce to script source code
    _PX_SCRIPT.innerHTML =
      "(function(){window._pxAppId = '" +
      pxAppId +
      "';var re = new RegExp('SITESERVER=ID=([^;]+)');var value = re.exec(document.cookie);window._pxParam1 = (value != null) ? unescape(value[1]) : null;var p = document.getElementsByTagName('script')[0],s = document.createElement('script');s.async = 1;s.src = '/" +
      pxAppId.slice(2) +
      "/init.js';p.parentNode.insertBefore(s,p);}());"

    document.head.appendChild(_PX_SCRIPT)
    const _GTM_SNIPPET = document.createElement('script')
    _GTM_SNIPPET.id = 'gtm-snippet'
    _GTM_SNIPPET.innerHTML =
      "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n" +
      "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n" +
      "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n" +
      "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n" +
      "})(window,document,'script','dataLayer','GTM-NNPL4L');"

    document.head.appendChild(_GTM_SNIPPET)
  }

  if (isPriceline) {
    // ==================================== INJECT JS BUNDLE
    const _JS_BUNDLE = document.createElement('script')
    _JS_BUNDLE.src =
      '/global-web-components/public/js/global-web-components-bundle.9b98836f.js'
    _JS_BUNDLE.async = false
    document.head.appendChild(_JS_BUNDLE)
    // ====================================
  }

  // ==================================== INJECT GTM JS BUNDLE
  if (!isSiteWideScriptLoader) {
    const _GTM_SNIPPET_NOSCRIPT = document.createElement('noscript')
    const gtmIframe = document.createElement('iframe')
    gtmIframe.src = 'https://www.googletagmanager.com/ns.html?id=GTM-NNPL4L'
    gtmIframe.height = '0'
    gtmIframe.width = '0'
    gtmIframe.style = 'display:none;visibility:hidden'
    _GTM_SNIPPET_NOSCRIPT.appendChild(gtmIframe)
    document.body.prepend(_GTM_SNIPPET_NOSCRIPT)

    // ==================================== INJECT MIXED CONTENT BUNDLE
    const MIXED_CONTENT_SCRIPT_TAG = document.createElement('script')
    MIXED_CONTENT_SCRIPT_TAG.id = 'mixed-content-script'
    MIXED_CONTENT_SCRIPT_TAG.innerHTML =
      ';(function(){var MC_CHECK_CUTOFF=10,mcCheckRoll=Math.floor(100*Math.random())+1;mcCheckRoll<=MC_CHECK_CUTOFF&&(window.mcChecker={INTERVAL_MS:1e4,MAX_TRIES:3,tryCount:0,urlsAlreadyChecked:{},sendLog:function(e){var t=JSON.stringify(e),n=new XMLHttpRequest;n.open("POST","/pws/v0/fly/tag/batch",!0),n.setRequestHeader("Content-Type","application/json"),n.send(t)},checkMixedCalls:function(){this.tryCount++;var e=window.performance&&window.performance.getEntriesByType("resource").filter(function(e){return e&&e.name&&0!==e.name.indexOf("https:")}),t={tags:[]};if(e&&0<e.length){for(idx=0;idx<e.length;idx++)if(!this.urlsAlreadyChecked[e[idx].name]){this.urlsAlreadyChecked[e[idx].name]=!0;var n={action:"mixed_content",httpUrl:e[idx].name,pageUrl:document.location.href};t.tags.push({data:n})}0<t.tags.length&&this.sendLog(t)}this.tryCount>=this.MAX_TRIES&&clearInterval(this.intervalRef)},checkMixedCallsWrapper:function(){try{this.checkMixedCalls()}catch(e){}},start:function(){var e=this;this.intervalRef=window.setInterval(function(){e.checkMixedCallsWrapper()},this.INTERVAL_MS)}},window.mcChecker.start());}())'
    document.body.appendChild(MIXED_CONTENT_SCRIPT_TAG)

    const forterScriptMap = {
      PROD: {
        siteId: '7736390f98ba',
        sri: 'sha256-PcAAkf8lBlR6jflKk34W1g0yGjnIIxF/2yEzm36+Puk='
      },
      NONPROD: {
        siteId: 'fa0078112fc4',
        sri: 'sha256-PsoDXOlG0EMSbXZ//FeZTL5YadQ7shU1Uxjivug0JCI='
      }
    }
    const forterScriptDetails = forterScriptMap[environment]

    // Vender code
    if (forterScriptDetails) {
      const forterScriptCode =
        '(function() { var merchantConfig = {csp: true};const sri ="' +
        forterScriptDetails.sri +
        '";const siteId ="' +
        forterScriptDetails.siteId +
        '"; function t(t,n){for(var e=t.split(""),r=0;r<e.length;++r)e[r]=String.fromCharCode(e[r].charCodeAt(0)+n);return e.join("")}function n(n){return t(n,-S).replace(/%SN%/g,siteId)}function e(){var t="no"+"op"+"fn",n="g"+"a",e="n"+"ame";return window[n]&&window[n][e]===t}function r(){return!(!navigator.brave||"function"!=typeof navigator.brave.isBrave)}function o(){return document.currentScript&&document.currentScript.src}function i(t){try{O.ex=t,e()&&-1===O.ex.indexOf(V.uB)&&(O.ex+=V.uB),r()&&-1===O.ex.indexOf(V.uBr)&&(O.ex+=V.uBr),o()&&-1===O.ex.indexOf(V.nIL)&&(O.ex+=V.nIL),window.ftr__snp_cwc||(O.ex+=V.s),b(O)}catch(t){}}function c(t,n){function e(o){try{o.blockedURI===t&&(n(),document.removeEventListener(r,e))}catch(t){document.removeEventListener(r,e)}}var r="securitypolicyviolation";document.addEventListener(r,e),setTimeout(function(){document.removeEventListener(r,e)},2*60*1e3)}function a(t,n,e,r){var o=!1;n&&(t=t.replace("%I%",encodeURIComponent(n))),t="https://"+t,c(t,function(){r(!0),o=!0});var i=document.createElement("script");i.onerror=function(){if(!o)try{r(!1),o=!0}catch(t){}},i.onload=e,i.type="text/javascript",i.id="ftr__script",i.async=!0,i.src=t,n&&(i.integrity=n,i.crossOrigin=!0);var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)}function u(t,n,e,r){var o=!1,i=new XMLHttpRequest;if(c("https:"+t,function(){e(new Error("CSP Violation"),!0),o=!0}),"//"===t.slice(0,2)&&(t="https:"+t),"withCredentials"in i)i.open("GET",t,!0);else{if("undefined"==typeof XDomainRequest)return;i=new XDomainRequest,i.open("GET",t)}Object.keys(r).forEach(function(t){i.setRequestHeader(t,r[t])}),i.onload=function(){"function"==typeof n&&n(i)},i.onerror=function(t){if("function"==typeof e&&!o)try{e(t,!1),o=!0}catch(t){}},i.onprogress=function(){},i.ontimeout=function(){"function"==typeof e&&e("tim"+"eo"+"ut",!1)},setTimeout(function(){i.send()},0)}function d(t,siteId,n){function e(t){var n=t.toString(16);return n.length%2?"0"+n:n}function r(t){if(t<=0)return"";for(var n="0123456789abcdef",e="",r=0;r<t;r++)e+=n[Math.floor(Math.random()*n.length)];return e}function o(t){for(var n="",r=0;r<t.length;r++)n+=e(t.charCodeAt(r));return n}function i(t){for(var n=t.split(""),e=0;e<n.length;++e)n[e]=String.fromCharCode(255^n[e].charCodeAt(0));return n.join("")}n=n?"1":"0";var c=[];return c.push(t),c.push(siteId),c.push(n),function(t){var n=40,e="";return t.length<n/2&&(e=","+r(n/2-t.length-1)),o(i(t+e))}(c.join(","))}function f(){function t(){k&&(Q(V.dUAL),setTimeout(s,D,V.dUAL))}function n(t,n){i(n?V.uAS+V.uF+V.cP:V.uAS+V.uF)}window.ftr__fdad(t,n)}function s(t){try{var n=t===V.uDF?q:k;if(!n)return;var e=function(){try{X(),i(t+V.uS)}catch(t){}},r=function(n){try{X(),O.td=1*new Date-O.ts,i(n?t+V.uF+V.cP:t+V.uF),t===V.uDF&&f()}catch(t){i(V.eUoe)}};a(n,sri,e,r)}catch(n){i(t+V.eTlu)}}var v="22g6otrwjeq6qsu1forxgiurqw1qhw2vwdwxv",h="fort",w="erTo",l="ken";window.ftr__config={m:merchantConfig,s:"17",si:siteId};var m=!1,p=h+w+l,g=10,_={write:function(t,n,e,r){void 0===r&&(r=!0);var o,i;if(e?(o=new Date,o.setTime(o.getTime()+24*e*60*60*1e3),i="; expires="+o.toGMTString()):i="",!r)return void(document.cookie=escape(t)+"="+escape(n)+i+"; path=/");for(var c=1,a=document.domain.split("."),u=g,d=!0;d&&a.length>=c&&u>0;){var f=a.slice(-c).join(".");document.cookie=escape(t)+"="+escape(n)+i+"; path=/; domain="+f;var s=_.read(t);null!=s&&s==n||(f="."+f,document.cookie=escape(t)+"="+escape(n)+i+"; path=/; domain="+f),d=-1===document.cookie.indexOf(t+"="+n),c++,u--}},read:function(t){var n=null;try{for(var e=escape(t)+"=",r=document.cookie.split(";"),o=32,i=0;i<r.length;i++){for(var c=r[i];c.charCodeAt(0)===o;)c=c.substring(1,c.length);0===c.indexOf(e)&&(n=unescape(c.substring(e.length,c.length)))}}finally{return n}}},y=window.ftr__config.s;y+="ck";var T=function(t){var n=!1,e=null,r=function(){try{if(!e||!n)return;e.remove&&"function"==typeof e.remove?e.remove():document.head.removeChild(e),n=!1}catch(t){}};document.head&&(!function(){e=document.createElement("link"),e.setAttribute("rel","pre"+"con"+"nect"),e.setAttribute("cros"+"sori"+"gin","anonymous"),e.onload=r,e.onerror=r,e.setAttribute("href",t),document.head.appendChild(e),n=!0}(),setTimeout(r,3e3))},S=3,x=n(v||"22g6otrwjeq6qsu1forxgiurqw1qhw2vwdwxv"),L=t("[0Uhtxhvw0LG",-S),A=t("[0Fruuhodwlrq0LG",-S),U=t("Li0Qrqh0Pdwfk",-S),k,C="fgq71iruwhu1frp",q=n("(VQ(1"+C+"2vq2(VQ(2(L(2vfulsw1mv"),I=n("(VQ(1"+C+"2vqV2(VQ(2(L(2vfulsw1mv"),D=10;window.ftr__startScriptLoad=1*new Date;var E=function(t){var n="ft"+"r:tok"+"enR"+"eady";window.ftr__tt&&clearTimeout(window.ftr__tt),window.ftr__tt=setTimeout(function(){try{delete window.ftr__tt,t+="_tt";var e=document.createEvent("Event");e.initEvent(n,!1,!1),e.detail=t,document.dispatchEvent(e)}catch(t){}},1e3)},b=function(t){var n=function(t){return t||""},e=n(t.id)+"_"+n(t.ts)+"_"+n(t.td)+"_"+n(t.ex)+"_"+n(y);_.write(p,e,400,!0),E(e),window.ftr__gt=e},F=function(){var t=_.read(p)||"",n=t.split("_"),e=function(t){return n[t]||void 0};return{id:e(0),ts:e(1),td:e(2),ex:e(3),vr:e(4)}},R=function(){for(var t={},n="fgu",e=[],r=0;r<256;r++)e[r]=(r<16?"0":"")+r.toString(16);var o=function(t,n,r,o,i){var c=i?"-":"";return e[255&t]+e[t>>8&255]+e[t>>16&255]+e[t>>24&255]+c+e[255&n]+e[n>>8&255]+c+e[n>>16&15|64]+e[n>>24&255]+c+e[63&r|128]+e[r>>8&255]+c+e[r>>16&255]+e[r>>24&255]+e[255&o]+e[o>>8&255]+e[o>>16&255]+e[o>>24&255]},i=function(){if(window.Uint32Array&&window.crypto&&window.crypto.getRandomValues){var t=new window.Uint32Array(4);return window.crypto.getRandomValues(t),{d0:t[0],d1:t[1],d2:t[2],d3:t[3]}}return{d0:4294967296*Math.random()>>>0,d1:4294967296*Math.random()>>>0,d2:4294967296*Math.random()>>>0,d3:4294967296*Math.random()>>>0}},c=function(){var t="",n=function(t,n){for(var e="",r=t;r>0;--r)e+=n.charAt(1e3*Math.random()%n.length);return e};return t+=n(2,"0123456789"),t+=n(1,"123456789"),t+=n(8,"0123456789")};return t.safeGenerateNoDash=function(){try{var t=i();return o(t.d0,t.d1,t.d2,t.d3,!1)}catch(t){try{return n+c()}catch(t){}}},t.isValidNumericalToken=function(t){return t&&t.toString().length<=11&&t.length>=9&&parseInt(t,10).toString().length<=11&&parseInt(t,10).toString().length>=9},t.isValidUUIDToken=function(t){return t&&32===t.toString().length&&/^[a-z0-9]+$/.test(t)},t.isValidFGUToken=function(t){return 0==t.indexOf(n)&&t.length>=12},t}(),V={uDF:"UDF",dUAL:"dUAL",uAS:"UAS",mLd:"1",eTlu:"2",eUoe:"3",uS:"4",uF:"9",tmos:["T5","T10","T15","T30","T60"],tmosSecs:[5,10,15,30,60],bIR:"43",uB:"u",uBr:"b",cP:"c",nIL:"i",s:"s"};try{var O=F();try{O.id&&(R.isValidNumericalToken(O.id)||R.isValidUUIDToken(O.id)||R.isValidFGUToken(O.id))?window.ftr__ncd=!1:(O.id=R.safeGenerateNoDash(),window.ftr__ncd=!0),O.ts=window.ftr__startScriptLoad,b(O),window.ftr__snp_cwc=!!_.read(p),window.ftr__snp_cwc||(q=I);for(var B="for"+"ter"+".co"+"m",G="ht"+"tps://c"+"dn9."+B,M="ht"+"tps://"+O.id+"-"+siteId+".cd"+"n."+B,j="http"+"s://cd"+"n3."+B,N=[G,M,j],H=0;H<N.length;H++)T(N[H]);var P=new Array(V.tmosSecs.length),Q=function(t){for(var n=0;n<V.tmosSecs.length;n++)P[n]=setTimeout(i,1e3*V.tmosSecs[n],t+V.tmos[n])},X=function(){for(var t=0;t<V.tmosSecs.length;t++)clearTimeout(P[t])};window.ftr__fdad=function(n,e){if(!m){m=!0;var r={};r[U]=d(window.ftr__config.s,siteId,window.ftr__config.m.csp),u(x,function(e){try{var r=e.getAllResponseHeaders().toLowerCase();if(r.indexOf(A.toLowerCase())>=0){var o=e.getResponseHeader(A);window.ftr__altd2=t(atob(o),-S-1)}if(r.indexOf(L.toLowerCase())<0)return;var i=e.getResponseHeader(L),c=t(atob(i),-S-1);if(c){var a=c.split(":");if(a&&2===a.length){for(var u=a[0],d=a[1],f="",s=0,v=0;s<20;++s)f+=s%3>0&&v<12?siteId.charAt(v++):O.id.charAt(s);var h=d.split(",");if(h.length>1){var w=h[0],l=h[1];k=u+"/"+encodeURIComponent(sri)+"/"+w+"."+f+"."+l}}}n()}catch(t){}},function(t,n){e&&e(t,n)},r)}},Q(V.uDF),setTimeout(s,D,V.uDF)}catch(t){i(V.mLd)}}catch(t){}})();'

      const _FORTER_SCRIPT = document.createElement('script')
      _FORTER_SCRIPT.id = forterScriptDetails.siteId
      _FORTER_SCRIPT.innerHTML = forterScriptCode
      document.body.appendChild(_FORTER_SCRIPT)
    }
  }
})()
