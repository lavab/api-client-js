angular.module("lavaboom.api", []).provider "LavaboomAPI", LavaboomAPIProvider = () ->
    url = null
    token = null
    api = null

    this.setSpecialToken = (newToken) ->
        token = newToken

    this.setURL = (newURL) ->
        url = newURL

    this.$get = ($q) ->
        api = new Lavaboom(url, token)

        console.log(Lavaboom)
        console.log(api)

        service =
            accounts:
                create:
                    invited: (query) ->
                        $q (resolve, reject) ->
                            api.accounts.create.invited(query)
                                .then (e) ->
                                    resolve(e)
                                .catch (e) ->
                                    reject(e)
                    classic: (query) ->
                        $q (resolve, reject) ->
                            api.accounts.create.classic(query)
                                .then (e) ->
                                    resolve(e)
                                .catch (e) ->
                                    reject(e)
                reserve:
                    queue: (query) ->
                        $q (resolve, reject) ->
                            api.accounts.reserve.queue(query)
                                .then (e) ->
                                    resolve(e)
                                .catch (e) ->
                                    reject(e)
                    username: (query) ->
                        $q (resolve, reject) ->
                            api.accounts.reserve.username(query)
                                .then (e) ->
                                    resolve(e)
                                .catch (e) ->
                                    reject(e)
                get: (who) ->
                    $q (resolve, reject) ->
                        api.accounts.get(who)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                update: (who, what) ->
                    $q (resolve, reject) ->
                        api.accounts.update(who, what)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                delete: (who) ->
                    $q (resolve, reject) ->
                        api.accounts.delete(who)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                wipeData: (whose) ->
                    $q (resolve, reject) ->
                        api.accounts.wipeData(whose)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
            contacts:
                list: () ->
                    $q (resolve, reject) ->
                        api.contacts.list()
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                create: (query) ->
                    $q (resolve, reject) ->
                        api.contacts.create(query)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                get: (id) ->
                    $q (resolve, reject) ->
                        api.contacts.get(id)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                update: (id, query) ->
                    $q (resolve, reject) ->
                        api.contacts.update(id, query)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                delete: (id) ->
                    $q (resolve, reject) ->
                        api.contacts.delete(id)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
            emails:
                list: (query) ->
                    $q (resolve, reject) ->
                        api.emails.list(query)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                get: (id) ->
                    $q (resolve, reject) ->
                        api.emails.get(id)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                create: (query) ->
                    $q (resolve, reject) ->
                        api.emails.create(query)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                delete: (id) ->
                    $q (resolve, reject) ->
                        api.emails.delete(id)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
            keys:
                list: (name) ->
                    $q (resolve, reject) ->
                        api.keys.list(name)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                get: (id) ->
                    $q (resolve, reject) ->
                        api.keys.get(id)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                create: (key) ->
                    $q (resolve, reject) ->
                        api.keys.create(key)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
            tokens:
                getCurrent: () ->
                    $q (resolve, reject) ->
                        api.tokens.getCurrent()
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                get: (id) ->
                    $q (resolve, reject) ->
                        api.tokens.get(id)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                create: (query) ->
                    $q (resolve, reject) ->
                        api.tokens.create(query)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                deleteCurrent: () ->
                    $q (resolve, reject) ->
                        api.tokens.deleteCurrent()
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)
                delete: (id) ->
                    $q (resolve, reject) ->
                        api.tokens.delete(id)
                            .then (e) ->
                                resolve(e)
                            .catch (e) ->
                                reject(e)

        return service

    return this
