`
//= require vendor/qwest.min.js
`

encodeQueryData = (data) ->
    ret = []
    for d in data
        ret.push encodeURIComponent(d) + "=" + encodeURIComponent(data[d])
    ret.join "&"

class @Lavaboom
    constructor: (url, token) ->
        if not url
            url = "https://api.lavaboom.com"
        @url = url
        @token = token

        if typeof SockJS isnt 'undefined'
            @sockjs = new SockJS url + "/ws"
            @counter = 0
            @handlers = {}

            that = this

            @sockjs.onmessage = (e) ->
                msg = JSON.parse(e.data)

                if handler[msg.id]
                    handler[msg.id](msg)

        @accounts.that = this
        @accounts.create.that = this
        @accounts.reserve.that = this
        @contacts.that = this
        @emails.that = this
        @keys.that = this
        @labels.that = this
        @tokens.that = this

    _sockReq: (method, path, data, options) ->
        @counter++

        promise =
            onSuccess: []
            onFailure: []
            then: (callback) ->
                onSuccess.push callback
            catch: (callback) ->
                onFailure.push callback

        @handlers[@counter.toString()] = (data) ->
            if data.status >= 200 and data.status < 300
                _.forEach promise.onSuccess, (val) ->
                    val JSON.parse data.body
            else
                _.forEach promise.onFailure, (val) ->
                    val JSON.parse data.body

        @sockjs.send JSON.stringify
            id: @counter.toString()
            type: "request"
            method: method
            path: path
            body: data
            headers: options.headers and options.headers or null

    get: (path, data, options) ->
        if not options
            options = {}

        options.responseType = "json"

        if @authToken and not options.headers
            options.headers = {}
            options.headers["Authorization"] = "Bearer " + @authToken

        if @sockjs
            return @_sockReq "get", path, data, options

        qwest.get @url + path, data, options

    post: (path, data, options) ->
        if not options
            options = {}

        options.responseType = "json"

        if @authToken and not options.headers
            options.headers = {}
            options.headers["Authorization"] = "Bearer " + @authToken

        if @sockjs
            return @_sockReq "post", path, data, options

        qwest.post @url + path, data, options

    put: (path, data, options) ->
        if not options
            options = {}

        options.responseType = "json"

        if @authToken and not options.headers
            options.headers = {}
            options.headers["Authorization"] = "Bearer " + @authToken

        if @sockjs
            return @_sockReq "put", path, data, options

        qwest.put @url + path, data, options

    delete: (path, data, options) ->
        if not options
            options = {}

        options.responseType = "json"

        if @authToken and not options.headers
            options.headers = {}
            options.headers["Authorization"] = "Bearer " + @authToken

        if @sockjs
            return @_sockReq "delete", path, data, options

        qwest.delete @url + path, data, options

    info: () ->
        @get "/"

    accounts:
        create:
            invited: (query) ->
                @that.post "/accounts",
                    username: query.username
                    password: query.password
                    token: query.token
            classic: (query) ->
                @that.post "/accounts",
                    username: query.username
                    password: query.password
                    alt_email: query.email
        reserve:
            queue: (query) ->
                @that.post "/accounts",
                    alt_email: query.email
            username: (query) ->
                @that.post "/accounts",
                    username: query.username
                    alt_email: query.email
        get: (who) ->
            @that.get "/accounts/" + who
        update: (who, what) ->
            @that.put "/accounts/" + who, what
        delete: (who) ->
            @that.delete "/accounts/" + who
        wipeData: (who) ->
            @that.post "/accounts/" + who "/wipe-data"

    attachments:
        list: () ->
            @that.get "/attachments"
        create: (query) ->
            @that.post "/attachments",
                data: query.data
                name: query.name
                encoding: query.encoding
                version_major: query.version_major
                version_minor: query.version_minor
                pgp_fingerprints: query.pgp_fingerprints
        get: (id) ->
            @that.get "/attachments/" + id
        update: (id, query) ->
            @that.put "/attachments/" + id,
                data: query.data
                name: query.name
                encoding: query.encoding
                version_major: query.version_major
                version_minor: query.version_minor
                pgp_fingerprints: query.pgp_fingerprints
        delete: (id) ->
            @that.delete "/attachments/" + id

    contacts:
        list: () ->
            @that.get "/contacts"
        create: (query) ->
            @that.post "/contacts",
                data: query.data
                name: query.name
                encoding: query.encoding
                version_major: query.version_major
                version_minor: query.version_minor
                pgp_fingerprints: query.pgp_fingerprints
        get: (id) ->
            @that.get "/contacts/" + id
        update: (id, query) ->
            @that.put "/contacts/" + id,
                data: query.data
                name: query.name
                encoding: query.encoding
                version_major: query.version_major
                version_minor: query.version_minor
                pgp_fingerprints: query.pgp_fingerprints
        delete: (id) ->
            @that.delete "/contacts/" + id

    emails:
        list: (query) ->
            url = "/emails"
            if query and _.size(query) > 0
                url += "?" + encodeQueryData(query)

            @that.get url
        get: (id) ->
            @that.get "/emails/" + id
        create: (query) ->
            @that.post "/emails",
                to: query.to
                bcc: query.bcc
                reply_to: query.reply_to
                thread_id: query.thread_id
                subject: query.subject
                is_encrypted: query.is_encrypted
                body: query.body
                body_version_major: query.body_version_major
                body_version_minor: query.body_version_minor
                preview: query.preview
                preview_version_major: query.preview_version_major
                preview_version_minor: query.preview_version_minor
                attachments: query.attachments
                pgp_fingerprints: query.pgp_fingerprints
        delete: (id) ->
            @that.delete "/emails/" + id

    keys:
        list: (name) ->
            @that.get "/keys?user=" + name
        get: (id) ->
            @that.get "/keys/" + encodeURIComponent(id)
        create: (key) ->
            @that.post "/keys",
                key: key

    labels:
        list: () ->
            @that.get "/labels"
        get: (id) ->
            @that.get "/labels/" + id
        create: (query) ->
            @that.post "/labels",
                name: query.name
        delete: (id) ->
            @that.delete "/labels/" + id
        update: (id, query) ->
            @that.put "/labels/" + id,
                name: query.name

    tokens:
        getCurrent: () ->
            @that.get "/tokens"
        get: (id) ->
            @that.get "/tokens/" + id
        create: (query) ->
            @that.post "/tokens",
                username: query.username
                password: query.password
                type: query.type
                token: query.token
        deleteCurrent: () ->
            @that.delete "/tokens"
        delete: (id) ->
            @that.delete "/tokens/" + id
