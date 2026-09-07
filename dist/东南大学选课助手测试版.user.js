// ==UserScript==
// @name         东南大学选课助手（测试版）
// @namespace    https://github.com/julymiaw/grab-lessons-for-seu
// @version      4.0.0
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
  class GrabLessonsApp extends i {
    static properties = { courses: { state: true }, settings: { state: true }, running: { state: true } };
    courses = [];
    settings;
    running = false;
    onStart;
    onStop;
    onRemove;
    onAdd;
    onSettingsChange;
    static styles = i$3`
    :host { color: #182235; font: 14px/1.45 system-ui, -apple-system, sans-serif; }
    button,input { font: inherit; } .launcher { position: fixed; right: 22px; bottom: 22px; z-index: 2147483646; border: 0; border-radius: 999px; background: #1d4ed8; color: white; padding: 12px 16px; box-shadow: 0 8px 24px #0004; cursor: pointer; }
    .panel { position: fixed; right: 22px; bottom: 76px; z-index: 2147483646; width: min(390px, calc(100vw - 32px)); max-height: min(650px, calc(100vh - 104px)); overflow: auto; box-sizing: border-box; border-radius: 16px; background: #fff; box-shadow: 0 16px 48px #0004; padding: 18px; }
    header { display:flex; justify-content:space-between; align-items:center; gap:8px; } h2 { margin:0; font-size:18px; } .muted { color:#64748b; font-size:12px; } .entry { display:flex; gap:8px; margin:16px 0; } input { min-width:0; flex:1; border:1px solid #cbd5e1; border-radius:8px; padding:8px 10px; } button { border:0; border-radius:8px; padding:8px 10px; cursor:pointer; } .primary { background:#1d4ed8; color:white; } .danger { background:#dc2626; color:white; } .course { display:grid; grid-template-columns:1fr auto; gap:8px; border-top:1px solid #e2e8f0; padding:10px 0; } .course strong,.course span { display:block; } .course span { color:#64748b; font-size:12px; } .remove { color:#b91c1c; background:#fee2e2; align-self:center; } .empty { text-align:center; color:#64748b; padding:20px; }
  `;
    #open = true;
    render() {
      return b`
      <button class="launcher" @click=${() => {
      this.#open = !this.#open;
      this.requestUpdate();
    }} aria-label="打开抢课助手">选课助手</button>
      ${this.#open ? b`<section class="panel" aria-label="抢课助手">
        <header><div><h2>选课助手</h2><div class="muted">v4 · ${this.running ? "正在提交" : "准备就绪"}</div></div><button class=${this.running ? "danger" : "primary"} @click=${() => this.running ? this.onStop?.() : this.onStart?.()}>${this.running ? "停止" : "开始"}</button></header>
        <div class="entry"><input id="codes" ?disabled=${this.running} placeholder="课程号 + 教学班序号，以空格分隔" @keydown=${(event) => event.key === "Enter" && this.#add()}><button ?disabled=${this.running} @click=${this.#add}>添加</button></div>
        <details><summary class="muted">${this.settings?.mode.isCyclic ? "循环" : "单次"} · ${this.settings?.mode.isAsync ? "异步" : "同步"} · ${this.settings?.mode.isGrouped ? "每组 3 门" : "逐门"} · 设置</summary>
          <div class="settings">
            ${this.#toggle("循环提交", "isCyclic")} ${this.#toggle("异步发送", "isAsync")} ${this.#toggle("每组 3 门", "isGrouped")} ${this.#toggle("自动搜索", "enableSearch")}
            <label>发送间隔（ms）<input type="number" min="100" max="5000" .value=${String(this.#interval())} @change=${this.#setInterval}></label>
            <label>搜索页大小<input type="number" min="10" max="100" step="10" .value=${String(this.settings?.search.pageSize ?? 20)} @change=${this.#setPageSize}></label>
            <label>搜索翻页延迟（ms）<input type="number" min="100" max="5000" step="100" .value=${String(this.settings?.search.pageDelay ?? 500)} @change=${this.#setPageDelay}></label>
          </div>
        </details>
        ${this.courses.length ? this.courses.map((course) => b`<article class="course"><div><strong>${course.courseName}</strong><span>${course.teacherName} · ${course.key}</span></div><button class="remove" ?disabled=${this.running} @click=${() => this.onRemove?.(course.key)}>删除</button></article>`) : b`<div class="empty">还没有待提交课程</div>`}
      </section>` : null}`;
    }
    #add() {
      const input = this.renderRoot.querySelector("#codes");
      if (!input?.value.trim()) return;
      this.onAdd?.(input.value);
      input.value = "";
    }
    #toggle(label, key2) {
      return b`<label><input type="checkbox" .checked=${Boolean(this.settings?.mode[key2])} @change=${(event) => this.#setMode(key2, event.target.checked)}>${label}</label>`;
    }
    #setMode(key2, value) {
      this.onSettingsChange?.({ ...this.settings, mode: { ...this.settings.mode, [key2]: value } });
    }
    #interval() {
      const mode = this.settings?.mode.isAsync ? "async" : "sync";
      const type = this.settings?.mode.isGrouped ? "group" : "single";
      return this.settings?.interval[mode][type] ?? 300;
    }
    #setInterval = (event) => {
      const value = Number(event.target.value);
      if (!Number.isFinite(value)) return;
      const mode = this.settings.mode.isAsync ? "async" : "sync";
      const type = this.settings.mode.isGrouped ? "group" : "single";
      this.onSettingsChange?.({ ...this.settings, interval: { ...this.settings.interval, [mode]: { ...this.settings.interval[mode], [type]: value } } });
    };
    #setPageSize = (event) => this.onSettingsChange?.({ ...this.settings, search: { ...this.settings.search, pageSize: Number(event.target.value) } });
    #setPageDelay = (event) => this.onSettingsChange?.({ ...this.settings, search: { ...this.settings.search, pageDelay: Number(event.target.value) } });
  }
  customElements.define("seu-grab-lessons-app", GrabLessonsApp);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
      const interval = options.settings.interval[options.settings.mode.isAsync ? "async" : "sync"][options.settings.mode.isGrouped ? "group" : "single"];
      try {
        do {
          const snapshot = options.getCourses();
          if (!snapshot.length) break;
          const size = options.settings.mode.isGrouped ? 3 : 1;
          for (let offset = 0; offset < snapshot.length && !controller.signal.aborted; offset += size) {
            const group = snapshot.slice(offset, offset + size);
            const tasks = group.map((course) => this.#submit(course, options, controller.signal));
            if (options.settings.mode.isAsync) tasks.forEach((task) => void task);
            else await Promise.all(tasks);
            if (!controller.signal.aborted) await delay(interval);
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
    #submit(course, options, signal) {
      const task = (async () => {
        try {
          const result = await options.api.addCourse(course, signal);
          options.notify(result.ok ? "success" : "warning", `${course.teacherName} 的 ${course.courseName}：${result.message}`);
          if (result.ok) options.remove(course.key);
        } catch (error) {
          if (!signal.aborted) options.notify("error", `${course.courseName} 请求失败：${error instanceof Error ? error.message : "未知错误"}`);
        }
      })();
      this.#inFlight.add(task);
      void task.finally(() => this.#inFlight.delete(task));
      return task;
    }
  }
  class SeuApi {
    async addCourse(course, signal) {
      const submit = async (isConfirm = false) => {
        const body = new URLSearchParams({ clazzType: course.courseType, clazzId: course.classId, secretVal: course.secretVal, ...isConfirm ? { isConfirm: "1" } : {} });
        const response = await fetch("/elective/clazz/add", { method: "POST", signal, headers: { batchId: course.batchId, "content-type": "application/x-www-form-urlencoded" }, body });
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
  const defaultSettings = {
    schemaVersion: 1,
    mode: { isAsync: false, isCyclic: true, isGrouped: false, enableSearch: true },
    interval: { sync: { single: 300, group: 1e3 }, async: { single: 350, group: 1e3 } },
    search: { pageSize: 20, pageDelay: 500 },
    announcement: { hasRead: false }
  };
  const key = "grab-lessons-for-seu:v4";
  const cloneDefaults = () => structuredClone(defaultSettings);
  function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(key) ?? localStorage.getItem("july") ?? "null");
      if (!isRecord(raw)) return { settings: cloneDefaults(), courses: {} };
      const settings = isRecord(raw.settings) ? raw.settings : {};
      const oldCourses = isRecord(raw.enrollDict) ? raw.enrollDict : {};
      const courses = isRecord(raw.courses) ? raw.courses : Object.fromEntries(Object.entries(oldCourses).flatMap(([courseKey, value]) => {
        if (!isRecord(value) || typeof value.classID !== "string" || typeof value.courseBatch !== "string" || typeof value.courseType !== "string" || typeof value.secretVal !== "string") return [];
        return [[courseKey, { key: courseKey, batchId: value.courseBatch, classId: value.classID, courseType: value.courseType, secretVal: value.secretVal, courseName: String(value.courseName ?? courseKey), teacherName: String(value.teacherName ?? "待定"), department: typeof value.department === "string" ? value.department : void 0, location: typeof value.location === "string" ? value.location : void 0 }]];
      }));
      return {
        settings: {
          ...cloneDefaults(),
          schemaVersion: 1,
          mode: { ...cloneDefaults().mode, ...isRecord(settings.mode) ? settings.mode : {} },
          interval: { ...cloneDefaults().interval, ...isRecord(settings.interval) ? settings.interval : {} },
          search: { ...cloneDefaults().search, ...isRecord(settings.search) ? settings.search : {} },
          announcement: { ...cloneDefaults().announcement, ...isRecord(settings.announcement) ? settings.announcement : {} }
        },
        courses
      };
    } catch {
      return { settings: cloneDefaults(), courses: {} };
    }
  }
  function saveState(state) {
    localStorage.setItem(key, JSON.stringify(state));
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
    const course = courses.find((item) => item.KCH === courseCode);
    if (!course) return null;
    if (type === "XGKC" && course.KXH !== sequence) return null;
    const teacher = type === "XGKC" ? course : course.tcList?.find((item) => item.KXH === sequence);
    if (!teacher || !("JXBID" in teacher) || !teacher.JXBID || !("secretVal" in teacher) || !teacher.secretVal) return null;
    return { key: normalized, batchId, classId: teacher.JXBID, courseType: type, secretVal: teacher.secretVal, courseName: course.KCM, teacherName: teacher.SKJS || "待定", department: teacher.KKDW, location: teacher.YPSJDD, selectedCount: teacher.numberOfSelected, totalCapacity: teacher.classCapacity };
  }
  const waitForPage = async () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const page = window.grablessonsVue;
      if (page && document.querySelector("#xsxkapp")) return page;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("选课页面未能在 10 秒内完成初始化");
  };
  const notify = (page, type, message) => page.$message({ type, message, duration: 1800 });
  async function main() {
    const page = await waitForPage();
    const state = loadState();
    const api = new SeuApi();
    const runner = new EnrollmentRunner();
    const app = document.createElement("seu-grab-lessons-app");
    const root = document.querySelector("#xsxkapp") ?? document.body;
    root.append(app);
    const render = () => {
      app.courses = Object.values(state.courses).filter((course) => course.batchId === page.lcParam.currentBatch.code);
      app.settings = state.settings;
      app.running = runner.running;
      app.requestUpdate();
    };
    const persist = () => saveState(state);
    app.onRemove = (key2) => {
      delete state.courses[key2];
      persist();
      render();
    };
    app.onSettingsChange = (settings) => {
      state.settings = settings;
      persist();
      render();
    };
    const addCodes = async (input) => {
      if (runner.running) {
        notify(page, "warning", "抢课进行中，暂不能修改课程列表");
        return;
      }
      const failed = [];
      for (const code of input.split(/\s+/)) {
        const selection = selectionFrom(code, page.courseList, page.teachingClassType, page.lcParam.currentBatch.code);
        if (selection) state.courses[selection.key] = selection;
        else failed.push(code);
      }
      if (failed.length && state.settings.mode.enableSearch) {
        const remaining = new Set(failed);
        const controller = new AbortController();
        const types = ["TJKC", "FANKC", "FAWKC", "TYKC", "XGKC"];
        for (const type of types) {
          for (let pageNumber = 1; remaining.size; pageNumber += 1) {
            try {
              await new Promise((resolve) => setTimeout(resolve, state.settings.search.pageDelay));
              const result = await api.search(type, pageNumber, state.settings.search.pageSize, page.currentCampus.code, controller.signal);
              for (const code of [...remaining]) {
                const selection = selectionFrom(code, result.rows, type, page.lcParam.currentBatch.code);
                if (selection) {
                  state.courses[selection.key] = selection;
                  remaining.delete(code);
                }
              }
              notify(page, "success", `已搜索 ${type} 第 ${pageNumber} 页，剩余 ${remaining.size} 门`);
              if (!result.rows.length || pageNumber * state.settings.search.pageSize >= result.total) break;
            } catch (error) {
              notify(page, "warning", `搜索 ${type} 失败：${error instanceof Error ? error.message : "未知错误"}`);
              break;
            }
          }
        }
        failed.splice(0, failed.length, ...remaining);
      }
      persist();
      render();
      notify(page, failed.length ? "warning" : "success", failed.length ? `未找到：${failed.join(" ")}` : "课程已加入列表");
    };
    app.onAdd = (input) => {
      void addCodes(input);
    };
    installCourseAddButtons((code) => {
      void addCodes(code);
    });
    app.onStart = () => {
      void runner.start({ api, settings: state.settings, getCourses: () => Object.values(state.courses).filter((course) => course.batchId === page.lcParam.currentBatch.code), remove: (key2) => {
        delete state.courses[key2];
        persist();
        render();
      }, notify: (type, message) => notify(page, type, message) }).finally(render);
      render();
    };
    app.onStop = () => {
      void runner.stop().finally(render);
      render();
    };
    render();
  }
  void main().catch((error) => console.error("[grab-lessons-for-seu]", error));

})();