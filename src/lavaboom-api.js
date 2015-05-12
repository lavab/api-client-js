/* jshint esnext: true */
/* global ActiveXObject */
/* global SockJS */

(function() {
	/* Helper functions */
	function getAjaxRequest() {
		if (typeof XMLHttpRequest !== 'undefined') {
			return new XMLHttpRequest();
		}

		let versions = [
			'MSXML2.XmlHttp.5.0',
			'MSXML2.XmlHttp.4.0',
			'MSXML2.XmlHttp.3.0',
			'MSXML2.XmlHttp.2.0',
			'Microsoft.XmlHttp'
		];

		let xhr = null;
		for (let i = 0; i < versions.length; i++) {
			try {
				xhr = new ActiveXObject(versions[i]);
				break;
			} catch (error) { }
		}

		return xhr;
	}

	function parseResponseHeaders(input) {
		let headers = {};

		if (input) {
			return headers;
		}

		let pairs = input.split('\r\n');

		for (let i = 0; i < pairs.length; i++) {
			let pair = pairs[i];

			// Does same thing as strings.SplitN in Go
			let index = pair.indexOf(': ');
			if (index > -1) {
				let key = pair.substring(0, index);
				let val = pair.substring(index + 2);
				headers[key] = val;
			}
		}

		return headers;
	}

	function encodeQueryData(data) {
		return Object.keys(data).map(k =>
			encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
		).join('&');
	}

	/* API client class */

	let Lavaboom = function(url, apiToken, transport) {
		let self = this;

		if (!url)
			throw new Error('URL required!');

		if (!transport)
			throw new Error('Transport required(http or sockjs)!');

		if (typeof Promise === 'undefined')
			throw new Error('Promise implementation required!');

		if (transport == 'sockjs' && typeof SockJS === 'undefined')
			throw new Error('Sockjs transport is required but not available!');

		self.url = url;
		self.apiToken = apiToken;
		self.transport = transport;
		self.subscriptions = {};
		self.handlers = {};
		self.sockjs = null;
		self.sockjsСounter = 0;
		self.isConnected = false;
		self.rc = 1;
		let defaultTimeout = 10000;

		const subscribe = () => {
			self.sockjs.send(JSON.stringify({
				type: 'subscribe',
				token: self.authToken
			}));	
		};
		
		const connect = ({timeout}) => new Promise((resolve, reject) => {
			if (!timeout)
				timeout = defaultTimeout;
			else
				defaultTimeout = timeout;

			console.debug('sockjs: connecting, timeout', timeout);

			self.sockjs = new SockJS(url + '/ws');
			self.sockjsСounter = 0;
			self.handlers = {};

			let connectionTimeout = setTimeout(() => {
				reject(new Error('timeout'));
			}, timeout);

			self.sockjs.onopen = function () {
				if (Object.keys(self.subscriptions).length > 0)
					subscribe();
				
				self.isConnected = true;
				self.rc = 1;

				clearTimeout(connectionTimeout);
				resolve();
			};

			self.sockjs.onmessage = (e) => {
				let msg = JSON.parse(e.data);

				switch (msg.type) {
					case 'response':
						if (self.handlers[msg.id])
							self.handlers[msg.id](msg);
						break;
					default:
						if (self.subscriptions[msg.type]) {
							for (let subscription of self.subscriptions[msg.type])
								subscription(msg);
						}
						break;
				}
			};

			self.sockjs.onclose = () => {
				console.debug('sockjs: it\'s dead Jim :()');

				for (let id of Object.keys(self.handlers)) {
					console.debug('sockjs: reject handler with id', id);
					self.handlers[id]({
						status: 598,
						body: JSON.stringify({
							message: 'Disconnected from SockJS endpoint'
						})
					});
				}
				self.handlers = {};
				self.sockjs = null;
				self.isConnected = false;

				if (self.onDisconnect)
					self.onDisconnect();

				self.rc = self.rc < 16 ? self.rc * 2 : 1;

				let timeout = self.rc * 1000;
				setTimeout(connect, timeout);

				console.debug('sockjs: reconnect scheduled after ', timeout);
			};
		});

		self.connect = ({timeout}) => new Promise((resolve, reject) => {
			if (self.isConnected || self.transport != 'sockjs')
				return resolve();

			connect({timeout})
				.then(r => resolve(r))
				.catch(err => reject(err));
		});

		self.isConnected = () => self.isConnected;

		self.onDisconnect = null;

		self.request = (method, path, data, options = {}) => {
			if (!options.headers)
				options.headers = {};

			// Add a Content-Type to the request if we're sending a body
			if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')
				options.headers['Content-Type'] = 'application/json;charset=utf-8';

			if (self.authToken)
				options.headers.Authorization = 'Bearer ' + self.authToken;

			if (self.apiToken)
				options.headers['X-Lavaboom-Token'] = self.apiToken;

			method = method.toUpperCase();
			if (self.transport == 'sockjs') {
				if (self.sockjs)
					return new Promise((resolve, reject) => {
						self.sockjsСounter++;

						let msg = JSON.stringify({
							id: self.sockjsСounter.toString(),
							type: 'request',
							method: method,
							path: path,
							body: JSON.stringify(data),
							headers: options.headers
						});

						self.sockjs.send(msg);

						self.handlers[self.sockjsСounter.toString()] = (data) => {
							data.body = JSON.parse(data.body);

							if (data.status >= 200 && data.status < 300) {
								resolve(data);
							} else {
								reject(data);
							}
						};
					});

				return new Promise((resolve, reject) => {
					reject({
						status: 597,
						body: JSON.stringify({
							message: 'No connection to SockJS endpoint'
						})
					});
				});
			}

			return new Promise((resolve, reject) => {
				let req = getAjaxRequest();

				if (!req)
					return reject(new Error('Ajax isn\'t supported!'));

				// Start the request. Last param is whether it should be performed async or not
				req.open(method, url + path, true);
				req.onreadystatechange = () => {
					// 4 means complete
					if (req.readyState !== 4)
						return;

					let body;
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

				for (let key of Object.keys(options.headers))
					req.setRequestHeader(key, options.headers[key]);

				req.send(JSON.stringify(data));
			});
		};

		const checkSubscribe = () => {
			if (!self.sockjs)
				throw new Error('Not using SockJS');

			if (!self.isConnected)
				throw new Error('Must be connected');

			if (!self.authToken)
				throw new Error('Not authenticated');
		};

		const invokeGet = (path, data, options) => {
			if (data && Object.keys(data).length > 0)
				path += '?' + encodeQueryData(data);

			return self.request('GET', path, null, options);
		};

		const invokePost = (path, data, options) => {
			return self.request('POST', path, data, options);
		};

		const invokePut = (path, data, options) => {
			return self.request('PUT', path, data, options);
		};

		const invokeDelete = (path, data, options) => {
			if (data && Object.keys(data).length > 0)
				path += '?' + encodeQueryData(data);

			return self.request('DELETE', path, null, options);
		};

		// Subscription methods
		self.subscribe = (name, callback) => {
			checkSubscribe();

			if (Object.keys(self.subscriptions).length < 1)
				subscribe();

			if (!self.subscriptions[name])
				self.subscriptions[name] = [];
			self.subscriptions[name].push(callback);
		};

		self.unSubscribe = function(name, callback){
			checkSubscribe();

			if (!self.subscriptions[name])
				throw new Error('Subscription not found');

			self.subscriptions[name] = self.subscriptions[name].filter(s => s != callback);
			throw new Error('Subscription not found');
		};

		// API index
		self.info = function() {
			return invokeGet('/');
		};

		// Accounts
		self.accounts = {
			create: {
				register: (query) => invokePost('/accounts', query),
				verify: (query) => invokePost('/accounts', query),
				setup: (query) => invokePost('/accounts', query)
			},
			get: (who) => invokeGet('/accounts/' + who),
			update: (who, what) => invokePut('/accounts/' + who, what),
			delete: (who) => invokeDelete('/accounts/' + who),
			wipeData: (who) => invokePost('/accounts/' + who + '/wipe-data')
		};

		// Files
		self.files = {
			list: (query) => invokeGet('/files', query),
			create: (query) => invokePost('/files', query),
			get: (id) => invokeGet('/files/' + id),
			update: (id, query) => invokePut('/files/' + id, query),
			delete: (id) => invokeDelete('/files/' + id)
		};

		// Contacts
		self.contacts = {
			list: () => invokeGet('/contacts'),
			create: (query) => invokePost('/contacts', query),
			get: (id) => invokeGet('/contacts/' + id),
			update: (id, query) => invokePut('/contacts/' + id, query),
			delete: (id) => invokeDelete('/contacts/' + id)
		};

		// Emails
		self.emails = {
			list: (query) => invokeGet('/emails', query),
			get: (id) => invokeGet('/emails/' + id),
			create: (query) => invokePost('/emails', query),
			delete: (id) => invokeDelete('/emails/' + id)
		};

		// Keys
		self.keys = {
			list: (name) => invokeGet('/keys?user=' + name),
			get: (id) => invokeGet('/keys/' + encodeURIComponent(id)),
			create: (key) => invokePost('/keys', {
				key: key
			})
		};

		// Labels
		self.labels = {
			list: () => invokeGet('/labels'),
			get: (id) => invokeGet('/labels/' + id),
			create: (query) => invokePost('/labels', {
				name: query.name
			}),
			delete: (id) => invokeDelete('/labels/' + id),
			update: (id, query) => invokePut('/labels/' + id, {
				name: query.name
			})
		};

		// Threads
		self.threads = {
			list: (query) => invokeGet('/threads', query),
			get: (id) => invokeGet('/threads/' + id),
			update: (id, query) => invokePut('/threads/' + id, query),
			delete: (id) => invokeDelete('/threads/' + id)
		};

		// Tokens
		self.tokens = {
			getCurrent: () => invokeGet('/tokens'),
			get: id => invokeGet('/tokens/' + id),
			create: query => invokePost('/tokens', query),
			deleteCurrent: () => invokeDelete('/tokens'),
			delete: id => invokeDelete('/tokens/' + id)
		};
	};

	let instances = {};

	Lavaboom.getInstance = (url, apiToken, transport) => {
		let key = `${url}.${transport}`;
		if (!instances[key])
			instances[key] = new Lavaboom(url, apiToken, transport);
		return instances[key];
	};

	this.Lavaboom = Lavaboom;
}).call(window);