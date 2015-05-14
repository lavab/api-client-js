/* jshint esnext: true */
/* global angular */
/* global Lavaboom */

(function() {
	let createLavaboomAPIProvider = (transport) => function LavaboomAPIProvider() {
		let self = this;

		self.url = null;
		self.authToken = null;
		self.specialToken = null;

		let api = null;

		self.$get = function($q, $rootScope) {
			if (!api)
				api = Lavaboom.getInstance(self.url, self.specialToken, transport);

			if (self.authToken)
				api.authToken = self.authToken;

			return {
				setAuthToken: (newToken) => {
					self.authToken = newToken;
					api.authToken = newToken;
				},

				connect: (opts) => $q.when(api.connect(opts)),

				isConnected: () => api.isConnected(),

				subscribe: (name, callback) => api.subscribe(name, function(e) {
					$rootScope.$apply(function() {
						callback(e);
					});
				}),

				unSubscribe: (name, callback) => api.unSubscribe(name, function(e) {
					$rootScope.$apply(function() {
						callback(e);
					});
				}),

				info: () => $q.when(api.info()),

				addresses: {
					get: () => $q.when(api.addresses.get())
				},

				accounts: {
					create: {
						register: (query) => $q.when(api.accounts.create.register(query)),
						verify: (query) => $q.when(api.accounts.create.verify(query)),
						setup: (query) => $q.when(api.accounts.create.setup(query))
					},
					get: (who) => $q.when(api.accounts.get(who)),
					update: (who, what) => $q.when(api.accounts.update(who, what)),
					delete: (who) => $q.when(api.accounts.delete(who)),
					wipeData: (whose) => $q.when(api.accounts.wipeData(whose)),
					startOnboarding: (who) => $q.when(api.accounts.startOnboarding(who))
				},

				files: {
					list: (query) => $q.when(api.files.list(query)),
					create: (query) => $q.when(api.files.create(query)),
					get: (id) => $q.when(api.files.get(id)),
					update: (id, query) => $q.when(api.files.update(id, query)),
					delete: (id) => $q.when(api.files.delete(id))
				},

				contacts: {
					list: () => $q.when(api.contacts.list()),
					create: (query) => $q.when(api.contacts.create(query)),
					get: (id) => $q.when(api.contacts.get(id)),
					update: (id, query) => $q.when(api.contacts.update(id, query)),
					delete: (id) => $q.when(api.contacts.delete(id))
				},

				emails: {
					list: (query) => $q.when(api.emails.list(query)),
					get: (id) => $q.when(api.emails.get(id)),
					create: (query) => $q.when(api.emails.create(query)),
					delete: (id) => $q.when(api.emails.delete(id))
				},

				labels: {
					list: () => $q.when(api.labels.list()),
					get: (query) => $q.when(api.labels.get(query)),
					create: (query) => $q.when(api.labels.create(query)),
					delete: (query) => $q.when(api.labels.delete(query)),
					update: (id, query) => $q.when(api.labels.update(id, query))
				},

				keys: {
					list: (query) => $q.when(api.keys.list(query)),
					get: (id) => $q.when(api.keys.get(id)),
					create: (key) => $q.when(api.keys.create(key))
				},

				threads: {
					list: (query) => $q.when(api.threads.list(query)),
					get: (id) => $q.when(api.threads.get(id)),
					update: (id, query) => $q.when(api.threads.update(id, query)),
					delete: (id) => $q.when(api.threads.delete(id))
				},

				tokens: {
					getCurrent: () => $q.when(api.tokens.getCurrent()),
					get: (id) => $q.when(api.tokens.get(id)),
					create: (query) => $q.when(api.tokens.create(query)),
					deleteCurrent: () => $q.when(api.tokens.deleteCurrent()),
					delete: (id) => $q.when(api.tokens.delete(id))
				}
			};
		};

		return self;
	};

	angular.module('lavaboom.api', [])
		.provider('LavaboomAPI', createLavaboomAPIProvider('sockjs'))
		.provider('LavaboomHttpAPI', createLavaboomAPIProvider('http'));
}).call(window);