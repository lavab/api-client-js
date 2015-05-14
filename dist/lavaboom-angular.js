"use strict";

/* jshint esnext: true */
/* global angular */
/* global Lavaboom */

(function () {
	var createLavaboomAPIProvider = function (transport) {
		return function LavaboomAPIProvider() {
			var self = this;

			self.url = null;
			self.authToken = null;
			self.specialToken = null;

			var api = null;

			self.$get = function ($q, $rootScope) {
				if (!api) api = Lavaboom.getInstance(self.url, self.specialToken, transport);

				if (self.authToken) api.authToken = self.authToken;

				return {
					setAuthToken: function (newToken) {
						self.authToken = newToken;
						api.authToken = newToken;
					},

					connect: function (opts) {
						return $q.when(api.connect(opts));
					},

					isConnected: function () {
						return api.isConnected();
					},

					subscribe: function (name, callback) {
						return api.subscribe(name, function (e) {
							$rootScope.$apply(function () {
								callback(e);
							});
						});
					},

					unSubscribe: function (name, callback) {
						return api.unSubscribe(name, function (e) {
							$rootScope.$apply(function () {
								callback(e);
							});
						});
					},

					info: function () {
						return $q.when(api.info());
					},

					addresses: {
						get: function () {
							return $q.when(api.addresses.get());
						}
					},

					accounts: {
						create: {
							register: function (query) {
								return $q.when(api.accounts.create.register(query));
							},
							verify: function (query) {
								return $q.when(api.accounts.create.verify(query));
							},
							setup: function (query) {
								return $q.when(api.accounts.create.setup(query));
							}
						},
						get: function (who) {
							return $q.when(api.accounts.get(who));
						},
						update: function (who, what) {
							return $q.when(api.accounts.update(who, what));
						},
						"delete": function (who) {
							return $q.when(api.accounts["delete"](who));
						},
						wipeData: function (whose) {
							return $q.when(api.accounts.wipeData(whose));
						},
						startOnboarding: function (who) {
							return $q.when(api.accounts.startOnboarding(who));
						}
					},

					files: {
						list: function (query) {
							return $q.when(api.files.list(query));
						},
						create: function (query) {
							return $q.when(api.files.create(query));
						},
						get: function (id) {
							return $q.when(api.files.get(id));
						},
						update: function (id, query) {
							return $q.when(api.files.update(id, query));
						},
						"delete": function (id) {
							return $q.when(api.files["delete"](id));
						}
					},

					contacts: {
						list: function () {
							return $q.when(api.contacts.list());
						},
						create: function (query) {
							return $q.when(api.contacts.create(query));
						},
						get: function (id) {
							return $q.when(api.contacts.get(id));
						},
						update: function (id, query) {
							return $q.when(api.contacts.update(id, query));
						},
						"delete": function (id) {
							return $q.when(api.contacts["delete"](id));
						}
					},

					emails: {
						list: function (query) {
							return $q.when(api.emails.list(query));
						},
						get: function (id) {
							return $q.when(api.emails.get(id));
						},
						create: function (query) {
							return $q.when(api.emails.create(query));
						},
						"delete": function (id) {
							return $q.when(api.emails["delete"](id));
						}
					},

					labels: {
						list: function () {
							return $q.when(api.labels.list());
						},
						get: function (query) {
							return $q.when(api.labels.get(query));
						},
						create: function (query) {
							return $q.when(api.labels.create(query));
						},
						"delete": function (query) {
							return $q.when(api.labels["delete"](query));
						},
						update: function (id, query) {
							return $q.when(api.labels.update(id, query));
						}
					},

					keys: {
						list: function (query) {
							return $q.when(api.keys.list(query));
						},
						get: function (id) {
							return $q.when(api.keys.get(id));
						},
						create: function (key) {
							return $q.when(api.keys.create(key));
						}
					},

					threads: {
						list: function (query) {
							return $q.when(api.threads.list(query));
						},
						get: function (id) {
							return $q.when(api.threads.get(id));
						},
						update: function (id, query) {
							return $q.when(api.threads.update(id, query));
						},
						"delete": function (id) {
							return $q.when(api.threads["delete"](id));
						}
					},

					tokens: {
						getCurrent: function () {
							return $q.when(api.tokens.getCurrent());
						},
						get: function (id) {
							return $q.when(api.tokens.get(id));
						},
						create: function (query) {
							return $q.when(api.tokens.create(query));
						},
						deleteCurrent: function () {
							return $q.when(api.tokens.deleteCurrent());
						},
						"delete": function (id) {
							return $q.when(api.tokens["delete"](id));
						}
					}
				};
			};

			return self;
		};
	};

	angular.module("lavaboom.api", []).provider("LavaboomAPI", createLavaboomAPIProvider("sockjs")).provider("LavaboomHttpAPI", createLavaboomAPIProvider("http"));
}).call(window);