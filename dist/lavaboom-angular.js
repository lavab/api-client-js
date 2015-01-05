(function() {
  var lavaboom;

  lavaboom = angular.module("lavaboom.api");

  lavaboom.factory("LavaboomAPI", function($q) {
    return function(url, token) {
      var api;
      url = url;
      token = token;
      api = Lavaboom();
      this.accounts = {
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
      };
      this.contacts = {
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
      };
      this.emails = {
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
      };
      this.keys = {
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
      };
      this.tokens = {
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
      };
      return this;
    };
  });

}).call(this);
