"use strict";Object.defineProperty(exports,"__esModule",{value:!0});class e extends HTMLElement{updateProp(e){var t=void 0===this[e]?this.getAttribute(e):this[e];this.props[e]=""===t||t}constructor(e){super(),this.props=this.props||{},this.state=e||{},[...this.attributes].forEach(e=>this.updateProp(e.name)),new MutationObserver(e=>e.forEach(e=>{this.updateProp(e.attributeName),this.propUpdatedCallback&&this.propUpdatedCallback(e.attributeName)})).observe(this,{attributes:!0}),this.attachShadow({mode:"open"}),this._yoffeeFragment=this.render(),this.shadowRoot.appendChild(this._yoffeeFragment)}disconnectedCallback(){this._yoffeeFragment.__removeWatchers()}connectedCallback(){}propUpdatedCallback(){}}const t=new Map;function s(o,e,s){let i=t.get(o);if(null!=i)i.push({onGet:e,onSet:s});else{i=[{onGet:e,onSet:s}],t.set(o,i);{var r,n=o,a=t=>i.forEach(e=>e.onGet(t,o)),l=(t,s)=>i.forEach(e=>e.onSet(t,s,o));const h={},d=t=>{Object.defineProperty(n,t,{get:()=>(a&&a(t),h[t]),set(e){h[t]=e,l&&l(t,e)}})},u=Object.getOwnPropertyDescriptors(n);for(r of Object.keys(u))"__notWatchedProp"!==r&&(h[r]=n[r],d(r));Object.setPrototypeOf(n,new Proxy(h,{get(e,t){d(t),Reflect.get(n,t)},set:(e,t,s)=>(d(t),n[t]=s,!0)}))}}}const o="Text/CSS node",i="Attribute value",n="Attribute name",l="HTML tag";function r(e,t){var s;for(s of[{type:o,xpath:`.//text()[contains(., '${t}')]`},{type:i,xpath:`.//@*[contains(., '${t}')]`},{type:n,xpath:`.//@*[contains(name(), '${t}')]`},{type:l,xpath:`.//*[contains(name(), '${t}')]`}]){var r=document.evaluate(s.xpath,e,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;if(null!=r)return{domNode:r,searchLocation:s.type}}}function a(e,t){for(var s of t)e=e.replace(s.id,"${"+s._cb.toString()+"}");return e}function h(){return new Array(4).fill(0).map(()=>Math.random().toString(36).substr(2,9)).join("-")}function d(e,t,s){let o=e.get(t);null!=o?o.push(s):e.set(t,[s])}class u{constructor(e,t,s){this.expressions=e,this.domNode=t,this.expressionsLocation=s,this._arrayDomNodes=[],this.initialValue={[o]:()=>t.data,[i]:()=>t.value,[n]:()=>t.name}[s](),this.ownerElement=this.domNode.ownerElement}update(){this.expressionsLocation===o?this._updateTextNodeValue():this.expressionsLocation===i?this._updateAttributeNodeValue():this.expressionsLocation===n&&this._updateAttributeNodeName()}_updateTextNodeValue(){var i,r,n=this.expressions[0];if(!n.cached){let o=n.lastResult;if(null!=o&&!1!==o||(o=""),this._lastTextNodeValue instanceof Array&&!(o instanceof Array)){for(var e of this._arrayDomNodes)this._removeDomNode(e);this._arrayDomNodes=[]}if(o instanceof DocumentFragment&&(o=0===o.childNodes.length?"":1===o.childNodes.length?o.firstChild:[...o.childNodes]),o instanceof Array){this._lastTextNodeValue instanceof Array||(n=document.createElement("yoffee-list-location-marker"),this.domNode.replaceWith(n),this.domNode=n);let e=[],t=null,s=e=>{null==t?null==this._arrayDomNodes[0]?this.domNode.parentNode.insertBefore(e,this.domNode):this.domNode.parentNode.insertBefore(e,(this._arrayDomNodes[0].__isYoffee?this._arrayDomNodes[0].__childNodes:this._arrayDomNodes)[0]):this.domNode.parentNode.insertBefore(e,t.nextSibling),t=e.__isYoffee?e.__childNodes[e.__childNodes.length-1]:e};for(i of o)if(null!=i){var a=this._arrayDomNodes[0];if(null!=a&&(a instanceof Text?a.data:a)===("number"==typeof i?i.toString():i))e.push(a),t=a.__isYoffee?a.__childNodes[a.__childNodes.length-1]:a,this._arrayDomNodes.shift();else if(i="object"==typeof i?i:document.createTextNode(i),e.push(i),i.__isYoffee)for(var l of i.__childNodes)s(l);else{if(i instanceof Array)throw"YOFFEE: List item cannot be another list";s(i)}}for(r of this._arrayDomNodes)-1===e.indexOf(r)&&this._removeDomNode(r);this._arrayDomNodes=e}else if("object"==typeof o){if(!(o instanceof Node))throw"YOFFEE: Text value can't be a regular JS object!";this.domNode.replaceWith(o),this.domNode=o}else"object"==typeof this._lastTextNodeValue?(n=document.createTextNode(o),this.domNode.replaceWith(n),this.domNode=n):this.domNode.data!==o.toString()&&(this.domNode.data=o);this._lastTextNodeValue=o}}_removeDomNode(e){if(e.__isYoffee)for(var t of e.__childNodes)t.remove();else e.remove()}_updateAttributeNodeValue(){if(this.expressions[0].isEventHandler){if(1<this.expressions.length)throw"YOFFEE: Cant have more than one expression as event handler: "+a(this.initialValue,this.expressions);this._setEventListener()}else{var e=this.expressions[0].lastResult,t=1===this.expressions.length&&this.initialValue.length===this.expressions[0].id.length;if(!t||!1!==e&&null!=e)if(t&&["function","object"].includes(typeof e))p(this.ownerElement,this.domNode.name,e),null!=this.domNode.ownerElement&&this.domNode.ownerElement.removeAttributeNode(this.domNode);else if(t&&!0===e)this.ownerElement[this.domNode.name]=void 0,this._setDomNode("");else{this.ownerElement[this.domNode.name]=void 0;let e=this.initialValue;for(var s of this.expressions)e=e.replace(s.id,s.lastResult);this._setDomNode(e)}else this.ownerElement[this.domNode.name]=void 0,this.ownerElement.removeAttribute(this.domNode.name)}}_setDomNode(e){this.domNode.value=e,null==this.domNode.ownerElement&&this.ownerElement.setAttributeNode(this.domNode)}_updateAttributeNodeName(){var e=this.expressions[0].lastResult,t=1===this.expressions.length&&this.initialValue.length===this.expressions[0].id.length;if(this._lastAttributeMap){for(var[s,o]of this._lastAttributeMap)this.ownerElement.removeAttribute(s),c(this.ownerElement,s);this._lastAttributeMap=null}else this.ownerElement.removeAttribute(this.domNode.name);if(!t||!1!==e&&null!=e&&""!==e)if(t&&"object"==typeof e){this._lastAttributeMap=Object.entries(e);for(var[i,r]of this._lastAttributeMap)!1!==r&&null!==r&&(["function","object"].includes(typeof r)?(p(this.ownerElement,i,r),null!=this.domNode.ownerElement&&this.domNode.ownerElement.removeAttributeNode(this.domNode)):(!0===r&&(r=""),this.ownerElement.setAttribute(i,r)))}else{let e=this.initialValue;for(var n of this.expressions)e=e.replace(n.id,n.lastResult);this.ownerElement.setAttribute(e,this.domNode.value),this.domNode=this.ownerElement.getAttributeNode(e)}}_setEventListener(){let e=this.domNode.name,t=e.substring(2),s=(...e)=>{const t=this.expressions[0].lastResult(...e);return"function"==typeof t?t(...e):t};this.domNode.ownerElement.addEventListener(t,s),p(this.domNode.ownerElement,e,s),this.domNode.ownerElement.removeAttributeNode(this.domNode)}}function p(e,t,s){e[t]=s,e.updateProp?e.updateProp(t):(null==e.props&&(e.props={}),e.props[t]=s)}function c(e,t){e[t]=void 0,e.updateProp?e.updateProp(t):(null==e.props&&(e.props={}),e.props[t]=void 0)}function f(t,s){if(t.length!==s.length)return!1;for(let e=0;e<t.length;++e)if(t[e]!==s[e])return!1;return!0}const m="primitive",_="array",N="yoffee_template";class b{constructor(e){this._cb=e,this.id=h(),this.lastResult=null,this.boundNode=null,this.boundProps=new Set,this.isEventHandler=!1,this.isStatic="function"!=typeof this._cb,this.resultType=null,this.resultMetadata=null}execute(){var e;this.cached=!1,this.isEventHandler||this.isStatic?this.lastResult=this._cb:null!=(e=this._cb())&&e.createYoffeeTemplate?this.handleYoffeeTemplate(e):Array.isArray(e)?this.handleArray(e):(this.removeChildTemplateListeners(),this.lastResult=e,this.resultType=m,this.resultMetadata=null)}handleYoffeeTemplate(s){var e,t,o,i;this.resultType===N&&null==this.resultMetadata.yoffeeTemplate||(this.resultType===N&&this.resultMetadata.cacheable&&(e=this.resultMetadata.hash,t=this.resultMetadata.propsObjs,o=s.hash,i=s.propsObjs,e===o&&f(t,i))?(this.cached=!0,this.lastResult.__expressions.forEach((e,t)=>{e._cb=s.expressionCbs[t]}),this.lastResult.__updateExpressions()):(this.removeChildTemplateListeners(),this.resultType=N,this.resultMetadata=s,this.lastResult=s.createYoffeeTemplate()))}handleArray(t){if(this.resultType===_){let e=this.resultMetadata,i=(this.lastResult=[],new Map);this.resultMetadata=i;for(let o of t)if(null!=o&&o.createYoffeeTemplate){let t=!1,s=e.get(o.hash);if(null!=s&&o.cacheable){var r=s.findIndex(e=>f(e.propsObjs,o.propsObjs));if(-1!==r){let e=s.splice(r,1)[0];t=!0,this.lastResult.push(e.yoffeeTemplate),e.shouldntDelete=!0,e.yoffeeTemplate.__expressions.forEach((e,t)=>{e._cb=o.expressionCbs[t]}),e.yoffeeTemplate.__updateExpressions(),d(i,e.hash,e)}}t||(d(i,o.hash,o),r=o.createYoffeeTemplate(),this.lastResult.push(r))}else this.lastResult.push(o);for(var s of e.values())s.forEach(e=>{e.shouldntDelete||e.yoffeeTemplate.__removeWatchers()});for(var o of i.values())o.forEach(e=>{e.shouldntDelete&&(e.shouldntDelete=void 0)})}else{this.removeChildTemplateListeners(),this.lastResult=[];var e,i,n=new Map;for(e of t)null!=e&&e.createYoffeeTemplate?(i=e.createYoffeeTemplate(),this.lastResult.push(i),d(n,e.hash,e)):this.lastResult.push(e);this.resultMetadata=n}this.resultType=_}removeChildTemplateListeners(){null!=this.resultType&&(this.resultType===N?this.resultMetadata.yoffeeTemplate.__removeWatchers():this.resultType===_&&this.lastResult.filter(e=>e.__isYoffee).forEach(e=>e.__removeWatchers()))}}function E(e,t){let s=e.data.trim(),o=s.indexOf(t),i=o+t.length;return 0!==o&&e.parentNode.insertBefore(document.createTextNode(s.substring(0,o)),e),i<s.length&&e.parentNode.insertBefore(document.createTextNode(s.substring(i)),e.nextSibling),e.data=s.substring(o,i),e}function y(o,e){return e.reduce((e,t,s)=>e+t+o[s+1],o[0]).split("").reduce(function(e,t){return(e=(e<<5)-e+t.charCodeAt(0))&e},0)}let x=new Map,w=null,g=!1,v=new Set,T=null,A=(e,t)=>{g&&(t=t.__notWatchedProp+"."+e,v.has(t)||(v.add(t),T.boundProps.add(t),x.has(t)||x.set(t,new Set),x.get(t).add(T)))},Y=(e,t,s)=>{if(g)throw`YOFFEE: Setting properties is not allowed inside an expression! (${e} = ${t})`;t=s.__notWatchedProp+"."+e,s=w,w=t,e=x.get(w);null!=e&&(C([...e],!0),w=s)};const C=(e,s)=>{var t,o=g;g=!0;try{for(let t of e){t.boundProps.forEach(e=>x.get(e).delete(t));var i=new Set(v),r=(s?v=new Set(t.__propsAccessedByFather||[]):t.__propsAccessedByFather=new Set(v),T);T=t,t.execute(),T=r,v=i}}finally{g=o}for(t of new Set(e.map(e=>e.boundNode)))t.update()};function O(m,e,t){let s=document.createDocumentFragment();s.__isYoffee=!0;const n=t.map(e=>new b(e));var h,t=function(e){let t,s=document.createElement("template");if(((e=e.trim()).startsWith("<tr")||e.startsWith("<td"))&&(" "===e[3]||">"===e[3]))throw"YOFFEE: Table tag is not supported";return s.innerHTML=`<yoffee-template-container>${e}</yoffee-template-container>`,t=s.content.firstElementChild,-1<navigator.userAgent.toLowerCase().indexOf("firefox")?document.adoptNode(t):t}((h=e,n.map(e=>e.id).reduce((e,t,s)=>e+t+h[s+1],h[0])));{var d=t,p;e=n;const f=new Map;for(p of e){if(null==(c=r(d,p.id)))throw"YOFFEE: Expression location is not valid: ${"+p._cb.toString()+"}";let{domNode:t,searchLocation:e}=c;if(e===o&&(t=E(t,p.id)),e===l)throw"YOFFEE: Calculating element name is not allowed: "+a(`<${t.localName}>`,[p]);if(e===i&&t.name.startsWith("on")&&(p.isEventHandler=!0),f.has(t)){let e=f.get(t);e.expressions.push(p),p.boundNode=e}else{var c=new u([p],t,e);f.set(t,c),p.boundNode=c}}}return s.__removeWatchers=()=>{for(let t of n)t.boundProps.forEach(e=>x.get(e).delete(t)),t.removeChildTemplateListeners()},C(n),s.__childNodes=[...t.childNodes],s.__expressions=n,s.__updateExpressions=()=>C(n.filter(e=>!e.isStatic&&!e.isEventHandler)),s.append(...t.childNodes),s}exports.YoffeeElement=e,exports.createYoffeeElement=function(t,s){if(s.prototype instanceof e)customElements.define(t,s);else{if(!(s instanceof Function))throw"YOFFEE: `createYoffeeElement` second parameter must be either a YoffeeElement subclass or a function, Got "+typeof renderCb;customElements.define(t,class extends e{render(){return s(this.props,this)}propUpdatedCallback(e){super.propUpdatedCallback(),this.onPropUpdate&&this.onPropUpdate(e)}connectedCallback(){super.connectedCallback(),this.onConnect&&this.onConnect()}disconnectedCallback(){super.disconnectedCallback(),this.onDisconnect&&this.onDisconnect()}})}},exports.html=function(...i){return i.forEach(e=>{if("object"!=typeof e)throw"YOFFEE: Props object must be an object, got "+typeof propsObject;if(null==e)throw"YOFFEE: Props object can't be null";null==e.__notWatchedProp&&(e.__notWatchedProp=h(),s(e,A,Y))}),(e,...s)=>{let o=()=>O(0,e,s);if(g){let t={propsObjs:i,expressionCbs:s,hash:y(e,s),cacheable:!0};return t.createYoffeeTemplate=()=>{var e=o();return t.yoffeeTemplate=e},t}return o()}};
