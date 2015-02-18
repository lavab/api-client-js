/* jshint esnext: true */
/* global angular */
/* global Lavaboom */

(function() {
	let createLavaboomAPIProvider = (transport) => function LavaboomAPIProvider() {
		// Define provider's scope
		let self = this;

		let api = null;

		// LavaboomAPI definition
		self.$get = function($q, $rootScope) {
			// Initialize a new API token
			if (!api)
				api = new Lavaboom(self.url, self.specialToken, transport);

			if (self.authToken)
				api.authToken = self.authToken;

			// Service definition
			return {
				setAuthToken: (newToken) => {
					self.authToken = newToken;
					api.authToken = newToken;
				},

				connect: () => $q.when(api.connect()),

				// Subscription wrappers
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

				// API index
				info: () => $q.when(api.info()),

				// Accounts
				accounts: {
					create: {
						register: (query) => $q.when(api.accounts.create.register(query)),
						verify: (query) => $q.when(api.accounts.create.verify(query)),
						setup: (query) => $q.when(api.accounts.create.setup(query))
					},
					get: (who) => $q.when(api.accounts.get(who)),
					update: (who, what) => $q.when(api.accounts.update(who, what)),
					delete: (who) => $q.when(api.accounts.delete(who)),
					wipeData: (whose) => $q.when(api.accounts.wipeData(whose))
				},

				// Files
				files: {
					list: () => $q.when(api.attachments.list()),
					create: (query) => $q.when(api.attachments.create(query)),
					get: (id) => $q.when(api.attachments.get(id)),
					update: (id, query) => $q.when(api.attachments.update(id, query)),
					delete: (id) => $q.when(api.attachments.delete(id))
				},

				// Contacts
				contacts: {
					list: () => $q.when(api.contacts.list()),
					create: (query) => $q.when(api.contacts.create(query)),
					get: (id) => $q.when(api.contacts.get(id)),
					update: (id, query) => $q.when(api.contacts.update(id, query)),
					delete: (id) => $q.when(api.contacts.delete(id))
				},

				// Emails
				emails: {
					list: (query) => $q.when(api.emails.list(query)),
					get: (id) => $q.when(api.emails.get(id)),
					create: (query) => $q.when(api.emails.create(query)),
					delete: (id) => $q.when(api.emails.delete(id))
				},

				// Labels
				labels: {
					list: () => $q.when(api.labels.list()),
					get: (query) => $q.when(api.labels.get(query)),
					create: (query) => $q.when(api.labels.create(query)),
					delete: (query) => $q.when(api.labels.delete(query)),
					update: (id, query) => $q.when(api.labels.update(id, query))
				},

				// Keys
				keys: {
					list: (query) => $q.when(api.keys.list(query)),
					get: (id) => $q.when(api.keys.get(id)),
					create: (key) => $q.when(api.keys.create(key))
				},

				// Threads
				threads: {
					list: (query) => $q.when(api.threads.list(query)),
					get: (id) => $q.when(api.threads.get(id)),
					update: (id, query) => $q.when(api.threads.update(id, query)),
					delete: (id) => $q.when(api.threads.delete(id))
				},

				// Tokens
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
	}

	angular.module('lavaboom.api', [])
		.provider('LavaboomAPI', createLavaboomAPIProvider('sockjs'))
		.provider('LavaboomHttpAPI', createLavaboomAPIProvider('http'));
}).call(window);