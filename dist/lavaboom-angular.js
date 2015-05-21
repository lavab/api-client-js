/* jshint esnext: true */
/* global angular */
/* global Lavaboom */

'use strict';

(function () {
	var createLavaboomAPIProvider = function createLavaboomAPIProvider(transport) {
		return function LavaboomAPIProvider() {
			var self = this;

			self.url = null;
			self.authToken = null;
			self.specialToken = null;

			var api = null;

			self.$get = /*@ngInject*/["$q", "$rootScope", function ($q, $rootScope) {
				if (!api) api = Lavaboom.getInstance(self.url, self.specialToken, transport);

				if (self.authToken) api.authToken = self.authToken;

				return {
					setAuthToken: function setAuthToken(newToken) {
						self.authToken = newToken;
						api.authToken = newToken;
					},

					connect: function connect(opts) {
						return $q.when(api.connect(opts));
					},

					isConnected: function isConnected() {
						return api.isConnected();
					},

					subscribe: function subscribe(name, callback) {
						return api.subscribe(name, function (e) {
							$rootScope.$apply(function () {
								callback(e);
							});
						});
					},

					unSubscribe: function unSubscribe(name, callback) {
						return api.unSubscribe(name, function (e) {
							$rootScope.$apply(function () {
								callback(e);
							});
						});
					},

					info: function info() {
						return $q.when(api.info());
					},

					addresses: {
						get: function get() {
							return $q.when(api.addresses.get());
						}
					},

					accounts: {
						create: {
							register: function register(query) {
								return $q.when(api.accounts.create.register(query));
							},
							verify: function verify(query) {
								return $q.when(api.accounts.create.verify(query));
							},
							setup: function setup(query) {
								return $q.when(api.accounts.create.setup(query));
							}
						},
						get: function get(who) {
							return $q.when(api.accounts.get(who));
						},
						update: function update(who, what) {
							return $q.when(api.accounts.update(who, what));
						},
						'delete': function _delete(who) {
							return $q.when(api.accounts['delete'](who));
						},
						wipeData: function wipeData(whose) {
							return $q.when(api.accounts.wipeData(whose));
						},
						startOnboarding: function startOnboarding(who) {
							return $q.when(api.accounts.startOnboarding(who));
						}
					},

					files: {
						list: function list(query) {
							return $q.when(api.files.list(query));
						},
						create: function create(query) {
							return $q.when(api.files.create(query));
						},
						get: function get(id) {
							return $q.when(api.files.get(id));
						},
						update: function update(id, query) {
							return $q.when(api.files.update(id, query));
						},
						'delete': function _delete(id) {
							return $q.when(api.files['delete'](id));
						}
					},

					contacts: {
						list: function list() {
							return $q.when(api.contacts.list());
						},
						create: function create(query) {
							return $q.when(api.contacts.create(query));
						},
						get: function get(id) {
							return $q.when(api.contacts.get(id));
						},
						update: function update(id, query) {
							return $q.when(api.contacts.update(id, query));
						},
						'delete': function _delete(id) {
							return $q.when(api.contacts['delete'](id));
						}
					},

					emails: {
						list: function list(query) {
							return $q.when(api.emails.list(query));
						},
						get: function get(id) {
							return $q.when(api.emails.get(id));
						},
						create: function create(query) {
							return $q.when(api.emails.create(query));
						},
						'delete': function _delete(id) {
							return $q.when(api.emails['delete'](id));
						}
					},

					labels: {
						list: function list() {
							return $q.when(api.labels.list());
						},
						get: function get(query) {
							return $q.when(api.labels.get(query));
						},
						create: function create(query) {
							return $q.when(api.labels.create(query));
						},
						'delete': function _delete(query) {
							return $q.when(api.labels['delete'](query));
						},
						update: function update(id, query) {
							return $q.when(api.labels.update(id, query));
						}
					},

					keys: {
						list: function list(query) {
							return $q.when(api.keys.list(query));
						},
						get: function get(id) {
							return $q.when(api.keys.get(id));
						},
						create: function create(key) {
							return $q.when(api.keys.create(key));
						}
					},

					threads: {
						list: function list(query) {
							return $q.when(api.threads.list(query));
						},
						get: function get(id) {
							return $q.when(api.threads.get(id));
						},
						update: function update(id, query) {
							return $q.when(api.threads.update(id, query));
						},
						'delete': function _delete(id) {
							return $q.when(api.threads['delete'](id));
						}
					},

					tokens: {
						getCurrent: function getCurrent() {
							return $q.when(api.tokens.getCurrent());
						},
						get: function get(id) {
							return $q.when(api.tokens.get(id));
						},
						create: function create(query) {
							return $q.when(api.tokens.create(query));
						},
						deleteCurrent: function deleteCurrent() {
							return $q.when(api.tokens.deleteCurrent());
						},
						'delete': function _delete(id) {
							return $q.when(api.tokens['delete'](id));
						}
					}
				};
			}];

			return self;
		};
	};

	angular.module('lavaboom.api', []).provider('LavaboomAPI', createLavaboomAPIProvider('sockjs')).provider('LavaboomHttpAPI', createLavaboomAPIProvider('http'));
}).call(window);