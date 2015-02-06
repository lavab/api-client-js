/* jshint esnext: true */
/* global angular */
/* global Lavaboom */

(function() {
    angular.module("lavaboom.api", []).provider("LavaboomAPI", function LavaboomAPIProvider() {
        // Define provider's scope
        let self = this;

        // LavaboomAPI definition
        self.$get = function($q, $rootScope) {
            // Initialize a new API token
            self.api = new Lavaboom(self.url, self.specialToken);

            if (self.authToken) {
                self.api.authToken = self.authToken;
            }

            // Service definition
            return {
                setAuthToken: function(newToken) {
                    self.authToken = newToken;
                    self.api.authToken = newToken;
                },

                // Subscription wrappers
                subscribe: function(name, callback) {
                    return self.api.subscribe(name, function(e) {
                        $rootScope.$apply(function() {
                            callback(e);
                        });
                    });
                },
                unsubscribe: function(name, callback) {
                    return self.api.unsubscribe(name, function(e) {
                        $rootScope.$apply(function() {
                            callback(e);
                        });
                    });
                },

                // API index
                info: function() {
                    return $q.when(self.api.info());
                },

                // Accounts
                accounts: {
                    create: {
                        register: function(query) {
                            return $q.when(self.api.accounts.create.register(query));
                        },
                        verify: function(query) {
                            return $q.when(self.api.accounts.create.verify(query));
                        },
                        setup: function(query) {
                            return $q.when(self.api.accounts.create.setup(query));
                        }
                    },
                    get: function(who) {
                        return $q.when(self.api.accounts.get(who));
                    },
                    update: function(who, what) {
                        return $q.when(self.api.accounts.update(who, what));
                    },
                    delete: function(who) {
                        return $q.when(self.api.accounts.delete(who));
                    },
                    wipeData: function(whose) {
                        return $q.when(self.api.accounts.wipeData(whose));
                    }
                },

                // Attachments
                attachments: {
                    list: function() {
                        return $q.when(self.api.attachments.list());
                    },
                    create: function(query) {
                        return $q.when(self.api.attachments.create(query));
                    },
                    get: function(id) {
                        return $q.when(self.api.attachments.get(id));
                    },
                    update: function(id, query) {
                        return $q.when(self.api.attachments.update(id, query));
                    },
                    delete: function(id) {
                        return $q.when(self.api.attachments.delete(id));
                    }
                },

                // Contacts
                contacts: {
                    list: function() {
                        return $q.when(self.api.contacts.list());
                    },
                    create: function(query) {
                        return $q.when(self.api.contacts.create(query));
                    },
                    get: function(id) {
                        return $q.when(self.api.contacts.get(id));
                    },
                    update: function(id, query) {
                        return $q.when(self.api.contacts.update(id, query));
                    },
                    delete: function(id) {
                        return $q.when(self.api.contacts.delete(id));
                    }
                },

                // Emails
                emails: {
                    list: function(query) {
                        return $q.when(self.api.emails.list(query));
                    },
                    get: function(id) {
                        return $q.when(self.api.emails.get(id));
                    },
                    create: function(query) {
                        return $q.when(self.api.emails.create(query));
                    },
                    delete: function(id) {
                        return $q.when(self.api.emails.delete(id));
                    }
                },

                // Labels
                labels: {
                    list: function() {
                        return $q.when(self.api.labels.list());
                    },
                    get: function(query) {
                        return $q.when(self.api.labels.get(query));
                    },
                    create: function(query) {
                        return $q.when(self.api.labels.create(query));
                    },
                    delete: function(query) {
                        return $q.when(self.api.labels.delete(query));
                    },
                    update: function(id, query) {
                        return $q.when(self.api.labels.update(id, query));
                    }
                },

                // Keys
                keys: {
                    list: function(query) {
                        return $q.when(self.api.keys.list(query));
                    },
                    get: function(id) {
                        return $q.when(self.api.keys.get(id));
                    },
                    create: function(key) {
                        return $q.when(self.api.keys.create(key));
                    }
                },

                // Threads
                threads: {
                    list: function(query) {
                        return $q.when(self.api.threads.list(query));
                    },
                    get: function(id) {
                        return $q.when(self.api.threads.get(id));
                    },
                    update: function(id, query) {
                        return $q.when(self.api.threads.update(id, query));
                    },
                    delete: function(id) {
                        return $q.when(self.api.threads.delete(id));
                    }
                },

                // Tokens
                tokens: {
                    getCurrent: function() {
                        return $q.when(self.api.tokens.getCurrent());
                    },
                    get: function(id) {
                        return $q.when(self.api.tokens.get(id));
                    },
                    create: function(query) {
                        return $q.when(self.api.tokens.create(query));
                    },
                    deleteCurrent: function() {
                        return $q.when(self.api.tokens.deleteCurrent());
                    },
                    delete: function(id) {
                        return $q.when(self.api.tokens.delete(id));
                    }
                }
            };
        };

        return self;
    });
})();