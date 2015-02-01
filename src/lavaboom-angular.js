/* jshint esnext: true */
/* global angular */
/* global Lavaboom */

(function() {
	angular.module('lavaboom.api', []).provider('LavaboomAPI', function LavaboomAPIProvider() {
		// Define provider's scope
		let self = this;

		// LavaboomAPI definition
		self.$get = function($q, $rootScope) {
			// Initialize a new API token
			self.api = new Lavaboom(self.url, self.specialToken, Promise);

			if (self.authToken) {
				self.api.authToken = self.authToken;
			}

			// Service definition
			return {
				setAuthToken: (newToken) => {
					self.authToken = newToken;
					self.api.authToken = newToken;
				},

				connect: () => $q.when(self.api.connect()),

				// Subscription wrappers
				subscribe: (name, callback) => self.api.subscribe(name, function(e) {
					$rootScope.$apply(function() {
						callback(e);
					});
				}),

				unSubscribe: (name, callback) => self.api.unSubscribe(name, function(e) {
					$rootScope.$apply(function() {
						callback(e);
					});
				}),

				// API index
				info: () => $q.when(self.api.info()),

				// Accounts
				accounts: {
					create: {
						register: (query) => $q.when(self.api.accounts.create.register(query)),
						verify: (query) => $q.when(self.api.accounts.create.verify(query)),
						setup: (query) => $q.when(self.api.accounts.create.setup(query))
					},
					get: (who) => $q.when(self.api.accounts.get(who)),
					update: (who, what) => $q.when(self.api.accounts.update(who, what)),
					delete: (who) => $q.when(self.api.accounts.delete(who)),
					wipeData: (whose) => $q.when(self.api.accounts.wipeData(whose))
				},

				// Attachments
				attachments: {
					list: () => $q.when(self.api.attachments.list()),
					create: (query) => $q.when(self.api.attachments.create(query)),
					get: (id) => $q.when(self.api.attachments.get(id)),
					update: (id, query) => $q.when(self.api.attachments.update(id, query)),
					delete: (id) => $q.when(self.api.attachments.delete(id))
				},

				// Contacts
				contacts: {
					list: () => $q.when(self.api.contacts.list()),
					create: (query) => $q.when(self.api.contacts.create(query)),
					get: (id) => $q.when(self.api.contacts.get(id)),
					update: (id, query) => $q.when(self.api.contacts.update(id, query)),
					delete: (id) => $q.when(self.api.contacts.delete(id))
				},

				// Emails
				emails: {
					list: (query) => $q.when(self.api.emails.list(query)),
					get: (id) => $q.when(self.api.emails.get(id)),
					create: (query) => $q.when(self.api.emails.create(query)),
					delete: (id) => $q.when(self.api.emails.delete(id))
				},

				// Labels
				labels: {
					list: () => $q.when(self.api.labels.list()),
					get: (query) => $q.when(self.api.labels.get(query)),
					create: (query) => $q.when(self.api.labels.create(query)),
					delete: (query) => $q.when(self.api.labels.delete(query)),
					update: (id, query) => $q.when(self.api.labels.update(id, query))
				},

				// Keys
				keys: {
					list: (query) => $q.when(self.api.keys.list(query)),
					get: (id) => $q.when(self.api.keys.get(id)),
					create: (key) => $q.when(self.api.keys.create(key))
				},

				// Threads
				threads: {
					list: (query) => $q.when(self.api.threads.list(query)),
					get: (id) => $q.when(self.api.threads.get(id)),
					update: (id, query) => $q.when(self.api.threads.update(id, query)),
					delete: (id) => $q.when(self.api.threads.delete(id))
				},

				// Tokens
				tokens: {
					getCurrent: () => $q.when(self.api.tokens.getCurrent()),
					get: (id) => $q.when(self.api.tokens.get(id)),
					create: (query) => $q.when(self.api.tokens.create(query)),
					deleteCurrent: () => $q.when(self.api.tokens.deleteCurrent()),
					delete: (id) => $q.when(self.api.tokens.delete(id))
				}
			};
		};

		return self;
	});
}).call(window);