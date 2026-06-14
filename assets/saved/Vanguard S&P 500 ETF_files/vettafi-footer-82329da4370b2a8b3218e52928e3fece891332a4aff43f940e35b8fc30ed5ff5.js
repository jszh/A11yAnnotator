var ht=Object.defineProperty;var dt=(i,t,e)=>t in i?ht(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var R=(i,t,e)=>dt(i,typeof t!="symbol"?t+"":t,e);/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const N=globalThis,q=N.ShadowRoot&&(N.ShadyCSS===void 0||N.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,F=Symbol(),J=new WeakMap;let it=class{constructor(t,e,o){if(this._$cssResult$=!0,o!==F)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(q&&t===void 0){const o=e!==void 0&&e.length===1;o&&(t=J.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),o&&J.set(e,t))}return t}toString(){return this.cssText}};const pt=i=>new it(typeof i=="string"?i:i+"",void 0,F),ft=(i,...t)=>{const e=i.length===1?i[0]:t.reduce((o,s,r)=>o+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+i[r+1],i[0]);return new it(e,i,F)},ut=(i,t)=>{if(q)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const o=document.createElement("style"),s=N.litNonce;s!==void 0&&o.setAttribute("nonce",s),o.textContent=e.cssText,i.appendChild(o)}},K=q?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(const o of t.cssRules)e+=o.cssText;return pt(e)})(i):i;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:gt,defineProperty:$t,getOwnPropertyDescriptor:mt,getOwnPropertyNames:_t,getOwnPropertySymbols:vt,getPrototypeOf:xt}=Object,m=globalThis,Z=m.trustedTypes,bt=Z?Z.emptyScript:"",L=m.reactiveElementPolyfillSupport,E=(i,t)=>i,I={toAttribute(i,t){switch(t){case Boolean:i=i?bt:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},rt=(i,t)=>!gt(i,t),Y={attribute:!0,type:String,converter:I,reflect:!1,useDefault:!1,hasChanged:rt};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),m.litPropertyMetadata??(m.litPropertyMetadata=new WeakMap);let y=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??(this.l=[])).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const o=Symbol(),s=this.getPropertyDescriptor(t,o,e);s!==void 0&&$t(this.prototype,t,s)}}static getPropertyDescriptor(t,e,o){const{get:s,set:r}=mt(this.prototype,t)??{get(){return this[e]},set(n){this[e]=n}};return{get:s,set(n){const l=s==null?void 0:s.call(this);r==null||r.call(this,n),this.requestUpdate(t,l,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Y}static _$Ei(){if(this.hasOwnProperty(E("elementProperties")))return;const t=xt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(E("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(E("properties"))){const e=this.properties,o=[..._t(e),...vt(e)];for(const s of o)this.createProperty(s,e[s])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[o,s]of e)this.elementProperties.set(o,s)}this._$Eh=new Map;for(const[e,o]of this.elementProperties){const s=this._$Eu(e,o);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const o=new Set(t.flat(1/0).reverse());for(const s of o)e.unshift(K(s))}else t!==void 0&&e.push(K(t));return e}static _$Eu(t,e){const o=e.attribute;return o===!1?void 0:typeof o=="string"?o:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(e=>e(this))}addController(t){var e;(this._$EO??(this._$EO=new Set)).add(t),this.renderRoot!==void 0&&this.isConnected&&((e=t.hostConnected)==null||e.call(t))}removeController(t){var e;(e=this._$EO)==null||e.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const o of e.keys())this.hasOwnProperty(o)&&(t.set(o,this[o]),delete this[o]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ut(t,this.constructor.elementStyles),t}connectedCallback(){var t;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$EO)==null||t.forEach(e=>{var o;return(o=e.hostConnected)==null?void 0:o.call(e)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(e=>{var o;return(o=e.hostDisconnected)==null?void 0:o.call(e)})}attributeChangedCallback(t,e,o){this._$AK(t,o)}_$ET(t,e){var r;const o=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,o);if(s!==void 0&&o.reflect===!0){const n=(((r=o.converter)==null?void 0:r.toAttribute)!==void 0?o.converter:I).toAttribute(e,o.type);this._$Em=t,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){var r,n;const o=this.constructor,s=o._$Eh.get(t);if(s!==void 0&&this._$Em!==s){const l=o.getPropertyOptions(s),a=typeof l.converter=="function"?{fromAttribute:l.converter}:((r=l.converter)==null?void 0:r.fromAttribute)!==void 0?l.converter:I;this._$Em=s;const h=a.fromAttribute(e,l.type);this[s]=h??((n=this._$Ej)==null?void 0:n.get(s))??h,this._$Em=null}}requestUpdate(t,e,o){var s;if(t!==void 0){const r=this.constructor,n=this[t];if(o??(o=r.getPropertyOptions(t)),!((o.hasChanged??rt)(n,e)||o.useDefault&&o.reflect&&n===((s=this._$Ej)==null?void 0:s.get(t))&&!this.hasAttribute(r._$Eu(t,o))))return;this.C(t,e,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:o,reflect:s,wrapped:r},n){o&&!(this._$Ej??(this._$Ej=new Map)).has(t)&&(this._$Ej.set(t,n??e??this[t]),r!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||o||(e=void 0),this._$AL.set(t,e)),s===!0&&this._$Em!==t&&(this._$Eq??(this._$Eq=new Set)).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var o;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[r,n]of this._$Ep)this[r]=n;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[r,n]of s){const{wrapped:l}=n,a=this[r];l!==!0||this._$AL.has(r)||a===void 0||this.C(r,void 0,n,a)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),(o=this._$EO)==null||o.forEach(s=>{var r;return(r=s.hostUpdate)==null?void 0:r.call(s)}),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){var e;(e=this._$EO)==null||e.forEach(o=>{var s;return(s=o.hostUpdated)==null?void 0:s.call(o)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(e=>this._$ET(e,this[e]))),this._$EM()}updated(t){}firstUpdated(t){}};y.elementStyles=[],y.shadowRootOptions={mode:"open"},y[E("elementProperties")]=new Map,y[E("finalized")]=new Map,L==null||L({ReactiveElement:y}),(m.reactiveElementVersions??(m.reactiveElementVersions=[])).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const C=globalThis,T=C.trustedTypes,G=T?T.createPolicy("lit-html",{createHTML:i=>i}):void 0,nt="$lit$",$=`lit$${Math.random().toFixed(9).slice(2)}$`,at="?"+$,yt=`<${at}>`,b=document,P=()=>b.createComment(""),U=i=>i===null||typeof i!="object"&&typeof i!="function",W=Array.isArray,wt=i=>W(i)||typeof(i==null?void 0:i[Symbol.iterator])=="function",j=`[ 	
\f\r]`,S=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Q=/-->/g,X=/>/g,_=RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),tt=/'/g,et=/"/g,lt=/^(?:script|style|textarea|title)$/i,At=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),d=At(1),w=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),ot=new WeakMap,v=b.createTreeWalker(b,129);function ct(i,t){if(!W(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return G!==void 0?G.createHTML(t):t}const St=(i,t)=>{const e=i.length-1,o=[];let s,r=t===2?"<svg>":t===3?"<math>":"",n=S;for(let l=0;l<e;l++){const a=i[l];let h,f,c=-1,u=0;for(;u<a.length&&(n.lastIndex=u,f=n.exec(a),f!==null);)u=n.lastIndex,n===S?f[1]==="!--"?n=Q:f[1]!==void 0?n=X:f[2]!==void 0?(lt.test(f[2])&&(s=RegExp("</"+f[2],"g")),n=_):f[3]!==void 0&&(n=_):n===_?f[0]===">"?(n=s??S,c=-1):f[1]===void 0?c=-2:(c=n.lastIndex-f[2].length,h=f[1],n=f[3]===void 0?_:f[3]==='"'?et:tt):n===et||n===tt?n=_:n===Q||n===X?n=S:(n=_,s=void 0);const g=n===_&&i[l+1].startsWith("/>")?" ":"";r+=n===S?a+yt:c>=0?(o.push(h),a.slice(0,c)+nt+a.slice(c)+$+g):a+$+(c===-2?l:g)}return[ct(i,r+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),o]};class M{constructor({strings:t,_$litType$:e},o){let s;this.parts=[];let r=0,n=0;const l=t.length-1,a=this.parts,[h,f]=St(t,e);if(this.el=M.createElement(h,o),v.currentNode=this.el.content,e===2||e===3){const c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(s=v.nextNode())!==null&&a.length<l;){if(s.nodeType===1){if(s.hasAttributes())for(const c of s.getAttributeNames())if(c.endsWith(nt)){const u=f[n++],g=s.getAttribute(c).split($),O=/([.?@])?(.*)/.exec(u);a.push({type:1,index:r,name:O[2],strings:g,ctor:O[1]==="."?Ct:O[1]==="?"?kt:O[1]==="@"?Pt:z}),s.removeAttribute(c)}else c.startsWith($)&&(a.push({type:6,index:r}),s.removeAttribute(c));if(lt.test(s.tagName)){const c=s.textContent.split($),u=c.length-1;if(u>0){s.textContent=T?T.emptyScript:"";for(let g=0;g<u;g++)s.append(c[g],P()),v.nextNode(),a.push({type:2,index:++r});s.append(c[u],P())}}}else if(s.nodeType===8)if(s.data===at)a.push({type:2,index:r});else{let c=-1;for(;(c=s.data.indexOf($,c+1))!==-1;)a.push({type:7,index:r}),c+=$.length-1}r++}}static createElement(t,e){const o=b.createElement("template");return o.innerHTML=t,o}}function A(i,t,e=i,o){var n,l;if(t===w)return t;let s=o!==void 0?(n=e._$Co)==null?void 0:n[o]:e._$Cl;const r=U(t)?void 0:t._$litDirective$;return(s==null?void 0:s.constructor)!==r&&((l=s==null?void 0:s._$AO)==null||l.call(s,!1),r===void 0?s=void 0:(s=new r(i),s._$AT(i,e,o)),o!==void 0?(e._$Co??(e._$Co=[]))[o]=s:e._$Cl=s),s!==void 0&&(t=A(i,s._$AS(i,t.values),s,o)),t}class Et{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:o}=this._$AD,s=((t==null?void 0:t.creationScope)??b).importNode(e,!0);v.currentNode=s;let r=v.nextNode(),n=0,l=0,a=o[0];for(;a!==void 0;){if(n===a.index){let h;a.type===2?h=new H(r,r.nextSibling,this,t):a.type===1?h=new a.ctor(r,a.name,a.strings,this,t):a.type===6&&(h=new Ut(r,this,t)),this._$AV.push(h),a=o[++l]}n!==(a==null?void 0:a.index)&&(r=v.nextNode(),n++)}return v.currentNode=b,s}p(t){let e=0;for(const o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(t,o,e),e+=o.strings.length-2):o._$AI(t[e])),e++}}class H{get _$AU(){var t;return((t=this._$AM)==null?void 0:t._$AU)??this._$Cv}constructor(t,e,o,s){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=o,this.options=s,this._$Cv=(s==null?void 0:s.isConnected)??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=A(this,t,e),U(t)?t===p||t==null||t===""?(this._$AH!==p&&this._$AR(),this._$AH=p):t!==this._$AH&&t!==w&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):wt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==p&&U(this._$AH)?this._$AA.nextSibling.data=t:this.T(b.createTextNode(t)),this._$AH=t}$(t){var r;const{values:e,_$litType$:o}=t,s=typeof o=="number"?this._$AC(t):(o.el===void 0&&(o.el=M.createElement(ct(o.h,o.h[0]),this.options)),o);if(((r=this._$AH)==null?void 0:r._$AD)===s)this._$AH.p(e);else{const n=new Et(s,this),l=n.u(this.options);n.p(e),this.T(l),this._$AH=n}}_$AC(t){let e=ot.get(t.strings);return e===void 0&&ot.set(t.strings,e=new M(t)),e}k(t){W(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let o,s=0;for(const r of t)s===e.length?e.push(o=new H(this.O(P()),this.O(P()),this,this.options)):o=e[s],o._$AI(r),s++;s<e.length&&(this._$AR(o&&o._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){var o;for((o=this._$AP)==null?void 0:o.call(this,!1,!0,e);t!==this._$AB;){const s=t.nextSibling;t.remove(),t=s}}setConnected(t){var e;this._$AM===void 0&&(this._$Cv=t,(e=this._$AP)==null||e.call(this,t))}}class z{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,o,s,r){this.type=1,this._$AH=p,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=p}_$AI(t,e=this,o,s){const r=this.strings;let n=!1;if(r===void 0)t=A(this,t,e,0),n=!U(t)||t!==this._$AH&&t!==w,n&&(this._$AH=t);else{const l=t;let a,h;for(t=r[0],a=0;a<r.length-1;a++)h=A(this,l[o+a],e,a),h===w&&(h=this._$AH[a]),n||(n=!U(h)||h!==this._$AH[a]),h===p?t=p:t!==p&&(t+=(h??"")+r[a+1]),this._$AH[a]=h}n&&!s&&this.j(t)}j(t){t===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Ct extends z{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===p?void 0:t}}class kt extends z{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==p)}}class Pt extends z{constructor(t,e,o,s,r){super(t,e,o,s,r),this.type=5}_$AI(t,e=this){if((t=A(this,t,e,0)??p)===w)return;const o=this._$AH,s=t===p&&o!==p||t.capture!==o.capture||t.once!==o.once||t.passive!==o.passive,r=t!==p&&(o===p||s);s&&this.element.removeEventListener(this.name,this,o),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e;typeof this._$AH=="function"?this._$AH.call(((e=this.options)==null?void 0:e.host)??this.element,t):this._$AH.handleEvent(t)}}class Ut{constructor(t,e,o){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(t){A(this,t)}}const B=C.litHtmlPolyfillSupport;B==null||B(M,H),(C.litHtmlVersions??(C.litHtmlVersions=[])).push("3.3.1");const Mt=(i,t,e)=>{const o=(e==null?void 0:e.renderBefore)??t;let s=o._$litPart$;if(s===void 0){const r=(e==null?void 0:e.renderBefore)??null;o._$litPart$=s=new H(t.insertBefore(P(),r),r,void 0,e??{})}return s._$AI(i),s};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const x=globalThis;class k extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e;const t=super.createRenderRoot();return(e=this.renderOptions).renderBefore??(e.renderBefore=t.firstChild),t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Mt(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return w}}var st;k._$litElement$=!0,k.finalized=!0,(st=x.litElementHydrateSupport)==null||st.call(x,{LitElement:k});const D=x.litElementPolyfillSupport;D==null||D({LitElement:k});(x.litElementVersions??(x.litElementVersions=[])).push("4.2.1");class V extends k{constructor(){super(),this.config=null,this._collapsedSections=new Set}connectedCallback(){if(super.connectedCallback(),!this.config){const t=this.getAttribute("config");if(t)try{this.config=JSON.parse(t)}catch(e){console.error("Failed to parse config attribute:",e)}}}_toggleSection(t){this._collapsedSections.has(t)?this._collapsedSections.delete(t):this._collapsedSections.add(t),this.requestUpdate()}_renderLogo(){var t;return(t=this.config)!=null&&t.logo?this.config.logo.type==="image"?d`<img src="${this.config.logo.src}" alt="${this.config.logo.alt||"Logo"}" />`:d`<span>${this.config.logo.text}</span>`:""}_handleNewsletterSubmit(t){t.preventDefault();const e=this.shadowRoot.querySelector(".newsletter-input"),o=e.value;if(!o||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o)){alert("Please enter a valid email address.");return}const{hubspotPortalId:s,hubspotFormId:r}=this.config.newsletter;fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${s}/${r}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fields:[{name:"email",value:o}],context:{pageUri:window.location.href,pageName:document.title}})}).then(n=>n.json()).then(()=>{e.value="",alert("Thank you for subscribing!")}).catch(n=>{console.error("Newsletter signup error:",n),alert("Something went wrong. Please try again.")})}_renderNewsletter(){var t;return(t=this.config)!=null&&t.newsletter?d`
      <div class="newsletter-signup">
        <span class="newsletter-label">${this.config.newsletter.label||"Sign up for our insights:"}</span>
        <div class="newsletter-form">
          <input 
            type="email" 
            class="newsletter-input" 
            placeholder="${this.config.newsletter.placeholder||"Enter your Email*"}"
            aria-label="Email address"
          />
          <button class="newsletter-button" aria-label="Subscribe" @click="${this._handleNewsletterSubmit}">
            <span class="button-text-desktop">${this.config.newsletter.buttonText||"Subscribe"}</span>
            <span class="button-text-mobile">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="17" viewBox="0 0 11 17" fill="none">
                <path d="M1.3667 15.0334L9.5667 8.20012L5.4667 4.78345L1.3667 1.36678" stroke="white" stroke-width="2.73333" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>
        </div>
      </div>
    `:""}_renderColumns(){var t;return(t=this.config)!=null&&t.columns?this.config.columns.map((e,o)=>{const s=this._collapsedSections.has(e.title);return d`
        <div class="footer-column ${s?"collapsed":""}">
          <h3 @click="${()=>this._toggleSection(e.title)}">${e.title}</h3>
          <ul>
            ${e.links.map(r=>d`
              <li>
                <a 
                  href="${r.url}" 
                  ${r.external?'target="_blank" rel="noopener noreferrer"':""}
                >
                  ${r.text}
                  ${r.external?d`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" class="external-icon">
  <path d="M9 6.5V9.5C9 9.76522 8.89464 10.0196 8.70711 10.2071C8.51957 10.3946 8.26522 10.5 8 10.5H2.5C2.23478 10.5 1.98043 10.3946 1.79289 10.2071C1.60536 10.0196 1.5 9.76522 1.5 9.5V4C1.5 3.73478 1.60536 3.48043 1.79289 3.29289C1.98043 3.10536 2.23478 3 2.5 3H5.5" stroke="#CACACA" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.5 1.5H10.5V4.5" stroke="#CACACA" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 7L10.5 1.5" stroke="#CACACA" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`:""}
                </a>
              </li>
            `)}
          </ul>
        </div>
      `}):""}_renderContact(){var s;if(!((s=this.config)!=null&&s.contact))return"";const t=this.config.contact.url||"#",e=this.config.contact.url?"_blank":"_self",o=this.config.contact.url?"noopener noreferrer":"";return d`
      <div class="footer-contact">
        <h3>
          ${this.config.contact.url?d`
            <a href="${t}" target="${e}" rel="${o}">Contact us</a>
          `:"Contact us"}
        </h3>
        <address>
          ${this.config.contact.address.split(`
`).map(r=>d`${r}<br/>`)}
        </address>
      </div>
    `}_renderSocials(){var e;if(!((e=this.config)!=null&&e.socials))return"";const t={linkedin:d`<svg class="social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`,twitter:d`<svg class="social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,youtube:d`<svg class="social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>`};return d`
      <div class="footer-social">
        <span class="social-label">Follow us:</span>
        <div class="social-links">
          ${this.config.socials.map(o=>d`
            <a 
              href="${o.url}" 
              class="social-link" 
              aria-label="${o.platform}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${t[o.platform]||o.platform}
            </a>
          `)}
        </div>
      </div>
    `}render(){var t;return this.config?d`
      <footer class="footer">
        <div class="footer-container">
          <div class="footer-top">
            <a href="${((t=this.config.logo)==null?void 0:t.url)||"/"}" class="logo">
              ${this._renderLogo()}
            </a>
            ${this._renderNewsletter()}
          </div>

          <div class="footer-links">
            ${this._renderContact()}
            ${this._renderColumns()}
          </div>

          <div class="footer-bottom">
            <div class="footer-meta">
              <p class="copyright">${this.config.copyright||`© ${new Date().getFullYear()} All rights reserved.`}</p>
              ${this.config.legalLinks?d`
                <div class="footer-legal">
                  ${this.config.legalLinks.map(e=>d`
                    <a href="${e.url}">${e.text}</a>
                  `)}
                </div>
              `:""}
            </div>
            ${this._renderSocials()}
          </div>
        </div>
      </footer>

      ${this.config.showVettaFiBadge!==!1?d`
        <div class="vettafi-badge">
        <div class="vettafi-badge-content">
          <span>A publication from</span>
          <a href="https://www.vettafi.com/" target="_blank" rel="noopener noreferrer">
            <img 
              src="https://cdn.prod.website-files.com/6647c61db5a8e6133ca32e7e/6704f0b74c17d479069a4b33_VettaFi_Logo_Purple.svg" 
              alt="VettaFi" 
              class="vettafi-logo"
            />
          </a>
        </div>
        </div>
      `:""}
    `:d``}}R(V,"properties",{config:{type:Object}}),R(V,"styles",ft`
    :host {
      display: block;
      font-family: 'Proxima Nova', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      --footer-bg: #2b2b2b;
      --footer-text: #ffffff;
      --footer-links: #CACACA;
      --footer-link-hover: #a78bfa;
      --primary-color: #755FC4;
      --input-bg: #ffffff;
      --input-text: #333333;
    }

    * {
      box-sizing: border-box;
    }

    .footer {
      background-color: var(--footer-bg);
      color: var(--footer-text);
      padding: 48px 24px 24px;
    }

    .footer-container {
      max-width: 1260px;
      margin: 0 auto;
    }

    .footer-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
      gap: 32px;
      flex-wrap: wrap;
    }

    .logo {
      font-size: 32px;
      font-weight: bold;
      color: var(--footer-text);
      text-decoration: none;
    }

    .logo img {
      height: 23px;
      width: auto;
    }

    .newsletter-signup {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .newsletter-label {
      font-size: 16px;
      white-space: nowrap;
    }

    .newsletter-form {
      display: flex;
      gap: 8px;
    }

    .newsletter-input {
      padding: 16px 20px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      min-width: 280px;
      background: var(--input-bg);
      color: var(--input-text);
      flex: 1;
    }

    .newsletter-input::placeholder {
      color: #999;
    }

    .newsletter-button {
      padding: 16px 32px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-size: 17px;
      font-weight: 600;
      transition: background-color 0.2s;
      white-space: nowrap;
    }

    .newsletter-button:hover {
      background-color: #6449a8;
    }

    .button-text-mobile {
      display: none;
    }

    .footer-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 48px 32px;
      margin-bottom: 20px;
      padding-top: 48px;
      padding-bottom: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer-column h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: var(--footer-text);
    }

    .footer-column ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-column li {
      margin-bottom: 12px;
    }

    .footer-column a {
      color: var(--footer-links);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .footer-column a:hover {
      color: var(--footer-link-hover);
    }

    .external-icon {
      width: 12px;
      height: 12px;
    }

    .footer-contact {
    }

    .footer-contact h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .footer-contact h3 a {
      color: var(--footer-text);
      text-decoration: underline;
      transition: color 0.2s;
    }

    .footer-contact h3 a:hover {
      color: var(--footer-link-hover);
    }

    .footer-contact address {
      font-style: normal;
      font-size: 14px;
      line-height: 1.6;
    }

    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
    }

    .footer-meta {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .copyright {
      font-size: 14px;
      opacity: 0.8;
    }

    .footer-legal {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .footer-legal a {
      color: var(--footer-text);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }

    .footer-legal a:hover {
      color: var(--footer-link-hover);
    }

    .footer-social {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .social-label {
      font-size: 14px;
      opacity: 0.8;
    }

    .social-links {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .social-link {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--footer-text);
      transition: all 0.2s;
      text-decoration: none;
    }

    .social-link:hover {
      color: var(--footer-link-hover);
    }

    .social-icon {
      width: 20px;
      height: 20px;
    }

    .vettafi-badge {
      width: 100%;
      background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
      padding: 20px;
      text-align: right;
    }

    .vettafi-badge-content {
      max-width: 1260px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      color: #1f2937;
      font-size: 14px;
    }

    .vettafi-logo {
      height: 24px;
      width: auto;
      filter: brightness(0) saturate(100%);
    }

    .footer-column.mobile-accordion {
      display: none;
    }

    @media (max-width: 768px) {
      .footer {
        padding: 32px 16px 16px;
      }

      .footer-top {
        flex-direction: column;
        margin-bottom: 32px;
      }

      .newsletter-signup {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }

      .newsletter-form {
        width: 100%;
        position: relative;
      }

      .newsletter-input {
        width: 100%;
        min-width: 0;
        padding-right: 60px;
        border-radius: 8px;
      }

      .newsletter-button {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        padding: 0;
        width: 50px;
        border-radius: 0 8px 8px 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .button-text-desktop {
        display: none;
      }

      .button-text-mobile {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .footer-links {
        display: flex;
        flex-direction: column;
        gap: 0;
        margin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
        border-top: none;
        border-bottom: none;
      }

      .footer-column {
        order: 1;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .footer-contact {
        order: 2;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 16px 0;
      }

      .footer-column:not(.collapsed) {
        padding: 16px 0;
      }

      .footer-column.collapsed {
        padding-top: 16px;
        padding-bottom: 0;
      }

      .footer-social {
        order: 1;
        margin: 24px 0;
        flex-direction: row;
        width: 100%;
      }

      .footer-column h3 {
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
      }

      .footer-column h3::after {
        content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 7L8.5 4L11 1" stroke="%23818181" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
        display: inline-block;
        transition: transform 0.3s;
        transform: rotate(180deg);
      }

      .footer-column.collapsed h3::after {
        transform: rotate(0deg);
      }

      .footer-column.collapsed ul {
        display: none;
      }

      .footer-contact h3 {
        cursor: default;
      }

      .footer-contact h3 a {
        cursor: pointer;
      }

      .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
        margin: 0 0 40px;
        gap: 0;
      }

      .footer-meta {
        order: 2;
        gap: 0;
      }
    }

  `);customElements.define("vettafi-footer",V);
