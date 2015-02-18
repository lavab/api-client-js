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
			} catch (error) {
				continue;
			}
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

	var encodeQueryData = data => Object.keys(data).map(k =>
			encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
	).join('&');

	/* API client class */
	this.Lavaboom = function(url, apiToken, transport) {
		let self = this;

		// Default Lavaboom API URL
		if (!url)
			throw new Error('URL required!');
		if (!transport)
			throw new Error('Transport required(http or sockjs)!');

		if (typeof Promise === 'undefined')
			throw new Error('Promise implementation required!');
		if (transport == 'sockjs' && typeof SockJS === 'undefined')
			throw new Error('Sockjs transport is required but not available!');

		// Push it to the class
		self.url = url;
		self.apiToken = apiToken;
		self.transport = transport;

		// Use SockJS if it's loaded
		if (self.transport == 'sockjs') {
			// Create a new connection
			self.sockjs = new SockJS(url + '/ws');

			// Initialize event handling utility vars
			self.sockjs_counter = 0;
			self.handlers = {};

			// Incoming message handler
			self.sockjs.onmessage = function(e) {
				let msg = JSON.parse(e.data);

				switch (msg.type) {
					case 'response':
						if (self.handlers[msg.id])
							self.handlers[msg.id](msg);
						break;
					default:
						if (self.subscriptions && self.subscriptions[msg.type]) {
							for (let subscription of self.subscriptions[msg.type])
								subscription(msg);
						}
						break;
				}
			};
		}

		var isConnected = false;

		self.connect = () => new Promise((resolve, reject) => {
			if (isConnected)
				return resolve();

			if (self.sockjs) {
				self.sockjs.onopen = function() {
					isConnected = true;
					resolve();
				};
			} else {
				resolve();
			}
		});

		self.request = (method, path, data, options) => {
			// Generate some defaults
			if (!options) {
				options = {};
			}

			if (!options.headers) {
				options.headers = {};
			}

			// Add a Content-Type to the request is we're sending a body
			if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') {
				options.headers['Content-Type'] = 'application/json;charset=utf-8';
			}

			// Inject the authentication token
			if (self.authToken) {
				options.headers.Authorization = 'Bearer ' + self.authToken;
			}

			// And the API token
			if (self.apiToken) {
				options.headers['X-Lavaboom-Token'] = self.apiToken;
			}

			// Force method to be uppercase
			method = method.toUpperCase();

			if (self.sockjs)
				return new Promise((resolve, reject) => {
					// Increase the counter (it can't be _not threadsafe_, as we're using JS)
					self.sockjs_counter++;

					// Generate a new message
					let msg = JSON.stringify({
						id: self.sockjs_counter.toString(),
						type: 'request',
						method: method,
						path: path,
						body: JSON.stringify(data),
						headers: options.headers
					});

					// Send the message
					self.sockjs.send(msg);

					self.handlers[self.sockjs_counter.toString()] = (data) => {
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

			return new Promise((resolve, reject) => {
				// Get a new AJAX object
				let req = getAjaxRequest();

				if (!req)
					return reject(new Error('Ajax isn\'t supported!'));

				// Start the request. Last param is whether it should be performed async or not
				req.open(method, url + path, true);
				req.onreadystatechange = () => {
					// 4 means complete
					if (req.readyState !== 4) {
						return;
					}

					// Try to parse the response
					let body;
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
				for (let key in options.headers) {
					if (options.headers.hasOwnProperty(key)) {
						req.setRequestHeader(key, options.headers[key]);
					}
				}

				// Send the request
				req.send(JSON.stringify(data));
			});
		};

		var checkSubscribe = () => {
			if (!self.sockjs)
				throw new Error('Not using SockJS');

			if (!self.authToken)
				throw new Error('Not authenticated');
		};

		// Subscription methods
		self.subscribe = (name, callback) => {
			checkSubscribe();

			if (!self.subscriptions) {
				self.sockjs.send(JSON.stringify({
					'type': 'subscribe',
					'token': self.authToken
				}));
				self.subscriptions = {};
			}

			if (!self.subscriptions[name]) {
				self.subscriptions[name] = [];
			}

			self.subscriptions[name].push(callback);
		};

		self.unSubscribe = function(name, callback){
			checkSubscribe();

			if (!self.subscriptions)
				throw new Error('Subscription not found');

			if (!self.subscriptions[name])
				throw new Error('Subscription not found');

			for (let i = 0; i < self.subscriptions[name].length; i++) {
				if (self.subscriptions[name][i] == callback) {
					self.subscriptions[name].splice(i, 1);
					return;
				}
			}

			throw new Error('Subscription not found');
		};

		// Request helpers
		self.get = (path, data, options) => {
			// Encode the query params
			if (data && Object.keys(data).length > 0)
				path += '?' + encodeQueryData(data);

			// Perform the request
			return self.request('GET', path, null, options);
		};

		self.post = (path, data, options) => {
			return self.request('POST', path, data, options);
		};

		self.put = (path, data, options) => {
			return self.request('PUT', path, data, options);
		};

		self.delete = (path, data, options) => {
			// Encode the query params
			if (data && Object.keys(data).length > 0)
				path += '?' + encodeQueryData(data);

			// Perform the request
			return self.request('DELETE', path, null, options);
		};

		// API index
		self.info = function() {
			return self.get('/');
		};

		// Accounts
		self.accounts = {
			create: {
				register: (query) => self.post('/accounts', query),
				verify: (query) => self.post('/accounts', query),
				setup: (query) => self.post('/accounts', query)
			},
			get: (who) => self.get('/accounts/' + who),
			update: (who, what) => self.put('/accounts/' + who, what),
			delete: (who) => self.delete('/accounts/' + who),
			wipeData: (who) => self.post('/accounts/' + who + '/wipe-data')
		};

		// Files
		self.files = {
			list: () => self.get('/files'),
			create: (query) => self.post('/files', query),
			get: (id) => self.get('/files/' + id),
			update: (id, query) => self.put('/files/' + id, query),
			delete: (id) => self.delete('/files/' + id)
		};

		// Contacts
		self.contacts = {
			list: () => self.get('/contacts'),
			create: (query) => self.post('/contacts', query),
			get: (id) => self.get('/contacts/' + id),
			update: (id, query) => self.put('/contacts/' + id, query),
			delete: (id) => self.delete('/contacts/' + id)
		};

		// Emails
		self.emails = {
			list: (query) => self.get('/emails', query),
			get: (id) => self.get('/emails/' + id),
			create: (query) => self.post('/emails', query),
			delete: (id) => self.delete('/emails/' + id)
		};

		// Keys
		self.keys = {
			list: (name) => self.get('/keys?user=' + name),
			get: (id) => self.get('/keys/' + encodeURIComponent(id)),
			create: (key) => self.post('/keys', {
				key: key
			})
		};

		// Labels
		self.labels = {
			list: () => self.get('/labels'),
			get: (id) => self.get('/labels/' + id),
			create: (query) => self.post('/labels', {
				name: query.name
			}),
			delete: (id) => self.delete('/labels/' + id),
			update: (id, query) => self.put('/labels/' + id, {
				name: query.name
			})
		};

		// Threads
		self.threads = {
			list: (query) => self.get('/threads', query),
			get: (id) => self.get('/threads/' + id),
			update: (id, query) => self.put('/threads/' + id, query),
			delete: (id) => self.delete('/threads/' + id)
		};

		// Tokens
		self.tokens = {
			getCurrent: () => self.get('/tokens'),
			get: id => self.get('/tokens/' + id),
			create: query => self.post('/tokens', query),
			deleteCurrent: () => self.delete('/tokens'),
			delete: id => self.delete('/tokens/' + id)
		};

		return self;
	}
}).call(window);