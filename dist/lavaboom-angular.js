(function() {
  var LavaboomAPIProvider;

  angular.module("lavaboom.api", []).provider("LavaboomAPI", LavaboomAPIProvider = function() {
    var api, authToken, specialToken, url;
    url = null;
    specialToken = null;
    authToken = null;
    api = null;
    this.setSpecialToken = function(newToken) {
      return specialToken = newToken;
    };
    this.setAuthToken = function(newToken) {
      return authToken = newToken;
    };
    this.setURL = function(newURL) {
      return url = newURL;
    };
    this.$get = function($q) {
      var service;
      api = new Lavaboom(url, specialToken);
      api.authToken = authToken;
      service = {
        setAuthToken: function(newToken) {
          return api.authToken = token;
        },
        info: function() {
          return $q(function(resolve, reject) {
            return api.info().then(function(e) {
              return resolve(e);
            })["catch"](function(e) {
              return reject(e);
            });
          });
        },
        accounts: {
          create: {
            invited: function(query) {
              return $q(function(resolve, reject) {
                return api.accounts.create.invited(query).then(function(e) {
                  return resolve(e);
                })["catch"](function(e) {
                  return reject(e);
                });
              });
            },
            classic: function(query) {
              return $q(function(resolve, reject) {
                return api.accounts.create.classic(query).then(function(e) {
                  return resolve(e);
                })["catch"](function(e) {
                  return reject(e);
                });
              });
            }
          },
          reserve: {
            queue: function(query) {
              return $q(function(resolve, reject) {
                return api.accounts.reserve.queue(query).then(function(e) {
                  return resolve(e);
                })["catch"](function(e) {
                  return reject(e);
                });
              });
            },
            username: function(query) {
              return $q(function(resolve, reject) {
                return api.accounts.reserve.username(query).then(function(e) {
                  return resolve(e);
                })["catch"](function(e) {
                  return reject(e);
                });
              });
            }
          },
          get: function(who) {
            return $q(function(resolve, reject) {
              return api.accounts.get(who).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          update: function(who, what) {
            return $q(function(resolve, reject) {
              return api.accounts.update(who, what).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          "delete": function(who) {
            return $q(function(resolve, reject) {
              return api.accounts["delete"](who).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          wipeData: function(whose) {
            return $q(function(resolve, reject) {
              return api.accounts.wipeData(whose).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          }
        },
        attachments: {
          list: function() {
            return $q(function(resolve, reject) {
              return api.attachments.list().then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          create: function(query) {
            return $q(function(resolve, reject) {
              return api.attachments.create(query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          get: function(id) {
            return $q(function(resolve, reject) {
              return api.attachments.get(id).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          update: function(id, query) {
            return $q(function(resolve, reject) {
              return api.attachments.update(id, query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          "delete": function(id) {
            return $q(function(resolve, reject) {
              return api.attachments["delete"](id).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          }
        },
        contacts: {
          list: function() {
            return $q(function(resolve, reject) {
              return api.contacts.list().then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          create: function(query) {
            return $q(function(resolve, reject) {
              return api.contacts.create(query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          get: function(id) {
            return $q(function(resolve, reject) {
              return api.contacts.get(id).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          update: function(id, query) {
            return $q(function(resolve, reject) {
              return api.contacts.update(id, query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          "delete": function(id) {
            return $q(function(resolve, reject) {
              return api.contacts["delete"](id).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          }
        },
        emails: {
          list: function(query) {
            return $q(function(resolve, reject) {
              return api.emails.list(query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          get: function(id) {
            return $q(function(resolve, reject) {
              return api.emails.get(id).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          create: function(query) {
            return $q(function(resolve, reject) {
              return api.emails.create(query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          "delete": function(id) {
            return $q(function(resolve, reject) {
              return api.emails["delete"](id).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          }
        },
        labels: {
          list: function() {
            return $q(function(resolve, reject) {
              return api.labels.list().then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          get: function(query) {
            return $q(function(resolve, reject) {
              return api.labels.get(query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          create: function(query) {
            return $q(function(resolve, reject) {
              return api.labels.create(query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          "delete": function(query) {
            return $q(function(resolve, reject) {
              return api.labels["delete"](query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          update: function(id, query) {
            return $q(function(resolve, reject) {
              return api.labels.update(id, query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          }
        },
        keys: {
          list: function(name) {
            return $q(function(resolve, reject) {
              return api.keys.list(name).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          get: function(id) {
            return $q(function(resolve, reject) {
              return api.keys.get(id).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          create: function(key) {
            return $q(function(resolve, reject) {
              return api.keys.create(key).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          }
        },
        tokens: {
          getCurrent: function() {
            return $q(function(resolve, reject) {
              return api.tokens.getCurrent().then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          get: function(id) {
            return $q(function(resolve, reject) {
              return api.tokens.get(id).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          create: function(query) {
            return $q(function(resolve, reject) {
              return api.tokens.create(query).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          deleteCurrent: function() {
            return $q(function(resolve, reject) {
              return api.tokens.deleteCurrent().then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          },
          "delete": function(id) {
            return $q(function(resolve, reject) {
              return api.tokens["delete"](id).then(function(e) {
                return resolve(e);
              })["catch"](function(e) {
                return reject(e);
              });
            });
          }
        }
      };
      return service;
    };
    return this;
  });

}).call(this);
