window._paq.push([function() {
  window.piwik_visitor_id = this.getVisitorId();
}]);

(function (n, s) {
  var c = {
    endpoint: "https://api.sitelytics.tech/pixel/core/api/send-event", pixelId: "e66bb188-742b-4b12-afab-c090e4550d66", organizationId: "91371b52-2166-4404-8591-98233e965661", _initialized: false, _autoInit: true, eventParams: {}, globalParams: {}, getScriptAttributes: function () {
      const t = s.querySelector('script[id="delivr-ai"]');
      return t ? { autoInit: t.getAttribute("data-auto-init") } : null;
    }, configure: function (t = {}) {
      const e = this.getScriptAttributes();
      return e && e.autoInit !== null && (this._autoInit = e.autoInit !== "false"), t.eventParams && (this.eventParams = t.eventParams), t.globalParams && (this.globalParams = { ...this.globalParams, ...t.globalParams }), this._autoInit && this.init(), this;
    }, init: function () {
      return this._initialized ? (console.warn("PixelSDK is already initialized"), this) : (this.trackPageView(), this.trackAllClicks(), this.trackAllFormSubmissions(), this.trackDeepScroll(), this.trackFileDownloads(), this.trackExitIntent(), this.trackIdleUser(), this.trackCopy(), this.trackVideoEngagement(), this._initialized = true, this);
    }, trackPageView: function () {
      var t = { event_type: "page_view", event_data: { url: n.location.href, referrer: s.referrer || null, title: s.title, timestamp: (new Date).toISOString() } };
      this.sendData(t);
    }, trackAllClicks: function () {
      var t = this;
      s.addEventListener("click", function (e) {
        var r = e.target;
        if (!(r.tagName.toLowerCase() === "body" || r.tagName.toLowerCase() === "html")) {
          var a = { event_type: "click", event_data: { url: n.location.href, element: t.getElementInfo(r), timestamp: (new Date).toISOString() } };
          t.sendData(a);
        }
      });
    }, trackAllFormSubmissions: function () {
      var t = this;
      s.addEventListener("submit", function (e) {
        var r = e.target, a = new FormData(r), i = {}, o = ["password", "creditcard", "ssn"];
        a.forEach(function (d, l) {
          o.includes(l.toLowerCase()) ? i[l] = "*****" : i[l] = d;
        });
        var u = { event_type: "form_submission", event_data: { formId: r.id || null, formData: i, url: n.location.href, timestamp: (new Date).toISOString() } };
        t.sendData(u);
      });
    }, trackDeepScroll: function () {
      var t = this, e = false;
      n.addEventListener("scroll", function () {
        if (!e) {
          var r = s.documentElement.scrollHeight - n.innerHeight, a = n.scrollY || n.pageYOffset, i = a / r * 100;
          if (i > 50) {
            e = true;
            var o = { event_type: "scroll_depth", event_data: { percentage: Math.round(i), url: n.location.href, timestamp: (new Date).toISOString() } };
            t.sendData(o);
          }
        }
      });
    }, trackFileDownloads: function (t = ["pdf", "jpg", "png", "zip"]) {
      var e = this;
      s.addEventListener("click", function (r) {
        var a = r.target.closest("a");
        if (a) {
          var i = a.href || "", o = i.split(".").pop();
          t.includes(o) && e.sendData({ event_type: "file_download", event_data: { url: i, timestamp: (new Date).toISOString() } });
        }
      });
    }, trackExitIntent: function () {
      var t = this;
      s.addEventListener("mouseleave", function (e) {
        e.clientY < 0 && t.sendData({ event_type: "exit_intent", event_data: { url: n.location.href, timestamp: (new Date).toISOString() } });
      });
    }, trackIdleUser: function (t = 3e4) {
      var e = this, r;
      function a() {
        clearTimeout(r), r = setTimeout(function () {
          e.sendData({ event_type: "user_idle", event_data: { url: n.location.href, timestamp: (new Date).toISOString() } });
        }, t);
      }
      n.addEventListener("mousemove", a), n.addEventListener("keypress", a), a();
    }, trackCopy: function () {
      var t = this;
      s.addEventListener("copy", function () {
        var e = s.getSelection().toString();
        t.sendData({ event_type: "copy", event_data: { text: e, url: n.location.href, timestamp: (new Date).toISOString() } });
      });
    }, trackVideoEngagement: function (t) {
      var e = this, r = s.querySelector(t || "video");
      r && (r.addEventListener("play", function () {
        e.sendData({ event_type: "video_play", event_data: { url: n.location.href, timestamp: (new Date).toISOString() } });
      }), r.addEventListener("pause", function () {
        e.sendData({ event_type: "video_pause", event_data: { url: n.location.href, timestamp: (new Date).toISOString() } });
      }), r.addEventListener("ended", function () {
        e.sendData({ event_type: "video_complete", event_data: { url: n.location.href, timestamp: (new Date).toISOString() } });
      }));
    }, getElementInfo: function (t) {
      return { tag: t.tagName, id: t.id || null, classes: t.className || null, text: t.innerText || null, attributes: this.getElementAttributes(t) };
    }, getElementAttributes: function (t) {
      for (var e = {}, r = 0; r < t.attributes.length; r++) {
        var a = t.attributes[r];
        e[a.name] = a.value;
      }
      return e;
    }, sendData: function (t) {
      let e = { ...this.globalParams };
      this.eventParams && t.event_type && this.eventParams[t.event_type] && (e = { ...e, ...this.eventParams[t.event_type] });

      if (typeof window.piwik_visitor_id !== 'undefined') {
        visitor_id = window.piwik_visitor_id;
        t.event_data.url = t.event_data.url + '&piwik_visitor_id=' + visitor_id

        window._paq.push(["setCustomVariable", 5, "vId", visitor_id, "visit"]);
        window._paq.push(['trackEvent', 'visitor_id', 'loaded']);
      } else {
        visitor_id = '';
      }
      
      // console.log('vId2', visitor_id);
      // console.log(t.event_data.url);

      const r = { ...t.event_data };
      Object.keys(e).length > 0 && (r.static_params = e), fetch(this.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, event_data: r, pixel_id: this.pixelId, organization_id: this.organizationId }), credentials: "include" }).then(function (a) {
        if (!a.ok) throw new Error("HTTP error: " + a.status);
        return a.text();
      }).then(function (a) {
        if (!a) return {};
        try {
          return JSON.parse(a);
        } catch {
          return console.error("Error parsing JSON. Server returned:", a), {};
        }
      }).then(function (a) {
        var i = [];
        return a.redirect_to && i.push(fetch(a.redirect_to, { method: "GET", mode: "no-cors", credentials: "include" })), a.second_redirect_to && i.push(fetch(a.second_redirect_to, { method: "GET", mode: "no-cors", credentials: "include" })), a.third_redirect_to && i.push(fetch(a.third_redirect_to, { method: "GET", mode: "no-cors", credentials: "include" })), Promise.all(i);
      }).catch(function (a) {
        console.error("Error during data sending or redirect:", a);
      });
    }, addParamsForEvents: function (t, e) {
      return this.setEventParams(t, e, { overwrite: false });
    }, setGlobalParams: function (t) {
      return this.globalParams = { ...this.globalParams, ...t }, this;
    }, setEventParams: function (t, e, r = {}) {
      const { overwrite: a = false } = r;
      return typeof t == "string" && (t = [t]), Array.isArray(t) ? (t.forEach(i => {
        this.eventParams[i] = a ? { ...e } : { ...this.eventParams[i] || {}, ...e };
      }), this) : (console.error("eventTypes should be a string or an array of strings."), this);
    }
  };
  n.PixelSDK = c, c.configure();
}(window, document));

