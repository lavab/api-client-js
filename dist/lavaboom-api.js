/* jshint esnext: true */
/* global ActiveXObject */
/* global SockJS */

'use strict';

(function () {
	/* Helper functions */
	function getAjaxRequest() {
		if (typeof XMLHttpRequest !== 'undefined') {
			return new XMLHttpRequest();
		}

		var versions = ['MSXML2.XmlHttp.5.0', 'MSXML2.XmlHttp.4.0', 'MSXML2.XmlHttp.3.0', 'MSXML2.XmlHttp.2.0', 'Microsoft.XmlHttp'];

		var xhr = null;
		for (var i = 0; i < versions.length; i++) {
			try {
				xhr = new ActiveXObject(versions[i]);
				break;
			} catch (error) {}
		}

		return xhr;
	}

	function parseResponseHeaders(input) {
		var headers = {};

		if (input) {
			return headers;
		}

		var pairs = input.split('\r\n');

		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i];

			// Does same thing as strings.SplitN in Go
			var index = pair.indexOf(': ');
			if (index > -1) {
				var key = pair.substring(0, index);
				var val = pair.substring(index + 2);
				headers[key] = val;
			}
		}

		return headers;
	}

	function encodeQueryData(data) {
		return Object.keys(data).map(function (k) {
			return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
		}).join('&');
	}

	/* API client class */

	var Lavaboom = function Lavaboom(url, apiToken, transport) {
		var self = this;

		if (!url) throw new Error('URL required!');

		if (!transport) throw new Error('Transport required(http or sockjs)!');

		if (typeof Promise === 'undefined') throw new Error('Promise implementation required!');

		if (transport == 'sockjs' && typeof SockJS === 'undefined') throw new Error('Sockjs transport is required but not available!');

		self.url = url;
		self.apiToken = apiToken;
		self.transport = transport;

		var subscriptions = {};
		var handlers = {};
		var sockjs = null;
		var sockjsСounter = 0;

		var isConnected = false;
		var rc = 1;

		var defaultTimeout = 10000;
		var onDisconnectHandler = null;

		var subscribe = function subscribe() {
			sockjs.send(JSON.stringify({
				type: 'subscribe',
				token: self.authToken
			}));
		};

		var connect = function connect() {
			return new Promise(function (resolve, reject) {
				console.debug('sockjs: connecting, timeout', defaultTimeout);

				sockjs = new SockJS(url + '/ws');
				sockjsСounter = 0;
				handlers = {};

				var connectionTimeout = setTimeout(function () {
					reject(new Error('timeout'));
				}, defaultTimeout);

				sockjs.onopen = function () {
					if (Object.keys(subscriptions).length > 0) subscribe();

					isConnected = true;
					rc = 1;

					if (connectionTimeout) {
						clearTimeout(connectionTimeout);
						connectionTimeout = null;
					}

					console.debug('sockjs: connected');
					resolve();
				};

				sockjs.onmessage = function (e) {
					if (connectionTimeout) {
						clearTimeout(connectionTimeout);
						connectionTimeout = null;
					}

					var msg = JSON.parse(e.data);

					switch (msg.type) {
						case 'response':
							if (handlers[msg.id]) handlers[msg.id](msg);
							break;
						default:
							if (subscriptions[msg.type]) {
								var _iteratorNormalCompletion = true;
								var _didIteratorError = false;
								var _iteratorError = undefined;

								try {
									for (var _iterator = subscriptions[msg.type][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
										var subscription = _step.value;

										subscription(msg);
									}
								} catch (err) {
									_didIteratorError = true;
									_iteratorError = err;
								} finally {
									try {
										if (!_iteratorNormalCompletion && _iterator['return']) {
											_iterator['return']();
										}
									} finally {
										if (_didIteratorError) {
											throw _iteratorError;
										}
									}
								}
							}
							break;
					}
				};

				sockjs.onclose = function () {
					console.debug('sockjs: it\'s dead Jim :()', onDisconnectHandler);

					var _iteratorNormalCompletion2 = true;
					var _didIteratorError2 = false;
					var _iteratorError2 = undefined;

					try {
						for (var _iterator2 = Object.keys(handlers)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
							var id = _step2.value;

							console.debug('sockjs: reject handler with id', id);
							handlers[id]({
								status: 598,
								body: JSON.stringify({
									message: 'Disconnected from SockJS endpoint'
								})
							});
						}
					} catch (err) {
						_didIteratorError2 = true;
						_iteratorError2 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion2 && _iterator2['return']) {
								_iterator2['return']();
							}
						} finally {
							if (_didIteratorError2) {
								throw _iteratorError2;
							}
						}
					}

					handlers = {};
					sockjs = null;
					isConnected = false;

					if (connectionTimeout) {
						clearTimeout(connectionTimeout);
						connectionTimeout = null;
					}

					if (onDisconnectHandler) onDisconnectHandler();

					rc = rc < 16 ? rc * 2 : 1;

					var timeout = rc * 1000;
					setTimeout(connect, timeout);

					console.debug('sockjs: reconnect scheduled after ', timeout);
				};
			});
		};

		var request = function request(method, path, data, options) {
			if (!options) options = {};

			if (!options.headers) options.headers = {};

			// Add a Content-Type to the request if we're sending a body
			if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') options.headers['Content-Type'] = 'application/json;charset=utf-8';

			if (self.authToken) options.headers.Authorization = 'Bearer ' + self.authToken;

			if (self.apiToken) options.headers['X-Lavaboom-Token'] = self.apiToken;

			method = method.toUpperCase();
			if (self.transport == 'sockjs') {
				if (sockjs) return new Promise(function (resolve, reject) {
					sockjsСounter++;
					var id = sockjsСounter.toString();

					var msg = JSON.stringify({
						id: id,
						type: 'request',
						method: method,
						path: path,
						body: JSON.stringify(data),
						headers: options.headers
					});

					console.debug('sockjs: sending a message', msg);

					sockjs.send(msg);

					handlers[id] = function (data) {
						data.body = JSON.parse(data.body);

						if (data.status >= 200 && data.status < 300) {
							resolve(data);
						} else {
							reject(data);
						}
					};
				});

				return new Promise(function (resolve, reject) {
					reject({
						status: 597,
						body: JSON.stringify({
							message: 'No connection to SockJS endpoint'
						})
					});
				});
			}

			return new Promise(function (resolve, reject) {
				var req = getAjaxRequest();

				if (!req) return reject(new Error('Ajax isn\'t supported!'));

				// Start the request. Last param is whether it should be performed async or not
				req.open(method, url + path, true);
				req.onreadystatechange = function () {
					// 4 means complete
					if (req.readyState !== 4) return;

					var body = undefined;
					try {
						body = JSON.parse(req.responseText);
					} catch (error) {
						body = error;
					}

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

				var _iteratorNormalCompletion3 = true;
				var _didIteratorError3 = false;
				var _iteratorError3 = undefined;

				try {
					for (var _iterator3 = Object.keys(options.headers)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
						var key = _step3.value;

						req.setRequestHeader(key, options.headers[key]);
					}
				} catch (err) {
					_didIteratorError3 = true;
					_iteratorError3 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion3 && _iterator3['return']) {
							_iterator3['return']();
						}
					} finally {
						if (_didIteratorError3) {
							throw _iteratorError3;
						}
					}
				}

				req.send(JSON.stringify(data));
			});
		};

		var checkSubscribe = function checkSubscribe() {
			if (!sockjs) throw new Error('Not using SockJS');

			if (!isConnected) throw new Error('Must be connected');

			if (!self.authToken) throw new Error('Not authenticated');
		};

		var invokeGet = function invokeGet(path, data, options) {
			if (data && Object.keys(data).length > 0) path += '?' + encodeQueryData(data);

			return request('GET', path, null, options);
		};

		var invokePost = function invokePost(path, data, options) {
			return request('POST', path, data, options);
		};

		var invokePut = function invokePut(path, data, options) {
			return request('PUT', path, data, options);
		};

		var invokeDelete = function invokeDelete(path, data, options) {
			if (data && Object.keys(data).length > 0) path += '?' + encodeQueryData(data);

			return request('DELETE', path, null, options);
		};

		self.connect = function (opts) {
			return new Promise(function (resolve, reject) {
				if (!opts) opts = {};

				if (!opts.timeout) opts.timeout = defaultTimeout;else defaultTimeout = opts.timeout;
				onDisconnectHandler = opts.onDisconnect ? opts.onDisconnect : null;

				if (isConnected || self.transport != 'sockjs') return resolve();

				connect(opts).then(function (r) {
					return resolve(r);
				})['catch'](function (err) {
					return reject(err);
				});
			});
		};

		self.isConnected = function () {
			return isConnected;
		};

		self.subscribe = function (name, callback) {
			checkSubscribe();

			if (Object.keys(subscriptions).length < 1) subscribe();

			if (!subscriptions[name]) subscriptions[name] = [];
			subscriptions[name].push(callback);
		};

		self.unSubscribe = function (name, callback) {
			checkSubscribe();

			if (!subscriptions[name]) throw new Error('Subscription not found');

			subscriptions[name] = subscriptions[name].filter(function (s) {
				return s != callback;
			});
			throw new Error('Subscription not found');
		};

		self.info = function () {
			return invokeGet('/');
		};

		self.addresses = {
			get: function get() {
				return invokeGet('/addresses');
			}
		};

		self.accounts = {
			create: {
				register: function register(query) {
					return invokePost('/accounts', query);
				},
				verify: function verify(query) {
					return invokePost('/accounts', query);
				},
				setup: function setup(query) {
					return invokePost('/accounts', query);
				}
			},
			get: function get(who) {
				return invokeGet('/accounts/' + who);
			},
			update: function update(who, what) {
				return invokePut('/accounts/' + who, what);
			},
			'delete': function _delete(who) {
				return invokeDelete('/accounts/' + who);
			},
			wipeData: function wipeData(who) {
				return invokePost('/accounts/' + who + '/wipe-data');
			},
			startOnboarding: function startOnboarding(who) {
				return invokePost('/accounts/' + who + '/start-onboarding');
			}
		};

		self.files = {
			list: function list(query) {
				return invokeGet('/files', query);
			},
			create: function create(query) {
				return invokePost('/files', query);
			},
			get: function get(id) {
				return invokeGet('/files/' + id);
			},
			update: function update(id, query) {
				return invokePut('/files/' + id, query);
			},
			'delete': function _delete(id) {
				return invokeDelete('/files/' + id);
			}
		};

		self.contacts = {
			list: function list() {
				return invokeGet('/contacts');
			},
			create: function create(query) {
				return invokePost('/contacts', query);
			},
			get: function get(id) {
				return invokeGet('/contacts/' + id);
			},
			update: function update(id, query) {
				return invokePut('/contacts/' + id, query);
			},
			'delete': function _delete(id) {
				return invokeDelete('/contacts/' + id);
			}
		};

		self.emails = {
			list: function list(query) {
				return invokeGet('/emails', query);
			},
			get: function get(id) {
				return invokeGet('/emails/' + id);
			},
			create: function create(query) {
				return invokePost('/emails', query);
			},
			'delete': function _delete(id) {
				return invokeDelete('/emails/' + id);
			}
		};

		self.keys = {
			list: function list(name) {
				return invokeGet('/keys?user=' + name);
			},
			get: function get(id) {
				return invokeGet('/keys/' + encodeURIComponent(id));
			},
			create: function create(key) {
				return invokePost('/keys', {
					key: key
				});
			}
		};

		self.labels = {
			list: function list() {
				return invokeGet('/labels');
			},
			get: function get(id) {
				return invokeGet('/labels/' + id);
			},
			create: function create(query) {
				return invokePost('/labels', query);
			},
			'delete': function _delete(id) {
				return invokeDelete('/labels/' + id);
			},
			update: function update(id, query) {
				return invokePut('/labels/' + id, query);
			}
		};

		self.threads = {
			list: function list(query) {
				return invokeGet('/threads', query);
			},
			get: function get(id) {
				return invokeGet('/threads/' + id);
			},
			update: function update(id, query) {
				return invokePut('/threads/' + id, query);
			},
			'delete': function _delete(id) {
				return invokeDelete('/threads/' + id);
			}
		};

		self.tokens = {
			getCurrent: function getCurrent() {
				return invokeGet('/tokens');
			},
			get: function get(id) {
				return invokeGet('/tokens/' + id);
			},
			create: function create(query) {
				return invokePost('/tokens', query);
			},
			deleteCurrent: function deleteCurrent() {
				return invokeDelete('/tokens');
			},
			'delete': function _delete(id) {
				return invokeDelete('/tokens/' + id);
			}
		};
	};

	var instances = {};

	Lavaboom.getInstance = function (url, apiToken, transport) {
		var key = '' + url + '.' + transport;
		if (!instances[key]) instances[key] = new Lavaboom(url, apiToken, transport);
		return instances[key];
	};

	this.Lavaboom = Lavaboom;
}).call(window);