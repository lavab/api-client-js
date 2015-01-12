(function() {
  
/*! qwest 1.5.1 (https://github.com/pyrsmk/qwest) */
!function(a,b,c){"undefined"!=typeof module&&module.exports?module.exports=c:"function"==typeof define&&define.amd?define(c):a[b]=c}(this,"qwest",function(){var win=window,doc=document,before,limit=null,requests=0,request_stack=[],getXHR=function(){return win.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP")},xhr2=""===getXHR().responseType,qwest=function(method,url,data,options,before){method=method.toUpperCase(),data=data||null,options=options||{};var nativeResponseParsing=!1,crossOrigin,xhr,xdr=!1,timeoutInterval,aborted=!1,retries=0,headers={},mimeTypes={text:"*/*",xml:"text/xml",json:"application/json",arraybuffer:null,formdata:null,document:null,file:null,blob:null},contentType="Content-Type",vars="",i,j,serialized,then_stack=[],catch_stack=[],complete_stack=[],response,success,error,func,promises={then:function(a){return options.async?then_stack.push(a):success&&a.call(xhr,response),promises},"catch":function(a){return options.async?catch_stack.push(a):error&&a.call(xhr,response),promises},complete:function(a){return options.async?complete_stack.push(a):a.call(xhr),promises}},promises_limit={then:function(a){return request_stack[request_stack.length-1].then.push(a),promises_limit},"catch":function(a){return request_stack[request_stack.length-1]["catch"].push(a),promises_limit},complete:function(a){return request_stack[request_stack.length-1].complete.push(a),promises_limit}},handleResponse=function(){if(!aborted){var i,req,p,responseType;if(--requests,clearInterval(timeoutInterval),request_stack.length){for(req=request_stack.shift(),p=qwest(req.method,req.url,req.data,req.options,req.before),i=0;func=req.then[i];++i)p.then(func);for(i=0;func=req["catch"][i];++i)p["catch"](func);for(i=0;func=req.complete[i];++i)p.complete(func)}try{if("status"in xhr&&!/^2|1223/.test(xhr.status))throw xhr.status+" ("+xhr.statusText+")";var responseText="responseText",responseXML="responseXML",parseError="parseError";if(nativeResponseParsing&&"response"in xhr&&null!==xhr.response)response=xhr.response;else if("document"==options.responseType){var frame=doc.createElement("iframe");frame.style.display="none",doc.body.appendChild(frame),frame.contentDocument.open(),frame.contentDocument.write(xhr.response),frame.contentDocument.close(),response=frame.contentDocument,doc.body.removeChild(frame)}else{if(responseType=options.responseType,"auto"==responseType)switch(xhr.getResponseHeader(contentType)){case mimeTypes.json:responseType="json";break;case mimeTypes.xml:responseType="xml";break;default:responseType="text"}switch(responseType){case"json":try{response="JSON"in win?JSON.parse(xhr[responseText]):eval("("+xhr[responseText]+")")}catch(e){throw"Error while parsing JSON body : "+e}break;case"xml":try{win.DOMParser?response=(new DOMParser).parseFromString(xhr[responseText],"text/xml"):(response=new ActiveXObject("Microsoft.XMLDOM"),response.async="false",response.loadXML(xhr[responseText]))}catch(e){response=void 0}if(!response||!response.documentElement||response.getElementsByTagName("parsererror").length)throw"Invalid XML";break;default:response=xhr[responseText]}}if(success=!0,p=response,options.async)for(i=0;func=then_stack[i];++i)p=func.call(xhr,p)}catch(e){if(error=!0,options.async)for(i=0;func=catch_stack[i];++i)func.call(xhr,e+" ("+url+")")}if(options.async)for(i=0;func=complete_stack[i];++i)func.call(xhr)}},buildData=function(a,b){var c,d=[],e=encodeURIComponent;if("object"==typeof a&&null!=a)for(c in a)a.hasOwnProperty(c)&&(d=d.concat(buildData(a[c],b?b+"["+c+"]":c)));else null!=a&&null!=b&&d.push(e(b)+"="+e(a));return d.join("&")};switch(++requests,options.async="async"in options?!!options.async:!0,options.cache="cache"in options?!!options.cache:"GET"!=method,options.dataType="dataType"in options?options.dataType.toLowerCase():"post",options.responseType="responseType"in options?options.responseType.toLowerCase():"auto",options.user=options.user||"",options.password=options.password||"",options.withCredentials=!!options.withCredentials,options.timeout=options.timeout?parseInt(options.timeout,10):3e3,options.retries=options.retries?parseInt(options.retries,10):3,i=url.match(/\/\/(.+?)\//),crossOrigin=i&&i[1]?i[1]!=location.host:!1,"ArrayBuffer"in win&&data instanceof ArrayBuffer?options.dataType="arraybuffer":"Blob"in win&&data instanceof Blob?options.dataType="blob":"Document"in win&&data instanceof Document?options.dataType="document":"FormData"in win&&data instanceof FormData&&(options.dataType="formdata"),options.dataType){case"json":data=JSON.stringify(data);break;case"post":data=buildData(data)}if(options.headers){var format=function(a,b,c){return b+c.toUpperCase()};for(i in options.headers)headers[i.replace(/(^|-)([^-])/g,format)]=options.headers[i]}if(headers[contentType]||"GET"==method||(options.dataType in mimeTypes?mimeTypes[options.dataType]&&(headers[contentType]=mimeTypes[options.dataType]):headers[contentType]="application/x-www-form-urlencoded"),headers.Accept||(headers.Accept=options.responseType in mimeTypes?mimeTypes[options.responseType]:"*/*"),crossOrigin||headers["X-Requested-With"]||(headers["X-Requested-With"]="XMLHttpRequest"),"GET"==method&&(vars+=data),options.cache||(vars&&(vars+="&"),vars+="__t="+ +new Date),vars&&(url+=(/\?/.test(url)?"&":"?")+vars),limit&&requests==limit)return request_stack.push({method:method,url:url,data:data,options:options,before:before,then:[],"catch":[],complete:[]}),promises_limit;var send=function(){if(xhr=getXHR(),crossOrigin&&("withCredentials"in xhr||!win.XDomainRequest||(xhr=new XDomainRequest,xdr=!0,"GET"!=method&&"POST"!=method&&(method="POST"))),xdr?xhr.open(method,url):(xhr.open(method,url,options.async,options.user,options.password),xhr2&&options.async&&(xhr.withCredentials=options.withCredentials)),!xdr)for(var a in headers)xhr.setRequestHeader(a,headers[a]);if(xhr2&&"document"!=options.responseType)try{xhr.responseType=options.responseType,nativeResponseParsing=xhr.responseType==options.responseType}catch(b){}xhr2||xdr?xhr.onload=handleResponse:xhr.onreadystatechange=function(){4==xhr.readyState&&handleResponse()},"auto"!==options.responseType&&"overrideMimeType"in xhr&&xhr.overrideMimeType(mimeTypes[options.responseType]),before&&before.call(xhr),xdr?setTimeout(function(){xhr.send()},0):xhr.send("GET"!=method?data:null)},timeout=function(){timeoutInterval=setTimeout(function(){if(aborted=!0,xhr.abort(),options.retries&&++retries==options.retries){if(aborted=!1,error=!0,response="Timeout ("+url+")",options.async)for(i=0;func=catch_stack[i];++i)func.call(xhr,response)}else aborted=!1,timeout(),send()},options.timeout)};return timeout(),send(),promises},create=function(a){return function(b,c,d){var e=before;return before=null,qwest(a,b,c,d,e)}},obj={before:function(a){return before=a,obj},get:create("GET"),post:create("POST"),put:create("PUT"),"delete":create("DELETE"),xhr2:xhr2,limit:function(a){limit=a}};return obj}());


;
  var encodeQueryData;

  encodeQueryData = function(data) {
    var d, ret, _i, _len;
    ret = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      d = data[_i];
      ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
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
        this.sockjs.onconnect = function(e) {
          that.connected = true;
          if (that.queuedMessages.length > 0) {
            return _.forEach(that.queuedMessages, function(msg) {
              return that.sockjs.send(msg);
            });
          }
        };
        this.sockjs.onmessage = function(e) {
          var msg;
          msg = JSON.parse(e.data);
          if (that.handlers[msg.id]) {
            return that.handlers[msg.id](msg);
          }
        };
      }
      this.accounts.that = this;
      this.accounts.create.that = this;
      this.accounts.reserve.that = this;
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
            return val(JSON.parse(data.body));
          });
        } else {
          return _.forEach(promise.onFailure, function(val) {
            return val(JSON.parse(data.body));
          });
        }
      };
      msg = JSON.stringify({
        id: this.counter.toString(),
        type: "request",
        method: method,
        path: path,
        body: data,
        headers: options.headers && options.headers || null
      });
      if (this.connected) {
        this.sockjs.send(msg);
      } else {
        this.queuedMessages.push(msg);
      }
      return promise;
    };

    Lavaboom.prototype.get = function(path, data, options) {
      if (!options) {
        options = {};
      }
      options.responseType = "json";
      if (this.authToken && !options.headers) {
        options.headers = {};
        options.headers["Authorization"] = "Bearer " + this.authToken;
      }
      if (this.sockjs) {
        return this._sockReq("get", path, data, options);
      }
      return qwest.get(this.url + path, data, options);
    };

    Lavaboom.prototype.post = function(path, data, options) {
      if (!options) {
        options = {};
      }
      options.responseType = "json";
      if (this.authToken && !options.headers) {
        options.headers = {};
        options.headers["Authorization"] = "Bearer " + this.authToken;
      }
      if (this.sockjs) {
        return this._sockReq("post", path, data, options);
      }
      return qwest.post(this.url + path, data, options);
    };

    Lavaboom.prototype.put = function(path, data, options) {
      if (!options) {
        options = {};
      }
      options.responseType = "json";
      if (this.authToken && !options.headers) {
        options.headers = {};
        options.headers["Authorization"] = "Bearer " + this.authToken;
      }
      if (this.sockjs) {
        return this._sockReq("put", path, data, options);
      }
      return qwest.put(this.url + path, data, options);
    };

    Lavaboom.prototype["delete"] = function(path, data, options) {
      if (!options) {
        options = {};
      }
      options.responseType = "json";
      if (this.authToken && !options.headers) {
        options.headers = {};
        options.headers["Authorization"] = "Bearer " + this.authToken;
      }
      if (this.sockjs) {
        return this._sockReq("delete", path, data, options);
      }
      return qwest["delete"](this.url + path, data, options);
    };

    Lavaboom.prototype.info = function() {
      return this.get("/");
    };

    Lavaboom.prototype.accounts = {
      create: {
        invited: function(query) {
          return this.that.post("/accounts", {
            username: query.username,
            password: query.password,
            token: query.token
          });
        },
        classic: function(query) {
          return this.that.post("/accounts", {
            username: query.username,
            password: query.password,
            alt_email: query.email
          });
        }
      },
      reserve: {
        queue: function(query) {
          return this.that.post("/accounts", {
            alt_email: query.email
          });
        },
        username: function(query) {
          return this.that.post("/accounts", {
            username: query.username,
            alt_email: query.email
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
