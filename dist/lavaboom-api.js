(function() {
  var ajax, encodeQueryData, parseResponseHeaders;

  ajax = function() {
    var i, versions, xhr;
    if (typeof XMLHttpRequest !== "undefined") {
      return new XMLHttpRequest();
    }
    versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"];
    xhr = void 0;
    i = 0;
    while (i < versions.length) {
      try {
        xhr = new ActiveXObject(versions[i]);
        break;
      } catch (_error) {}
      i++;
    }
    return xhr;
  };

  parseResponseHeaders = function(headerStr) {
    var headerPair, headerPairs, headers, i, index, key, val;
    headers = {};
    if (!headerStr) {
      return headers;
    }
    headerPairs = headerStr.split("\r\n");
    i = 0;
    while (i < headerPairs.length) {
      headerPair = headerPairs[i];
      index = headerPair.indexOf(": ");
      if (index > 0) {
        key = headerPair.substring(0, index);
        val = headerPair.substring(index + 2);
        headers[key] = val;
      }
      i++;
    }
    return headers;
  };

  encodeQueryData = function(data) {
    var k, ret, v;
    ret = [];
    for (k in data) {
      v = data[k];
      ret.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
    return ret.join("&");
  };

  this.Lavaboom = (function() {
    function Lavaboom(url, token) {
      var that;
      if (!url) {
        url = "https://api.lavaboom.com";
      }
      this.url = url;
      this.token = token;
      if (typeof SockJS !== 'undefined') {
        this.sockjs = new SockJS(url + "/ws");
        this.counter = 0;
        this.handlers = {};
        this.queuedMessages = [];
        this.connected = false;
        that = this;
        this.sockjs.onopen = function(e) {
          that.connected = true;
          if (that.queuedMessages.length > 0) {
            return _.forEach(that.queuedMessages, function(msg) {
              return that.sockjs.send(msg);
            });
          }
        };
        this.sockjs.onmessage = function(e) {
          var callback, msg, _i, _j, _len, _len1, _ref, _ref1, _results, _results1;
          msg = JSON.parse(e.data);
          switch (msg.type) {
            case "response":
              if (that.handlers[msg.id]) {
                return that.handlers[msg.id](msg);
              }
              break;
            case "delivery":
              if (that.subscriptions && that.subscriptions["delivery"]) {
                _ref = that.subscriptions["delivery"];
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  callback = _ref[_i];
                  _results.push(callback(msg));
                }
                return _results;
              }
              break;
            case "receipt":
              if (that.subscriptions && that.subscriptions["receipt"]) {
                _ref1 = that.subscriptions["receipt"];
                _results1 = [];
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                  callback = _ref1[_j];
                  _results1.push(callback(msg));
                }
                return _results1;
              }
          }
        };
      }
      this.accounts.that = this;
      this.accounts.create.that = this;
      this.contacts.that = this;
      this.emails.that = this;
      this.keys.that = this;
      this.labels.that = this;
      this.tokens.that = this;
    }

    Lavaboom.prototype._sockReq = function(method, path, data, options) {
      var msg, promise;
      this.counter++;
      promise = {
        onSuccess: [],
        onFailure: [],
        then: function(callback) {
          this.onSuccess.push(callback);
          return this;
        },
        "catch": function(callback) {
          this.onFailure.push(callback);
          return this;
        }
      };
      this.handlers[this.counter.toString()] = function(data) {
        if (data.status >= 200 && data.status < 300) {
          return _.forEach(promise.onSuccess, function(val) {
            data.body = JSON.parse(data.body);
            return val(data);
          });
        } else {
          return _.forEach(promise.onFailure, function(val) {
            data.body = JSON.parse(data.body);
            return val(data);
          });
        }
      };
      if (!options) {
        options = {};
      }
      if (!options.headers) {
        options.headers = {};
      }
      if (method.toUpperCase() === "POST" || method.toUpperCase() === "PUT") {
        options.headers["Content-Type"] = "application/json;charset=utf-8";
      }
      msg = JSON.stringify({
        id: this.counter.toString(),
        type: "request",
        method: method,
        path: path,
        body: JSON.stringify(data),
        headers: options.headers
      });
      if (this.connected) {
        this.sockjs.send(msg);
      } else {
        this.queuedMessages.push(msg);
      }
      return promise;
    };

    Lavaboom.prototype.subscribe = function(name, callback) {
      if (!this.sockjs) {
        console.error("Not using SockJS");
        return false;
      }
      if (!this.authToken) {
        console.error("Not authenticated");
        return false;
      }
      if (!this.subscriptions) {
        this.sockjs.send(JSON.stringify({
          "type": "susbcribe",
          "token": this.authToken
        }));
        this.subscriptions = {};
      }
      if (!this.subscriptions[name]) {
        this.subscriptions[name] = [];
      }
      return this.subscriptions[name].push(callback);
    };

    Lavaboom.prototype.unsubscribe = function(name, callback) {
      var cb, index, _i, _len, _ref;
      if (!this.sockjs) {
        console.error("Not using SockJS");
        return false;
      }
      if (!this.authToken) {
        console.error("Not authenticated");
        return false;
      }
      if (!this.subscriptions) {
        return false;
      }
      if (!this.subscriptions[name]) {
        return false;
      }
      _ref = this.subscriptions[name];
      for (cb = _i = 0, _len = _ref.length; _i < _len; cb = ++_i) {
        index = _ref[cb];
        if (cb === callback) {
          this.subscriptions[name].splice(index, 1);
          return true;
        }
      }
      return false;
    };

    Lavaboom.prototype.ajax = function(method, url, data, options) {
      var key, promise, x;
      promise = {
        onSuccess: [],
        onFailure: [],
        then: function(callback) {
          this.onSuccess.push(callback);
          return this;
        },
        "catch": function(callback) {
          this.onFailure.push(callback);
          return this;
        }
      };
      x = ajax();
      x.open(method, url, true);
      x.onreadystatechange = function() {
        var body, error;
        if (x.readyState !== 4) {
          return;
        }
        body = void 0;
        try {
          body = JSON.parse(x.responseText);
        } catch (_error) {
          error = _error;
          body = error;
        }
        if (x.status >= 200 && x.status < 300) {
          return _.forEach(promise.onSuccess, function(val) {
            return val({
              body: body,
              status: x.status,
              headers: parseResponseHeaders(x.getAllResponseHeaders())
            });
          });
        } else {
          return _.forEach(promise.onFailure, function(val) {
            return val({
              body: body,
              status: x.status,
              headers: parseResponseHeaders(x.getAllResponseHeaders())
            });
          });
        }
      };
      if (method === "POST" || method === "PUT") {
        x.setRequestHeader("Content-Type", "application/json;charset=utf-8");
      }
      for (key in options.headers) {
        x.setRequestHeader(key, options.headers[key]);
      }
      x.send(data);
      return promise;
    };

    Lavaboom.prototype.get = function(path, data, options) {
      var key, query;
      if (!options) {
        options = {};
      }
      if (this.authToken && !options.headers) {
        options.headers = {};
        options.headers["Authorization"] = "Bearer " + this.authToken;
      }
      if (data !== void 0 && data.length && data.length !== 0) {
        query = [];
        for (key in data) {
          query.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
        }
        path += "?" + query.join("&");
      }
      if (this.sockjs) {
        return this._sockReq("get", path, null, options);
      }
      return this.ajax("GET", this.url + path, null, options);
    };

    Lavaboom.prototype.post = function(path, data, options) {
      if (!options) {
        options = {};
      }
      if (this.authToken && !options.headers) {
        options.headers = {};
        options.headers["Authorization"] = "Bearer " + this.authToken;
      }
      if (this.sockjs) {
        return this._sockReq("post", path, data, options);
      }
      return this.ajax("POST", this.url + path, JSON.stringify(data), options);
    };

    Lavaboom.prototype.put = function(path, data, options) {
      if (!options) {
        options = {};
      }
      options.dataType = "json";
      options.responseType = "json";
      if (this.authToken && !options.headers) {
        options.headers = {};
        options.headers["Authorization"] = "Bearer " + this.authToken;
      }
      if (this.sockjs) {
        return this._sockReq("put", path, data, options);
      }
      return this.ajax("PUT", this.url + path, JSON.stringify(data), options);
    };

    Lavaboom.prototype["delete"] = function(path, data, options) {
      var key, query;
      if (!options) {
        options = {};
      }
      if (this.authToken && !options.headers) {
        options.headers = {};
        options.headers["Authorization"] = "Bearer " + this.authToken;
      }
      if (data !== void 0 && data.length && data.length !== 0) {
        query = [];
        for (key in data) {
          query.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
        }
        path += "?" + query.join("&");
      }
      if (this.sockjs) {
        return this._sockReq("get", path, null, options);
      }
      return this.ajax("DELETE", this.url + path, null, options);
    };

    Lavaboom.prototype.info = function() {
      return this.get("/");
    };

    Lavaboom.prototype.accounts = {
      create: {
        register: function(query) {
          return this.that.post("/accounts", {
            username: query.username,
            alt_email: query.alt_email
          });
        },
        verify: function(query) {
          return this.that.post("/accounts", {
            username: query.username,
            invite_code: query.invite_code
          });
        },
        setup: function(query) {
          return this.that.post("/accounts", {
            username: query.username,
            invite_code: query.invite_code,
            password: query.password
          });
        }
      },
      get: function(who) {
        return this.that.get("/accounts/" + who);
      },
      update: function(who, what) {
        return this.that.put("/accounts/" + who, what);
      },
      "delete": function(who) {
        return this.that["delete"]("/accounts/" + who);
      },
      wipeData: function(who) {
        return this.that.post("/accounts/" + who("/wipe-data"));
      }
    };

    Lavaboom.prototype.attachments = {
      list: function() {
        return this.that.get("/attachments");
      },
      create: function(query) {
        return this.that.post("/attachments", {
          data: query.data,
          name: query.name,
          encoding: query.encoding,
          version_major: query.version_major,
          version_minor: query.version_minor,
          pgp_fingerprints: query.pgp_fingerprints
        });
      },
      get: function(id) {
        return this.that.get("/attachments/" + id);
      },
      update: function(id, query) {
        return this.that.put("/attachments/" + id, {
          data: query.data,
          name: query.name,
          encoding: query.encoding,
          version_major: query.version_major,
          version_minor: query.version_minor,
          pgp_fingerprints: query.pgp_fingerprints
        });
      },
      "delete": function(id) {
        return this.that["delete"]("/attachments/" + id);
      }
    };

    Lavaboom.prototype.contacts = {
      list: function() {
        return this.that.get("/contacts");
      },
      create: function(query) {
        return this.that.post("/contacts", {
          data: query.data,
          name: query.name,
          encoding: query.encoding,
          version_major: query.version_major,
          version_minor: query.version_minor,
          pgp_fingerprints: query.pgp_fingerprints
        });
      },
      get: function(id) {
        return this.that.get("/contacts/" + id);
      },
      update: function(id, query) {
        return this.that.put("/contacts/" + id, {
          data: query.data,
          name: query.name,
          encoding: query.encoding,
          version_major: query.version_major,
          version_minor: query.version_minor,
          pgp_fingerprints: query.pgp_fingerprints
        });
      },
      "delete": function(id) {
        return this.that["delete"]("/contacts/" + id);
      }
    };

    Lavaboom.prototype.emails = {
      list: function(query) {
        var url;
        url = "/emails";
        if (query && _.size(query) > 0) {
          url += "?" + encodeQueryData(query);
        }
        return this.that.get(url);
      },
      get: function(id) {
        return this.that.get("/emails/" + id);
      },
      create: function(query) {
        return this.that.post("/emails", {
          to: query.to,
          bcc: query.bcc,
          reply_to: query.reply_to,
          thread_id: query.thread_id,
          subject: query.subject,
          is_encrypted: query.is_encrypted,
          body: query.body,
          body_version_major: query.body_version_major,
          body_version_minor: query.body_version_minor,
          preview: query.preview,
          preview_version_major: query.preview_version_major,
          preview_version_minor: query.preview_version_minor,
          attachments: query.attachments,
          pgp_fingerprints: query.pgp_fingerprints
        });
      },
      "delete": function(id) {
        return this.that["delete"]("/emails/" + id);
      }
    };

    Lavaboom.prototype.keys = {
      list: function(name) {
        return this.that.get("/keys?user=" + name);
      },
      get: function(id) {
        return this.that.get("/keys/" + encodeURIComponent(id));
      },
      create: function(key) {
        return this.that.post("/keys", {
          key: key
        });
      }
    };

    Lavaboom.prototype.labels = {
      list: function() {
        return this.that.get("/labels");
      },
      get: function(id) {
        return this.that.get("/labels/" + id);
      },
      create: function(query) {
        return this.that.post("/labels", {
          name: query.name
        });
      },
      "delete": function(id) {
        return this.that["delete"]("/labels/" + id);
      },
      update: function(id, query) {
        return this.that.put("/labels/" + id, {
          name: query.name
        });
      }
    };

    Lavaboom.prototype.tokens = {
      getCurrent: function() {
        return this.that.get("/tokens");
      },
      get: function(id) {
        return this.that.get("/tokens/" + id);
      },
      create: function(query) {
        return this.that.post("/tokens", {
          username: query.username,
          password: query.password,
          type: query.type,
          token: query.token
        });
      },
      deleteCurrent: function() {
        return this.that["delete"]("/tokens");
      },
      "delete": function(id) {
        return this.that["delete"]("/tokens/" + id);
      }
    };

    return Lavaboom;

  })();

}).call(this);
