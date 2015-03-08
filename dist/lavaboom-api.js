"use strict";

/* jshint esnext: true */
/* global ActiveXObject */
/* global SockJS */

(function () {
	/* Helper functions */
	function getAjaxRequest() {
		if (typeof XMLHttpRequest !== "undefined") {
			return new XMLHttpRequest();
		}

		var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"];

		var xhr = null;
		for (var i = 0; i < versions.length; i++) {
			try {
				xhr = new ActiveXObject(versions[i]);
				break;
			} catch (error) {
				continue;
			}
		}

		return xhr;
	}

	function parseResponseHeaders(input) {
		var headers = {};

		if (input) {
			return headers;
		}

		var pairs = input.split("\r\n");

		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i];

			// Does same thing as strings.SplitN in Go
			var index = pair.indexOf(": ");
			if (index > -1) {
				var key = pair.substring(0, index);
				var val = pair.substring(index + 2);
				headers[key] = val;
			}
		}

		return headers;
	}

	var encodeQueryData = function (data) {
		return Object.keys(data).map(function (k) {
			return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
		}).join("&");
	};

	/* API client class */

	var Lavaboom = function (url, apiToken, transport) {
		var self = this;

		// Default Lavaboom API URL
		if (!url) throw new Error("URL required!");
		if (!transport) throw new Error("Transport required(http or sockjs)!");

		if (typeof Promise === "undefined") throw new Error("Promise implementation required!");
		if (transport == "sockjs" && typeof SockJS === "undefined") throw new Error("Sockjs transport is required but not available!");

		// Push it to the class
		self.url = url;
		self.apiToken = apiToken;
		self.transport = transport;

		// Use SockJS if it's loaded
		if (self.transport == "sockjs") {
			(function () {
				var connect = function () {
					// Create a new connection
					self.sockjs = new SockJS(url + "/ws");

					// Initialize event handling utility vars
					self.sockjs_counter = 0;
					self.handlers = {};

					// Incoming message handler
					self.sockjs.onmessage = function (e) {
						var msg = JSON.parse(e.data);

						switch (msg.type) {
							case "response":
								if (self.handlers[msg.id]) self.handlers[msg.id](msg);
								break;
							default:
								if (self.subscriptions && self.subscriptions[msg.type]) {
									for (var _iterator = self.subscriptions[msg.type][Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
										var subscription = _step.value;
										subscription(msg);
									}
								}
								break;
						}
					};

					// connection closed
					self.sockjs.onclose = function () {
						rc = rc < 32 ? rc * 2 : 1;
						setTimeout(function () {
							connect();
						}, rc * 1000);
					};
				};

				var rc = 1;

				connect();
			})();
		}

		var isConnected = false;

		self.connect = function () {
			return new Promise(function (resolve, reject) {
				if (isConnected) return resolve();

				if (self.sockjs) {
					self.sockjs.onopen = function () {
						isConnected = true;
						resolve();
					};
				} else {
					resolve();
				}
			});
		};

		self.request = function (method, path, data, options) {
			// Generate some defaults
			if (!options) {
				options = {};
			}

			if (!options.headers) {
				options.headers = {};
			}

			// Add a Content-Type to the request is we're sending a body
			if (method.toUpperCase() === "POST" || method.toUpperCase() === "PUT") {
				options.headers["Content-Type"] = "application/json;charset=utf-8";
			}

			// Inject the authentication token
			if (self.authToken) {
				options.headers.Authorization = "Bearer " + self.authToken;
			}

			// And the API token
			if (self.apiToken) {
				options.headers["X-Lavaboom-Token"] = self.apiToken;
			}

			// Force method to be uppercase
			method = method.toUpperCase();

			if (self.sockjs) return new Promise(function (resolve, reject) {
				// Increase the counter (it can't be _not threadsafe_, as we're using JS)
				self.sockjs_counter++;

				// Generate a new message
				var msg = JSON.stringify({
					id: self.sockjs_counter.toString(),
					type: "request",
					method: method,
					path: path,
					body: JSON.stringify(data),
					headers: options.headers
				});

				// Send the message
				self.sockjs.send(msg);

				self.handlers[self.sockjs_counter.toString()] = function (data) {
					// Parse the body
					data.body = JSON.parse(data.body);

					// Depending on the status, resolve or reject
					if (data.status >= 200 && data.status < 300) {
						resolve(data);
					} else {
						reject(data);
					}
				};
			});

			return new Promise(function (resolve, reject) {
				// Get a new AJAX object
				var req = getAjaxRequest();

				if (!req) return reject(new Error("Ajax isn't supported!"));

				// Start the request. Last param is whether it should be performed async or not
				req.open(method, url + path, true);
				req.onreadystatechange = function () {
					// 4 means complete
					if (req.readyState !== 4) {
						return;
					}

					// Try to parse the response
					var body = undefined;
					try {
						body = JSON.parse(req.responseText);
					} catch (error) {
						body = error;
					}

					// Resolve the promise
					if (req.status >= 200 && req.status < 300) {
						resolve({
							body: body,
							status: req.status,
							headers: parseResponseHeaders(req.getAllResponseHeaders())
						});
					} else {
						reject({
							body: body,
							status: req.status,
							headers: parseResponseHeaders(req.getAllResponseHeaders())
						});
					}
				};

				// Set other headers
				for (var key in options.headers) {
					if (options.headers.hasOwnProperty(key)) {
						req.setRequestHeader(key, options.headers[key]);
					}
				}

				// Send the request
				req.send(JSON.stringify(data));
			});
		};

		var checkSubscribe = function () {
			if (!self.sockjs) throw new Error("Not using SockJS");

			if (!self.authToken) throw new Error("Not authenticated");
		};

		// Subscription methods
		self.subscribe = function (name, callback) {
			checkSubscribe();

			if (!self.subscriptions) {
				self.sockjs.send(JSON.stringify({
					type: "subscribe",
					token: self.authToken
				}));
				self.subscriptions = {};
			}

			if (!self.subscriptions[name]) {
				self.subscriptions[name] = [];
			}

			self.subscriptions[name].push(callback);
		};

		self.unSubscribe = function (name, callback) {
			checkSubscribe();

			if (!self.subscriptions) throw new Error("Subscription not found");

			if (!self.subscriptions[name]) throw new Error("Subscription not found");

			for (var i = 0; i < self.subscriptions[name].length; i++) {
				if (self.subscriptions[name][i] == callback) {
					self.subscriptions[name].splice(i, 1);
					return;
				}
			}

			throw new Error("Subscription not found");
		};

		// Request helpers
		self.get = function (path, data, options) {
			// Encode the query params
			if (data && Object.keys(data).length > 0) path += "?" + encodeQueryData(data);

			// Perform the request
			return self.request("GET", path, null, options);
		};

		self.post = function (path, data, options) {
			return self.request("POST", path, data, options);
		};

		self.put = function (path, data, options) {
			return self.request("PUT", path, data, options);
		};

		self["delete"] = function (path, data, options) {
			// Encode the query params
			if (data && Object.keys(data).length > 0) path += "?" + encodeQueryData(data);

			// Perform the request
			return self.request("DELETE", path, null, options);
		};

		// API index
		self.info = function () {
			return self.get("/");
		};

		// Accounts
		self.accounts = {
			create: {
				register: function (query) {
					return self.post("/accounts", query);
				},
				verify: function (query) {
					return self.post("/accounts", query);
				},
				setup: function (query) {
					return self.post("/accounts", query);
				}
			},
			get: function (who) {
				return self.get("/accounts/" + who);
			},
			update: function (who, what) {
				return self.put("/accounts/" + who, what);
			},
			"delete": function (who) {
				return self["delete"]("/accounts/" + who);
			},
			wipeData: function (who) {
				return self.post("/accounts/" + who + "/wipe-data");
			}
		};

		// Files
		self.files = {
			list: function (query) {
				return self.get("/files", query);
			},
			create: function (query) {
				return self.post("/files", query);
			},
			get: function (id) {
				return self.get("/files/" + id);
			},
			update: function (id, query) {
				return self.put("/files/" + id, query);
			},
			"delete": function (id) {
				return self["delete"]("/files/" + id);
			}
		};

		// Contacts
		self.contacts = {
			list: function () {
				return self.get("/contacts");
			},
			create: function (query) {
				return self.post("/contacts", query);
			},
			get: function (id) {
				return self.get("/contacts/" + id);
			},
			update: function (id, query) {
				return self.put("/contacts/" + id, query);
			},
			"delete": function (id) {
				return self["delete"]("/contacts/" + id);
			}
		};

		// Emails
		self.emails = {
			list: function (query) {
				return self.get("/emails", query);
			},
			get: function (id) {
				return self.get("/emails/" + id);
			},
			create: function (query) {
				return self.post("/emails", query);
			},
			"delete": function (id) {
				return self["delete"]("/emails/" + id);
			}
		};

		// Keys
		self.keys = {
			list: function (name) {
				return self.get("/keys?user=" + name);
			},
			get: function (id) {
				return self.get("/keys/" + encodeURIComponent(id));
			},
			create: function (key) {
				return self.post("/keys", {
					key: key
				});
			}
		};

		// Labels
		self.labels = {
			list: function () {
				return self.get("/labels");
			},
			get: function (id) {
				return self.get("/labels/" + id);
			},
			create: function (query) {
				return self.post("/labels", {
					name: query.name
				});
			},
			"delete": function (id) {
				return self["delete"]("/labels/" + id);
			},
			update: function (id, query) {
				return self.put("/labels/" + id, {
					name: query.name
				});
			}
		};

		// Threads
		self.threads = {
			list: function (query) {
				return self.get("/threads", query);
			},
			get: function (id) {
				return self.get("/threads/" + id);
			},
			update: function (id, query) {
				return self.put("/threads/" + id, query);
			},
			"delete": function (id) {
				return self["delete"]("/threads/" + id);
			}
		};

		// Tokens
		self.tokens = {
			getCurrent: function () {
				return self.get("/tokens");
			},
			get: function (id) {
				return self.get("/tokens/" + id);
			},
			create: function (query) {
				return self.post("/tokens", query);
			},
			deleteCurrent: function () {
				return self["delete"]("/tokens");
			},
			"delete": function (id) {
				return self["delete"]("/tokens/" + id);
			}
		};
	};

	var instances = {};

	Lavaboom.getInstance = function (url, apiToken, transport) {
		var key = "" + url + "." + transport;
		if (!instances[key]) instances[key] = new Lavaboom(url, apiToken, transport);
		return instances[key];
	};

	this.Lavaboom = Lavaboom;
}).call(window);