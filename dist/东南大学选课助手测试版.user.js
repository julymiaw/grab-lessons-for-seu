// ==UserScript==
// @name         东南大学选课助手（测试版）
// @namespace    https://github.com/julymiaw/grab-lessons-for-seu
// @version      4.0.1
// @author       july
// @description  实验性重构版本，尚未经真实选课系统验证
// @license      MIT
// @match        https://newxk.urp.seu.edu.cn/xsxk/elective/grablessons*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const t$1 = globalThis, e$2 = t$1.ShadowRoot && (void 0 === t$1.ShadyCSS || t$1.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$2 = Symbol(), o$3 = new WeakMap();
  let n$2 = class n {
    constructor(t2, e2, o2) {
      if (this._$cssResult$ = true, o2 !== s$2) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
      this.cssText = t2, this.t = e2;
    }
    get styleSheet() {
      let t2 = this.o;
      const s2 = this.t;
      if (e$2 && void 0 === t2) {
        const e2 = void 0 !== s2 && 1 === s2.length;
        e2 && (t2 = o$3.get(s2)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), e2 && o$3.set(s2, t2));
      }
      return t2;
    }
    toString() {
      return this.cssText;
    }
  };
  const r$2 = (t2) => new n$2("string" == typeof t2 ? t2 : t2 + "", void 0, s$2), i$3 = (t2, ...e2) => {
    const o2 = 1 === t2.length ? t2[0] : e2.reduce((e3, s2, o3) => e3 + ((t3) => {
      if (true === t3._$cssResult$) return t3.cssText;
      if ("number" == typeof t3) return t3;
      throw Error("Value passed to 'css' function must be a 'css' function result: " + t3 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
    })(s2) + t2[o3 + 1], t2[0]);
    return new n$2(o2, t2, s$2);
  }, S$1 = (s2, o2) => {
    if (e$2) s2.adoptedStyleSheets = o2.map((t2) => t2 instanceof CSSStyleSheet ? t2 : t2.styleSheet);
    else for (const e2 of o2) {
      const o3 = document.createElement("style"), n3 = t$1.litNonce;
      void 0 !== n3 && o3.setAttribute("nonce", n3), o3.textContent = e2.cssText, s2.appendChild(o3);
    }
  }, c$2 = e$2 ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
    let e2 = "";
    for (const s2 of t3.cssRules) e2 += s2.cssText;
    return r$2(e2);
  })(t2) : t2;
  const { is: i$2, defineProperty: e$1, getOwnPropertyDescriptor: h$1, getOwnPropertyNames: r$1, getOwnPropertySymbols: o$2, getPrototypeOf: n$1 } = Object, a$1 = globalThis, c$1 = a$1.trustedTypes, l$1 = c$1 ? c$1.emptyScript : "", p$1 = a$1.reactiveElementPolyfillSupport, d$1 = (t2, s2) => t2, u$1 = { toAttribute(t2, s2) {
    switch (s2) {
      case Boolean:
        t2 = t2 ? l$1 : null;
        break;
      case Object:
      case Array:
        t2 = null == t2 ? t2 : JSON.stringify(t2);
    }
    return t2;
  }, fromAttribute(t2, s2) {
    let i2 = t2;
    switch (s2) {
      case Boolean:
        i2 = null !== t2;
        break;
      case Number:
        i2 = null === t2 ? null : Number(t2);
        break;
      case Object:
      case Array:
        try {
          i2 = JSON.parse(t2);
        } catch (t3) {
          i2 = null;
        }
    }
    return i2;
  } }, f$1 = (t2, s2) => !i$2(t2, s2), b$1 = { attribute: true, type: String, converter: u$1, reflect: false, useDefault: false, hasChanged: f$1 };
  Symbol.metadata ??= Symbol("metadata"), a$1.litPropertyMetadata ??= new WeakMap();
  let y$1 = class y extends HTMLElement {
    static addInitializer(t2) {
      this._$Ei(), (this.l ??= []).push(t2);
    }
    static get observedAttributes() {
      return this.finalize(), this._$Eh && [...this._$Eh.keys()];
    }
    static createProperty(t2, s2 = b$1) {
      if (s2.state && (s2.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t2) && ((s2 = Object.create(s2)).wrapped = true), this.elementProperties.set(t2, s2), !s2.noAccessor) {
        const i2 = Symbol(), h2 = this.getPropertyDescriptor(t2, i2, s2);
        void 0 !== h2 && e$1(this.prototype, t2, h2);
      }
    }
    static getPropertyDescriptor(t2, s2, i2) {
      const { get: e2, set: r2 } = h$1(this.prototype, t2) ?? { get() {
        return this[s2];
      }, set(t3) {
        this[s2] = t3;
      } };
      return { get: e2, set(s3) {
        const h2 = e2?.call(this);
        r2?.call(this, s3), this.requestUpdate(t2, h2, i2);
      }, configurable: true, enumerable: true };
    }
    static getPropertyOptions(t2) {
      return this.elementProperties.get(t2) ?? b$1;
    }
    static _$Ei() {
      if (this.hasOwnProperty(d$1("elementProperties"))) return;
      const t2 = n$1(this);
      t2.finalize(), void 0 !== t2.l && (this.l = [...t2.l]), this.elementProperties = new Map(t2.elementProperties);
    }
    static finalize() {
      if (this.hasOwnProperty(d$1("finalized"))) return;
      if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d$1("properties"))) {
        const t3 = this.properties, s2 = [...r$1(t3), ...o$2(t3)];
        for (const i2 of s2) this.createProperty(i2, t3[i2]);
      }
      const t2 = this[Symbol.metadata];
      if (null !== t2) {
        const s2 = litPropertyMetadata.get(t2);
        if (void 0 !== s2) for (const [t3, i2] of s2) this.elementProperties.set(t3, i2);
      }
      this._$Eh = new Map();
      for (const [t3, s2] of this.elementProperties) {
        const i2 = this._$Eu(t3, s2);
        void 0 !== i2 && this._$Eh.set(i2, t3);
      }
      this.elementStyles = this.finalizeStyles(this.styles);
    }
    static finalizeStyles(s2) {
      const i2 = [];
      if (Array.isArray(s2)) {
        const e2 = new Set(s2.flat(1 / 0).reverse());
        for (const s3 of e2) i2.unshift(c$2(s3));
      } else void 0 !== s2 && i2.push(c$2(s2));
      return i2;
    }
    static _$Eu(t2, s2) {
      const i2 = s2.attribute;
      return false === i2 ? void 0 : "string" == typeof i2 ? i2 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
    }
    constructor() {
      super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
    }
    _$Ev() {
      this._$ES = new Promise((t2) => this.enableUpdating = t2), this._$AL = new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t2) => t2(this));
    }
    addController(t2) {
      (this._$EO ??= new Set()).add(t2), void 0 !== this.renderRoot && this.isConnected && t2.hostConnected?.();
    }
    removeController(t2) {
      this._$EO?.delete(t2);
    }
    _$E_() {
      const t2 = new Map(), s2 = this.constructor.elementProperties;
      for (const i2 of s2.keys()) this.hasOwnProperty(i2) && (t2.set(i2, this[i2]), delete this[i2]);
      t2.size > 0 && (this._$Ep = t2);
    }
    createRenderRoot() {
      const t2 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
      return S$1(t2, this.constructor.elementStyles), t2;
    }
    connectedCallback() {
      this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t2) => t2.hostConnected?.());
    }
    enableUpdating(t2) {
    }
    disconnectedCallback() {
      this._$EO?.forEach((t2) => t2.hostDisconnected?.());
    }
    attributeChangedCallback(t2, s2, i2) {
      this._$AK(t2, i2);
    }
    _$ET(t2, s2) {
      const i2 = this.constructor.elementProperties.get(t2), e2 = this.constructor._$Eu(t2, i2);
      if (void 0 !== e2 && true === i2.reflect) {
        const h2 = (void 0 !== i2.converter?.toAttribute ? i2.converter : u$1).toAttribute(s2, i2.type);
        this._$Em = t2, null == h2 ? this.removeAttribute(e2) : this.setAttribute(e2, h2), this._$Em = null;
      }
    }
    _$AK(t2, s2) {
      const i2 = this.constructor, e2 = i2._$Eh.get(t2);
      if (void 0 !== e2 && this._$Em !== e2) {
        const t3 = i2.getPropertyOptions(e2), h2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== t3.converter?.fromAttribute ? t3.converter : u$1;
        this._$Em = e2;
        const r2 = h2.fromAttribute(s2, t3.type);
        this[e2] = r2 ?? this._$Ej?.get(e2) ?? r2, this._$Em = null;
      }
    }
    requestUpdate(t2, s2, i2, e2 = false, h2) {
      if (void 0 !== t2) {
        const r2 = this.constructor;
        if (false === e2 && (h2 = this[t2]), i2 ??= r2.getPropertyOptions(t2), !((i2.hasChanged ?? f$1)(h2, s2) || i2.useDefault && i2.reflect && h2 === this._$Ej?.get(t2) && !this.hasAttribute(r2._$Eu(t2, i2)))) return;
        this.C(t2, s2, i2);
      }
      false === this.isUpdatePending && (this._$ES = this._$EP());
    }
    C(t2, s2, { useDefault: i2, reflect: e2, wrapped: h2 }, r2) {
      i2 && !(this._$Ej ??= new Map()).has(t2) && (this._$Ej.set(t2, r2 ?? s2 ?? this[t2]), true !== h2 || void 0 !== r2) || (this._$AL.has(t2) || (this.hasUpdated || i2 || (s2 = void 0), this._$AL.set(t2, s2)), true === e2 && this._$Em !== t2 && (this._$Eq ??= new Set()).add(t2));
    }
    async _$EP() {
      this.isUpdatePending = true;
      try {
        await this._$ES;
      } catch (t3) {
        Promise.reject(t3);
      }
      const t2 = this.scheduleUpdate();
      return null != t2 && await t2, !this.isUpdatePending;
    }
    scheduleUpdate() {
      return this.performUpdate();
    }
    performUpdate() {
      if (!this.isUpdatePending) return;
      if (!this.hasUpdated) {
        if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
          for (const [t4, s3] of this._$Ep) this[t4] = s3;
          this._$Ep = void 0;
        }
        const t3 = this.constructor.elementProperties;
        if (t3.size > 0) for (const [s3, i2] of t3) {
          const { wrapped: t4 } = i2, e2 = this[s3];
          true !== t4 || this._$AL.has(s3) || void 0 === e2 || this.C(s3, void 0, i2, e2);
        }
      }
      let t2 = false;
      const s2 = this._$AL;
      try {
        t2 = this.shouldUpdate(s2), t2 ? (this.willUpdate(s2), this._$EO?.forEach((t3) => t3.hostUpdate?.()), this.update(s2)) : this._$EM();
      } catch (s3) {
        throw t2 = false, this._$EM(), s3;
      }
      t2 && this._$AE(s2);
    }
    willUpdate(t2) {
    }
    _$AE(t2) {
      this._$EO?.forEach((t3) => t3.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
    }
    _$EM() {
      this._$AL = new Map(), this.isUpdatePending = false;
    }
    get updateComplete() {
      return this.getUpdateComplete();
    }
    getUpdateComplete() {
      return this._$ES;
    }
    shouldUpdate(t2) {
      return true;
    }
    update(t2) {
      this._$Eq &&= this._$Eq.forEach((t3) => this._$ET(t3, this[t3])), this._$EM();
    }
    updated(t2) {
    }
    firstUpdated(t2) {
    }
  };
  y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$1("elementProperties")] = new Map(), y$1[d$1("finalized")] = new Map(), p$1?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
  const t = globalThis, i$1 = (t2) => t2, s$1 = t.trustedTypes, e = s$1 ? s$1.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, h = "$lit$", o$1 = `lit$${Math.random().toFixed(9).slice(2)}$`, n2 = "?" + o$1, r = `<${n2}>`, l = document, c = () => l.createComment(""), a = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, u = Array.isArray, d = (t2) => u(t2) || "function" == typeof t2?.[Symbol.iterator], f = "[ 	\n\f\r]", v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _ = /-->/g, m = />/g, p = RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), g = /'/g, $ = /"/g, y2 = /^(?:script|style|textarea|title)$/i, x = (t2) => (i2, ...s2) => ({ _$litType$: t2, strings: i2, values: s2 }), b = x(1), E = Symbol.for("lit-noChange"), A = Symbol.for("lit-nothing"), C = new WeakMap(), P = l.createTreeWalker(l, 129);
  function V(t2, i2) {
    if (!u(t2) || !t2.hasOwnProperty("raw")) throw Error("invalid template strings array");
    return void 0 !== e ? e.createHTML(i2) : i2;
  }
  const N = (t2, i2) => {
    const s2 = t2.length - 1, e2 = [];
    let n3, l2 = 2 === i2 ? "<svg>" : 3 === i2 ? "<math>" : "", c2 = v;
    for (let i3 = 0; i3 < s2; i3++) {
      const s3 = t2[i3];
      let a2, u2, d2 = -1, f2 = 0;
      for (; f2 < s3.length && (c2.lastIndex = f2, u2 = c2.exec(s3), null !== u2); ) f2 = c2.lastIndex, c2 === v ? "!--" === u2[1] ? c2 = _ : void 0 !== u2[1] ? c2 = m : void 0 !== u2[2] ? (y2.test(u2[2]) && (n3 = RegExp("</" + u2[2], "g")), c2 = p) : void 0 !== u2[3] && (c2 = p) : c2 === p ? ">" === u2[0] ? (c2 = n3 ?? v, d2 = -1) : void 0 === u2[1] ? d2 = -2 : (d2 = c2.lastIndex - u2[2].length, a2 = u2[1], c2 = void 0 === u2[3] ? p : '"' === u2[3] ? $ : g) : c2 === $ || c2 === g ? c2 = p : c2 === _ || c2 === m ? c2 = v : (c2 = p, n3 = void 0);
      const x2 = c2 === p && t2[i3 + 1].startsWith("/>") ? " " : "";
      l2 += c2 === v ? s3 + r : d2 >= 0 ? (e2.push(a2), s3.slice(0, d2) + h + s3.slice(d2) + o$1 + x2) : s3 + o$1 + (-2 === d2 ? i3 : x2);
    }
    return [V(t2, l2 + (t2[s2] || "<?>") + (2 === i2 ? "</svg>" : 3 === i2 ? "</math>" : "")), e2];
  };
  class S {
    constructor({ strings: t2, _$litType$: i2 }, e2) {
      let r2;
      this.parts = [];
      let l2 = 0, a2 = 0;
      const u2 = t2.length - 1, d2 = this.parts, [f2, v2] = N(t2, i2);
      if (this.el = S.createElement(f2, e2), P.currentNode = this.el.content, 2 === i2 || 3 === i2) {
        const t3 = this.el.content.firstChild;
        t3.replaceWith(...t3.childNodes);
      }
      for (; null !== (r2 = P.nextNode()) && d2.length < u2; ) {
        if (1 === r2.nodeType) {
          if (r2.hasAttributes()) for (const t3 of r2.getAttributeNames()) if (t3.endsWith(h)) {
            const i3 = v2[a2++], s2 = r2.getAttribute(t3).split(o$1), e3 = /([.?@])?(.*)/.exec(i3);
            d2.push({ type: 1, index: l2, name: e3[2], strings: s2, ctor: "." === e3[1] ? I : "?" === e3[1] ? L : "@" === e3[1] ? z : H }), r2.removeAttribute(t3);
          } else t3.startsWith(o$1) && (d2.push({ type: 6, index: l2 }), r2.removeAttribute(t3));
          if (y2.test(r2.tagName)) {
            const t3 = r2.textContent.split(o$1), i3 = t3.length - 1;
            if (i3 > 0) {
              r2.textContent = s$1 ? s$1.emptyScript : "";
              for (let s2 = 0; s2 < i3; s2++) r2.append(t3[s2], c()), P.nextNode(), d2.push({ type: 2, index: ++l2 });
              r2.append(t3[i3], c());
            }
          }
        } else if (8 === r2.nodeType) if (r2.data === n2) d2.push({ type: 2, index: l2 });
        else {
          let t3 = -1;
          for (; -1 !== (t3 = r2.data.indexOf(o$1, t3 + 1)); ) d2.push({ type: 7, index: l2 }), t3 += o$1.length - 1;
        }
        l2++;
      }
    }
    static createElement(t2, i2) {
      const s2 = l.createElement("template");
      return s2.innerHTML = t2, s2;
    }
  }
  function M(t2, i2, s2 = t2, e2) {
    if (i2 === E) return i2;
    let h2 = void 0 !== e2 ? s2._$Co?.[e2] : s2._$Cl;
    const o2 = a(i2) ? void 0 : i2._$litDirective$;
    return h2?.constructor !== o2 && (h2?._$AO?.(false), void 0 === o2 ? h2 = void 0 : (h2 = new o2(t2), h2._$AT(t2, s2, e2)), void 0 !== e2 ? (s2._$Co ??= [])[e2] = h2 : s2._$Cl = h2), void 0 !== h2 && (i2 = M(t2, h2._$AS(t2, i2.values), h2, e2)), i2;
  }
  class R {
    constructor(t2, i2) {
      this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i2;
    }
    get parentNode() {
      return this._$AM.parentNode;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    u(t2) {
      const { el: { content: i2 }, parts: s2 } = this._$AD, e2 = (t2?.creationScope ?? l).importNode(i2, true);
      P.currentNode = e2;
      let h2 = P.nextNode(), o2 = 0, n3 = 0, r2 = s2[0];
      for (; void 0 !== r2; ) {
        if (o2 === r2.index) {
          let i3;
          2 === r2.type ? i3 = new k(h2, h2.nextSibling, this, t2) : 1 === r2.type ? i3 = new r2.ctor(h2, r2.name, r2.strings, this, t2) : 6 === r2.type && (i3 = new Z(h2, this, t2)), this._$AV.push(i3), r2 = s2[++n3];
        }
        o2 !== r2?.index && (h2 = P.nextNode(), o2++);
      }
      return P.currentNode = l, e2;
    }
    p(t2) {
      let i2 = 0;
      for (const s2 of this._$AV) void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i2), i2 += s2.strings.length - 2) : s2._$AI(t2[i2])), i2++;
    }
  }
  class k {
    get _$AU() {
      return this._$AM?._$AU ?? this._$Cv;
    }
    constructor(t2, i2, s2, e2) {
      this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t2, this._$AB = i2, this._$AM = s2, this.options = e2, this._$Cv = e2?.isConnected ?? true;
    }
    get parentNode() {
      let t2 = this._$AA.parentNode;
      const i2 = this._$AM;
      return void 0 !== i2 && 11 === t2?.nodeType && (t2 = i2.parentNode), t2;
    }
    get startNode() {
      return this._$AA;
    }
    get endNode() {
      return this._$AB;
    }
    _$AI(t2, i2 = this) {
      t2 = M(this, t2, i2), a(t2) ? t2 === A || null == t2 || "" === t2 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t2 !== this._$AH && t2 !== E && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : d(t2) ? this.k(t2) : this._(t2);
    }
    O(t2) {
      return this._$AA.parentNode.insertBefore(t2, this._$AB);
    }
    T(t2) {
      this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
    }
    _(t2) {
      this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(l.createTextNode(t2)), this._$AH = t2;
    }
    $(t2) {
      const { values: i2, _$litType$: s2 } = t2, e2 = "number" == typeof s2 ? this._$AC(t2) : (void 0 === s2.el && (s2.el = S.createElement(V(s2.h, s2.h[0]), this.options)), s2);
      if (this._$AH?._$AD === e2) this._$AH.p(i2);
      else {
        const t3 = new R(e2, this), s3 = t3.u(this.options);
        t3.p(i2), this.T(s3), this._$AH = t3;
      }
    }
    _$AC(t2) {
      let i2 = C.get(t2.strings);
      return void 0 === i2 && C.set(t2.strings, i2 = new S(t2)), i2;
    }
    k(t2) {
      u(this._$AH) || (this._$AH = [], this._$AR());
      const i2 = this._$AH;
      let s2, e2 = 0;
      for (const h2 of t2) e2 === i2.length ? i2.push(s2 = new k(this.O(c()), this.O(c()), this, this.options)) : s2 = i2[e2], s2._$AI(h2), e2++;
      e2 < i2.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i2.length = e2);
    }
    _$AR(t2 = this._$AA.nextSibling, s2) {
      for (this._$AP?.(false, true, s2); t2 !== this._$AB; ) {
        const s3 = i$1(t2).nextSibling;
        i$1(t2).remove(), t2 = s3;
      }
    }
    setConnected(t2) {
      void 0 === this._$AM && (this._$Cv = t2, this._$AP?.(t2));
    }
  }
  class H {
    get tagName() {
      return this.element.tagName;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    constructor(t2, i2, s2, e2, h2) {
      this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t2, this.name = i2, this._$AM = e2, this.options = h2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = A;
    }
    _$AI(t2, i2 = this, s2, e2) {
      const h2 = this.strings;
      let o2 = false;
      if (void 0 === h2) t2 = M(this, t2, i2, 0), o2 = !a(t2) || t2 !== this._$AH && t2 !== E, o2 && (this._$AH = t2);
      else {
        const e3 = t2;
        let n3, r2;
        for (t2 = h2[0], n3 = 0; n3 < h2.length - 1; n3++) r2 = M(this, e3[s2 + n3], i2, n3), r2 === E && (r2 = this._$AH[n3]), o2 ||= !a(r2) || r2 !== this._$AH[n3], r2 === A ? t2 = A : t2 !== A && (t2 += (r2 ?? "") + h2[n3 + 1]), this._$AH[n3] = r2;
      }
      o2 && !e2 && this.j(t2);
    }
    j(t2) {
      t2 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
    }
  }
  class I extends H {
    constructor() {
      super(...arguments), this.type = 3;
    }
    j(t2) {
      this.element[this.name] = t2 === A ? void 0 : t2;
    }
  }
  class L extends H {
    constructor() {
      super(...arguments), this.type = 4;
    }
    j(t2) {
      this.element.toggleAttribute(this.name, !!t2 && t2 !== A);
    }
  }
  class z extends H {
    constructor(t2, i2, s2, e2, h2) {
      super(t2, i2, s2, e2, h2), this.type = 5;
    }
    _$AI(t2, i2 = this) {
      if ((t2 = M(this, t2, i2, 0) ?? A) === E) return;
      const s2 = this._$AH, e2 = t2 === A && s2 !== A || t2.capture !== s2.capture || t2.once !== s2.once || t2.passive !== s2.passive, h2 = t2 !== A && (s2 === A || e2);
      e2 && this.element.removeEventListener(this.name, this, s2), h2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
    }
    handleEvent(t2) {
      "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t2) : this._$AH.handleEvent(t2);
    }
  }
  class Z {
    constructor(t2, i2, s2) {
      this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i2, this.options = s2;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AI(t2) {
      M(this, t2);
    }
  }
  const B = t.litHtmlPolyfillSupport;
  B?.(S, k), (t.litHtmlVersions ??= []).push("3.3.3");
  const D = (t2, i2, s2) => {
    const e2 = s2?.renderBefore ?? i2;
    let h2 = e2._$litPart$;
    if (void 0 === h2) {
      const t3 = s2?.renderBefore ?? null;
      e2._$litPart$ = h2 = new k(i2.insertBefore(c(), t3), t3, void 0, s2 ?? {});
    }
    return h2._$AI(t2), h2;
  };
  const s = globalThis;
  class i extends y$1 {
    constructor() {
      super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
    }
    createRenderRoot() {
      const t2 = super.createRenderRoot();
      return this.renderOptions.renderBefore ??= t2.firstChild, t2;
    }
    update(t2) {
      const r2 = this.render();
      this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = D(r2, this.renderRoot, this.renderOptions);
    }
    connectedCallback() {
      super.connectedCallback(), this._$Do?.setConnected(true);
    }
    disconnectedCallback() {
      super.disconnectedCallback(), this._$Do?.setConnected(false);
    }
    render() {
      return E;
    }
  }
  i._$litElement$ = true, i["finalized"] = true, s.litElementHydrateSupport?.({ LitElement: i });
  const o = s.litElementPolyfillSupport;
  o?.({ LitElement: i });
  (s.litElementVersions ??= []).push("4.2.2");
  const names = { TJKC: "推荐课程", FANKC: "方案内课程", FAWKC: "方案外课程", TYKC: "体育项目", XGKC: "通选课" };
  class GrabLessonsApp extends i {
    static properties = { courses: { state: true }, settings: { state: true }, running: { state: true } };
    courses = [];
    settings;
    running = false;
    onStart;
    onStop;
    onRemove;
    onAdd;
    onReorder;
    onSettingsChange;
    #open = true;
    #modal = null;
    #selected = 0;
    #detail = null;
    #drag = -1;
    static styles = i$3`:host{font:14px system-ui;color:#182235}button,input{font:inherit}button{cursor:pointer;border:0;border-radius:8px;padding:8px}.launcher{position:fixed;right:22px;bottom:22px;z-index:9;background:#1d4ed8;color:white;border-radius:99px}.panel{position:fixed;right:22px;bottom:76px;z-index:9;width:390px;max-height:650px;overflow:auto;background:#fff;border-radius:16px;padding:18px;box-shadow:0 12px 38px #0005}header,.row{display:flex;justify-content:space-between;gap:8px;align-items:center}.primary{background:#1d4ed8;color:white}.danger{background:#dc2626;color:white}.entry{display:flex;gap:8px;margin:14px 0}.entry input{flex:1}.course{display:grid;grid-template-columns:auto 1fr auto;gap:8px;padding:10px 0;border-top:1px solid #e2e8f0;cursor:pointer}.course:hover,.course.selected{background:#eff6ff}.course:focus{outline:2px solid #1d4ed8}.muted{color:#64748b;font-size:12px}.handle{cursor:grab}.remove{color:#b91c1c}.modal{position:fixed;z-index:10;inset:0;background:#0007;display:grid;place-items:center}.dialog{width:min(560px,calc(100vw - 32px));max-height:80vh;overflow:auto;background:white;border-radius:14px;padding:20px}.dialog label{display:flex;gap:8px;align-items:center;margin:10px 0}.dialog input[type=number]{margin-left:auto;width:100px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.order{display:flex;gap:8px;align-items:center;padding:7px;border-top:1px solid #e2e8f0;cursor:grab}`;
    render() {
      return b`<button class="launcher" @click=${() => {
      this.#open = !this.#open;
      this.requestUpdate();
    }}>选课助手</button>${this.#open ? b`<section class="panel"><header><div><h2>选课助手</h2><span class="muted">测试版 · ${this.running ? "正在提交" : "准备就绪"}</span></div><button class=${this.running ? "danger" : "primary"} @click=${() => this.running ? this.onStop?.() : this.onStart?.()}>${this.running ? "停止" : "开始"}</button></header><div class="entry"><input id="codes" ?disabled=${this.running} placeholder="课程号 + 教学班序号，以空格分隔" @keydown=${(e2) => e2.key === "Enter" && this.#add()}><button ?disabled=${this.running} @click=${this.#add}>添加</button></div><button ?disabled=${this.running} @click=${() => this.#modal = "settings"}>设置</button>${this.courses.map((c2, i2) => b`<article class="course ${i2 === this.#selected ? "selected" : ""}" tabindex="0" draggable="true" @click=${() => {
      this.#selected = i2;
      this.requestUpdate();
    }} @keydown=${(e2) => this.#key(e2, i2)} @dragstart=${() => this.#drag = i2} @dragover=${(e2) => e2.preventDefault()} @drop=${() => this.#move(this.#drag, i2)}><span class="handle">⠿</span><div><strong>${c2.courseName}</strong><span class="muted">${c2.teacherName} · ${c2.key}</span></div><span><button @click=${(e2) => {
      e2.stopPropagation();
      this.#detail = c2;
      this.#modal = "detail";
    }}>详情</button><button class="remove" @click=${(e2) => {
      e2.stopPropagation();
      this.onRemove?.(c2.key);
    }}>删除</button></span></article>`)}</section>` : null}${this.#renderModal()}`;
    }
    #renderModal() {
      if (!this.#modal) return null;
      const close = () => this.#modal = null;
      const modal = (title, body) => b`<div class="modal" @click=${close}><section class="dialog" @click=${(e2) => e2.stopPropagation()}><header><h2>${title}</h2><button @click=${close}>关闭</button></header>${body}</section></div>`;
      if (this.#modal === "settings") return modal("选课设置", b`<label><input type="radio" name="cycle" .checked=${!this.settings.mode.isCyclic} @change=${() => this.#mode("isCyclic", false)}>单次</label><label><input type="radio" name="cycle" .checked=${this.settings.mode.isCyclic} @change=${() => this.#mode("isCyclic", true)}>循环</label><label><input type="radio" name="send" .checked=${!this.settings.mode.isAsync} @change=${() => this.#mode("isAsync", false)}>同步（等待响应）</label><label><input type="radio" name="send" .checked=${this.settings.mode.isAsync} @change=${() => this.#mode("isAsync", true)}>异步（按间隔继续发送）</label><label>每批课程数 <input type="number" min="1" max="3" .value=${String(this.settings.mode.batchSize)} @change=${this.#batch}></label><p class="muted">当前：${this.settings.mode.isAsync ? "异步" : "同步"} · 每批 ${this.settings.mode.batchSize} 门</p><button @click=${() => this.#modal = "interval"}>设置发送间隔…</button><button @click=${() => this.#modal = "search"}>搜索设置…</button>`);
      if (this.#modal === "interval") return modal("发送间隔（ms）", b`<div class="grid">${["sync", "async"].map((m2) => b`<div><strong>${m2 === "sync" ? "同步" : "异步"}</strong>${[1, 2, 3].map((n3) => b`<label>${n3} 门<input type="number" min="0" .value=${String(this.settings.interval[m2].byBatch[n3])} @change=${(e2) => this.#interval(m2, n3, e2)}></label>`)}</div>`)}</div>`);
      if (this.#modal === "search") return modal("搜索设置", b`<label><input type="checkbox" .checked=${this.settings.mode.enableSearch} @change=${(e2) => this.#mode("enableSearch", e2.target.checked)}>启用自动搜索</label><label>每页数量<input type="number" .value=${String(this.settings.search.pageSize)} @change=${(e2) => this.#search("pageSize", e2)}></label><label>翻页延迟（ms）<input type="number" .value=${String(this.settings.search.pageDelay)} @change=${(e2) => this.#search("pageDelay", e2)}></label>${this.settings.search.typeOrder.map((t2, i2) => b`<div class="order" draggable="true" @dragstart=${() => this.#drag = i2} @dragover=${(e2) => e2.preventDefault()} @drop=${() => this.#typeMove(this.#drag, i2)}>⠿ ${i2 + 1}. ${names[t2]}</div>`)}`);
      if (this.#modal === "detail" && this.#detail) {
        const c2 = this.#detail;
        return modal("课程详情", b`<p>课程信息：${c2.courseName}</p><p>开课单位/教师：${c2.department ?? "待定"} ${c2.teacherName}</p><p>授课地点：${c2.location ?? "待定"}</p><p>课程属性：${c2.courseNature ?? "待定"} ${c2.courseCategory ?? ""}</p><p>选课人数：${c2.selectedCount ?? "待定"}/${c2.totalCapacity ?? "待定"}</p>`);
      }
      return modal("特别提醒（转）", b`<p>请各位同学秉持诚信原则参与选课，严禁使用脚本、代码等任何手段干扰、破坏选课秩序；学校将对选课数据进行后台异常监测。</p><label><input type="checkbox" checked @change=${() => this.#announce()}>不再弹出</label><button class="primary" @click=${close}>我知道了</button>`);
    }
    firstUpdated() {
      if (!this.settings?.announcement.hasRead) this.#modal = "announcement";
    }
    #add() {
      const i2 = this.renderRoot.querySelector("#codes");
      if (i2?.value.trim()) {
        this.onAdd?.(i2.value);
        i2.value = "";
      }
    }
    #mode(k2, v2) {
      this.onSettingsChange?.({ ...this.settings, mode: { ...this.settings.mode, [k2]: v2 } });
    }
    #batch = (e2) => {
      const n3 = Math.max(1, Math.min(3, Number(e2.target.value) || 1));
      this.onSettingsChange?.({ ...this.settings, mode: { ...this.settings.mode, batchSize: n3, isGrouped: n3 > 1 } });
    };
    #interval(m2, n3, e2) {
      const v2 = Math.max(0, Number(e2.target.value) || 0), x2 = { ...this.settings.interval[m2], byBatch: { ...this.settings.interval[m2].byBatch, [n3]: v2 } };
      this.onSettingsChange?.({ ...this.settings, interval: { ...this.settings.interval, [m2]: x2 } });
    }
    #search(k2, e2) {
      this.onSettingsChange?.({ ...this.settings, search: { ...this.settings.search, [k2]: Number(e2.target.value) } });
    }
    #move(f2, t2) {
      if (f2 >= 0 && f2 !== t2) this.onReorder?.(f2, t2);
    }
    #key(e2, i2) {
      if (e2.key === "ArrowUp") {
        e2.preventDefault();
        this.#move(i2, i2 - 1);
      }
      if (e2.key === "ArrowDown") {
        e2.preventDefault();
        this.#move(i2, i2 + 1);
      }
    }
    #typeMove(f2, t2) {
      const a2 = [...this.settings.search.typeOrder];
      const [x2] = a2.splice(f2, 1);
      a2.splice(t2, 0, x2);
      this.onSettingsChange?.({ ...this.settings, search: { ...this.settings.search, typeOrder: a2 } });
    }
    #announce() {
      this.onSettingsChange?.({ ...this.settings, announcement: { hasRead: true } });
    }
  }
  customElements.define("seu-grab-lessons-app", GrabLessonsApp);
  const delay$1 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  class EnrollmentRunner {
    #controller = null;
    #inFlight = new Set();
    get running() {
      return this.#controller !== null;
    }
    async start(options) {
      if (this.running) await this.stop();
      const controller = new AbortController();
      this.#controller = controller;
      const interval = options.settings.interval[options.settings.mode.isAsync ? "async" : "sync"].byBatch[options.settings.mode.batchSize];
      try {
        do {
          const snapshot = options.getCourses();
          if (!snapshot.length) break;
          const size = options.settings.mode.batchSize;
          for (let offset = 0; offset < snapshot.length && !controller.signal.aborted; offset += size) {
            const group = snapshot.slice(offset, offset + size);
            const tasks = group.map((course2) => this.#submit(course2, options, controller.signal));
            if (options.settings.mode.isAsync) tasks.forEach((task) => void task);
            else await Promise.all(tasks);
            if (!controller.signal.aborted) await delay$1(interval);
          }
          if (options.settings.mode.isAsync) await Promise.allSettled([...this.#inFlight]);
        } while (options.settings.mode.isCyclic && !controller.signal.aborted && options.getCourses().length > 0);
      } finally {
        if (this.#controller === controller) this.#controller = null;
      }
    }
    async stop() {
      this.#controller?.abort();
      await Promise.allSettled([...this.#inFlight]);
      this.#controller = null;
    }
    #submit(course2, options, signal) {
      const task = (async () => {
        try {
          const result = await options.api.addCourse(course2, signal);
          options.notify(result.ok ? "success" : "warning", `${course2.teacherName} 的 ${course2.courseName}：${result.message}`);
          if (result.ok) options.remove(course2.key);
        } catch (error) {
          if (!signal.aborted) options.notify("error", `${course2.courseName} 请求失败：${error instanceof Error ? error.message : "未知错误"}`);
        }
      })();
      this.#inFlight.add(task);
      void task.finally(() => this.#inFlight.delete(task));
      return task;
    }
  }
  class SeuApi {
    async addCourse(course2, signal) {
      const submit = async (isConfirm = false) => {
        const body = new URLSearchParams({ clazzType: course2.courseType, clazzId: course2.classId, secretVal: course2.secretVal, ...isConfirm ? { isConfirm: "1" } : {} });
        const response = await fetch("/elective/clazz/add", { method: "POST", signal, headers: { batchId: course2.batchId, "content-type": "application/x-www-form-urlencoded" }, body });
        return response.json();
      };
      const first = await submit();
      if (first.code === 200) return { ok: true, message: "已添加到选课队列" };
      if (first.code === 301) {
        const confirmed = await submit(true);
        return { ok: confirmed.code === 200, message: confirmed.code === 200 ? "已确认并添加到选课队列" : confirmed.msg ?? "确认失败" };
      }
      return { ok: false, message: first.msg ?? "提交失败" };
    }
    async search(type, pageNumber, pageSize, campus, signal) {
      const response = await fetch("/elective/clazz/list", { method: "POST", signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ teachingClassType: type, pageNumber, pageSize, orderBy: "", campus }) });
      const payload = await response.json();
      if (payload.code !== 200 || !payload.data) throw new Error(payload.msg ?? "搜索课程失败");
      return { rows: payload.data.rows ?? [], total: payload.data.total ?? 0 };
    }
  }
  const defaultTypeOrder = ["TJKC", "FANKC", "FAWKC", "TYKC", "XGKC"];
  const defaultSettings = { schemaVersion: 2, token: "", savedCourseCodes: "", mode: { isAsync: false, isCyclic: true, isGrouped: false, batchSize: 1, enableSearch: true, cycleCount: -1 }, interval: { sync: { single: 300, group: 1e3, byBatch: { 1: 300, 2: 1e3, 3: 1e3 } }, async: { single: 350, group: 1e3, byBatch: { 1: 350, 2: 1e3, 3: 1e3 } } }, search: { pageSize: 20, pageDelay: 500, typeOrder: defaultTypeOrder }, announcement: { hasRead: false } };
  const isRecord = (v2) => typeof v2 === "object" && v2 !== null && !Array.isArray(v2);
  const num = (v2, d2) => typeof v2 === "number" && Number.isFinite(v2) ? v2 : d2;
  const clone = () => structuredClone(defaultSettings);
  function course(key, v2) {
    if (!isRecord(v2) || typeof v2.classID !== "string" || typeof v2.courseBatch !== "string" || typeof v2.courseType !== "string" || typeof v2.secretVal !== "string") return null;
    return { key, batchId: v2.courseBatch, classId: v2.classID, courseType: v2.courseType, secretVal: v2.secretVal, courseName: String(v2.courseName ?? key), teacherName: String(v2.teacherName ?? "待定"), department: typeof v2.department === "string" ? v2.department : void 0, location: typeof v2.location === "string" ? v2.location : void 0, courseNature: typeof v2.courseNature === "string" ? v2.courseNature : void 0, courseCategory: typeof v2.courseCategory === "string" ? v2.courseCategory : void 0, selectedCount: num(v2.selectedCount, 0), totalCapacity: num(v2.totalCapacity, 0) };
  }
  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem("july") ?? "null");
      if (!isRecord(raw)) return { settings: clone(), courses: {}, courseOrder: [] };
      const old = isRecord(raw.settings) ? raw.settings : {}, mode = isRecord(old.mode) ? old.mode : {}, search = isRecord(old.search) ? old.search : {}, ints = isRecord(old.interval) ? old.interval : {};
      const batch = [1, 2, 3].includes(mode.batchSize) ? mode.batchSize : mode.isGrouped ? 3 : 1;
      const getInt = (name) => {
        const x2 = isRecord(ints[name]) ? ints[name] : {}, base = clone().interval[name], b2 = isRecord(x2.byBatch) ? x2.byBatch : {};
        const single = num(x2.single, base.single), group = num(x2.group, base.group);
        return { single, group, byBatch: { 1: num(b2[1], single), 2: num(b2[2], group), 3: num(b2[3], group) } };
      };
      const order = Array.isArray(search.typeOrder) && search.typeOrder.length === 5 ? search.typeOrder : defaultTypeOrder;
      const settings = { schemaVersion: 2, token: typeof old.token === "string" ? old.token : "", savedCourseCodes: typeof old.savedCourseCodes === "string" ? old.savedCourseCodes : "", mode: { ...clone().mode, ...mode, batchSize: batch, isGrouped: batch > 1 }, interval: { sync: getInt("sync"), async: getInt("async") }, search: { pageSize: num(search.pageSize, 20), pageDelay: num(search.pageDelay, 500), typeOrder: order }, announcement: { hasRead: Boolean(isRecord(old.announcement) && old.announcement.hasRead) } };
      const source = isRecord(raw.enrollDict) ? raw.enrollDict : {};
      const courses = Object.fromEntries(Object.entries(source).flatMap(([k2, v2]) => {
        const c2 = course(k2, v2);
        return c2 ? [[k2, c2]] : [];
      }));
      const saved = Array.isArray(raw.courseOrder) ? raw.courseOrder.filter((x2) => typeof x2 === "string" && x2 in courses) : [];
      return { settings, courses, courseOrder: [...saved, ...Object.keys(courses).filter((k2) => !saved.includes(k2))] };
    } catch {
      return { settings: clone(), courses: {}, courseOrder: [] };
    }
  }
  function saveState(state) {
    const enrollDict = Object.fromEntries(Object.entries(state.courses).map(([k2, c2]) => [k2, { courseBatch: c2.batchId, classID: c2.classId, courseType: c2.courseType, secretVal: c2.secretVal, courseName: c2.courseName, teacherName: c2.teacherName, department: c2.department, location: c2.location, courseNature: c2.courseNature, courseCategory: c2.courseCategory, selectedCount: c2.selectedCount, totalCapacity: c2.totalCapacity }]));
    const s2 = state.settings;
    localStorage.setItem("july", JSON.stringify({ enrollDict, courseOrder: state.courseOrder, settings: { ...s2, mode: { ...s2.mode, isGrouped: s2.mode.batchSize > 1 }, interval: { sync: { ...s2.interval.sync, single: s2.interval.sync.byBatch[1], group: s2.interval.sync.byBatch[3] }, async: { ...s2.interval.async, single: s2.interval.async.byBatch[1], group: s2.interval.async.byBatch[3] } } } }));
  }
  function installCourseAddButtons(onAdd) {
    const scan = () => {
      for (const cell of document.querySelectorAll("td.el-table__expanded-cell")) {
        const row = cell.parentElement?.previousElementSibling;
        const courseCode = row?.querySelector("td span")?.textContent?.trim();
        if (!courseCode) continue;
        for (const select of cell.querySelectorAll("button.el-button--primary.el-button--mini.is-round")) {
          if (!select.textContent?.includes("选择") || select.parentElement?.querySelector(".seu-grab-add")) continue;
          const button = document.createElement("button");
          button.type = "button";
          button.className = "el-button el-button--primary el-button--mini is-round seu-grab-add";
          button.textContent = "添加";
          button.addEventListener("click", () => {
            const sequence = select.closest(".el-card__body")?.querySelector(".one-row span")?.textContent?.replace(/[\[\]\s]/g, "");
            if (sequence) onAdd(`${courseCode}${sequence}`);
          });
          select.parentElement?.append(button);
        }
      }
    };
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", () => setTimeout(scan, 80));
    scan();
  }
  function selectionFrom(code, courses, type, batchId) {
    const normalized = code.trim().toUpperCase();
    if (normalized.length <= 8) return null;
    const courseCode = normalized.slice(0, 8);
    const sequence = normalized.slice(8);
    const course2 = courses.find((item) => item.KCH === courseCode);
    if (!course2) return null;
    if (type === "XGKC" && course2.KXH !== sequence) return null;
    const teacher = type === "XGKC" ? course2 : course2.tcList?.find((item) => item.KXH === sequence);
    if (!teacher || !("JXBID" in teacher) || !teacher.JXBID || !("secretVal" in teacher) || !teacher.secretVal) return null;
    return { key: normalized, batchId, classId: teacher.JXBID, courseType: type, secretVal: teacher.secretVal, courseName: course2.KCM, teacherName: teacher.SKJS || "待定", department: teacher.KKDW, location: teacher.YPSJDD, courseNature: teacher.KCXZ, courseCategory: teacher.KCLB, selectedCount: teacher.numberOfSelected, totalCapacity: teacher.classCapacity };
  }
  const delay = (ms) => new Promise((r2) => setTimeout(r2, ms));
  const codes = (x2) => x2.split(/\s+/).map((v2) => v2.trim().toUpperCase()).filter((v2) => v2.length > 8);
  const notify = (p2, t2, m2) => p2.$message({ type: t2, message: m2, duration: 1800 });
  async function page() {
    for (let i2 = 0; i2 < 100; i2++) {
      if (window.grablessonsVue && document.querySelector("#xsxkapp")) return window.grablessonsVue;
      await delay(100);
    }
    throw Error("选课页面未能在 10 秒内完成初始化");
  }
  async function main() {
    const p2 = await page(), state = loadState(), api = new SeuApi(), runner = new EnrollmentRunner(), now = sessionStorage.getItem("token") ?? "", app = document.createElement("seu-grab-lessons-app");
    (document.querySelector("#xsxkapp") ?? document.body).append(app);
    const persist = () => saveState(state);
    const list = () => state.courseOrder.map((k2) => state.courses[k2]).filter((c2) => Boolean(c2) && c2.batchId === p2.lcParam.currentBatch.code);
    const render = () => {
      app.courses = list();
      app.settings = state.settings;
      app.running = runner.running;
      app.requestUpdate();
    };
    const put = (c2) => {
      if (!state.courses[c2.key]) state.courseOrder.push(c2.key);
      state.courses[c2.key] = c2;
    };
    const search = async (input) => {
      const left = new Set(codes(input));
      if (!state.settings.mode.enableSearch) return [...left];
      for (const type of state.settings.search.typeOrder) for (let n3 = 1; left.size; n3++) {
        try {
          await delay(state.settings.search.pageDelay);
          const r2 = await api.search(type, n3, state.settings.search.pageSize, p2.currentCampus.code, new AbortController().signal);
          for (const code of [...left]) {
            const c2 = selectionFrom(code, r2.rows, type, p2.lcParam.currentBatch.code);
            if (c2) {
              put(c2);
              left.delete(code);
            }
          }
          notify(p2, "success", `已搜索 ${type} 第 ${n3} 页，剩余 ${left.size} 门`);
          if (!r2.rows.length || n3 * state.settings.search.pageSize >= r2.total) break;
        } catch (e2) {
          notify(p2, "warning", `搜索 ${type} 失败`);
          break;
        }
      }
      return [...left];
    };
    if (state.settings.token !== now && Object.keys(state.courses).length) {
      const pending = [...state.courseOrder, ...codes(state.settings.savedCourseCodes)].filter((x2, i2, a2) => a2.indexOf(x2) === i2);
      state.courses = {};
      state.courseOrder = [];
      notify(p2, "warning", "登录状态变化，正在重新获取课程凭据");
      state.settings.savedCourseCodes = (await search(pending.join(" "))).join(" ");
    }
    state.settings.token = now;
    persist();
    app.onAdd = (input) => {
      void (async () => {
        const failed = [];
        for (const code of codes(input)) {
          const c2 = selectionFrom(code, p2.courseList, p2.teachingClassType, p2.lcParam.currentBatch.code);
          if (c2) put(c2);
          else failed.push(code);
        }
        state.settings.savedCourseCodes = (await search(failed.join(" "))).join(" ");
        persist();
        render();
      })();
    };
    app.onRemove = (k2) => {
      delete state.courses[k2];
      state.courseOrder = state.courseOrder.filter((x2) => x2 !== k2);
      persist();
      render();
    };
    app.onReorder = (from, to) => {
      const [x2] = state.courseOrder.splice(from, 1);
      state.courseOrder.splice(to, 0, x2);
      persist();
      render();
    };
    app.onSettingsChange = (s2) => {
      state.settings = s2;
      persist();
      render();
    };
    app.onStart = () => {
      void runner.start({ api, settings: state.settings, getCourses: list, remove: (k2) => app.onRemove?.(k2), notify: (t2, m2) => notify(p2, t2, m2) }).finally(render);
      render();
    };
    app.onStop = () => {
      void runner.stop().finally(render);
      render();
    };
    installCourseAddButtons((code) => app.onAdd?.(code));
    render();
  }
  void main().catch((e2) => console.error("[grab-lessons-for-seu]", e2));

})();