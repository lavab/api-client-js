ajax = ->
    return new XMLHttpRequest()  if typeof XMLHttpRequest isnt "undefined"
    versions = [
        "MSXML2.XmlHttp.5.0"
        "MSXML2.XmlHttp.4.0"
        "MSXML2.XmlHttp.3.0"
        "MSXML2.XmlHttp.2.0"
        "Microsoft.XmlHttp"
    ]
    xhr = undefined
    i = 0

    while i < versions.length
        try
            xhr = new ActiveXObject(versions[i])
            break
        i++
    xhr

parseResponseHeaders = (headerStr) ->
    headers = {}
    return headers  unless headerStr
    headerPairs = headerStr.split("\r\n")
    i = 0

    while i < headerPairs.length
        headerPair = headerPairs[i]

        # Can't use split() here because it does the wrong thing
        # if the header value has the string ": " in it.
        index = headerPair.indexOf(": ")
        if index > 0
            key = headerPair.substring(0, index)
            val = headerPair.substring(index + 2)
            headers[key] = val
        i++
    headers

encodeQueryData = (data) ->
    ret = []
    for k, v of data
        ret.push encodeURIComponent(k) + "=" + encodeURIComponent(v)
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
            @queuedMessages = []
            @connected = false

            that = this

            @sockjs.onopen = (e) ->
                that.connected = true
                if that.queuedMessages.length > 0
                    _.forEach that.queuedMessages, (msg) ->
                        that.sockjs.send msg

            @sockjs.onmessage = (e) ->
                msg = JSON.parse(e.data)

                switch msg.type
                    when "response"
                        if that.handlers[msg.id]
                            that.handlers[msg.id](msg)
                    when "delivery"
                        if that.subscriptions and that.subscriptions["delivery"]
                            for callback in that.subscriptions["delivery"]
                                callback(msg)
                    when "receipt"
                        if that.subscriptions and that.subscriptions["receipt"]
                            for callback in that.subscriptions["receipt"]
                                callback(msg)

        @accounts.that = this
        @accounts.create.that = this
        @contacts.that = this
        @emails.that = this
        @keys.that = this
        @labels.that = this
        @tokens.that = this
        @threads.that = this

    _sockReq: (method, path, data, options) ->
        @counter++

        promise =
            onSuccess: []
            onFailure: []
            then: (callback) ->
                @onSuccess.push callback
                return this
            catch: (callback) ->
                @onFailure.push callback
                return this

        @handlers[@counter.toString()] = (data) ->
            if data.status >= 200 and data.status < 300
                _.forEach promise.onSuccess, (val) ->
                    data.body = JSON.parse data.body
                    val data
            else
                _.forEach promise.onFailure, (val) ->
                    data.body = JSON.parse data.body
                    val data

        if not options
            options = {}

        if not options.headers
            options.headers = {}

        if method.toUpperCase() is "POST" or method.toUpperCase() is "PUT"
            options.headers["Content-Type"] = "application/json;charset=utf-8"

        msg = JSON.stringify
            id: @counter.toString()
            type: "request"
            method: method
            path: path
            body: JSON.stringify(data)
            headers: options.headers

        if @connected
            @sockjs.send msg
        else
            @queuedMessages.push msg

        return promise

    subscribe: (name, callback) ->
        if not @sockjs
            console.error "Not using SockJS"
            return false

        if not @authToken
            console.error "Not authenticated"
            return false

        if not @subscriptions
            @sockjs.send JSON.stringify
                "type": "subscribe"
                "token": @authToken
            @subscriptions = {}

        if not @subscriptions[name]
            @subscriptions[name] = []

        @subscriptions[name].push callback

    unsubscribe: (name, callback) ->
        if not @sockjs
            console.error "Not using SockJS"
            return false

        if not @authToken
            console.error "Not authenticated"
            return false

        if not @subscriptions
            return false

        if not @subscriptions[name]
            return false

        for index, cb in @subscriptions[name]
            if cb == callback
                @subscriptions[name].splice index, 1
                return true

        return false

    ajax: (method, url, data, options) ->
        promise =
            onSuccess: []
            onFailure: []
            then: (callback) ->
                @onSuccess.push callback
                return this
            catch: (callback) ->
                @onFailure.push callback
                return this

        x = ajax()
        x.open method, url, true
        x.onreadystatechange = ->
            if x.readyState isnt 4
                return

            body = undefined
            try
                body = JSON.parse(x.responseText)
            catch error
                body = error

            if x.status >= 200 and x.status < 300
                _.forEach promise.onSuccess, (val) ->
                    val 
                        body: body
                        status: x.status
                        headers: parseResponseHeaders(x.getAllResponseHeaders())
            else
                _.forEach promise.onFailure, (val) ->
                    val 
                        body: body
                        status: x.status
                        headers: parseResponseHeaders(x.getAllResponseHeaders())

        if method is "POST" or method is "PUT"
            x.setRequestHeader "Content-Type", "application/json;charset=utf-8"

        for key of options.headers
            x.setRequestHeader key, options.headers[key]

        x.send data

        promise

    get: (path, data, options) ->
        if not options
            options = {}

        if @authToken and not options.headers
            options.headers = {}
            options.headers["Authorization"] = "Bearer " + @authToken

        if data isnt undefined and data.length and data.length isnt 0
            query = []
            for key of data
                query.push encodeURIComponent(key) + "=" + encodeURIComponent(data[key])
            path += "?" + query.join("&")

        if @sockjs
            return @_sockReq "get", path, null, options

        @ajax "GET", @url + path, null, options

    post: (path, data, options) ->
        if not options
            options = {}

        if @authToken and not options.headers
            options.headers = {}
            options.headers["Authorization"] = "Bearer " + @authToken

        if @sockjs
            return @_sockReq "post", path, data, options

        @ajax "POST", @url + path, JSON.stringify(data), options

    put: (path, data, options) ->
        if not options
            options = {}

        options.dataType = "json"
        options.responseType = "json"

        if @authToken and not options.headers
            options.headers = {}
            options.headers["Authorization"] = "Bearer " + @authToken

        if @sockjs
            return @_sockReq "put", path, data, options

        @ajax "PUT", @url + path, JSON.stringify(data), options

    delete: (path, data, options) ->
        if not options
            options = {}

        if @authToken and not options.headers
            options.headers = {}
            options.headers["Authorization"] = "Bearer " + @authToken

        if data isnt undefined and data.length and data.length isnt 0
            query = []
            for key of data
                query.push encodeURIComponent(key) + "=" + encodeURIComponent(data[key])
            path += "?" + query.join("&")

        if @sockjs
            return @_sockReq "get", path, null, options

        @ajax "DELETE", @url + path, null, options

    info: () ->
        @get "/"

    accounts:
        create:
            register: (query) ->
                @that.post "/accounts",
                    username: query.username
                    alt_email: query.alt_email
            verify: (query) ->
                @that.post "/accounts",
                    username: query.username
                    invite_code: query.invite_code
            setup: (query) ->
                @that.post "/accounts",
                    username: query.username
                    invite_code: query.invite_code
                    password: query.password
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

    threads:
        list: (query) ->
            url = "/threads"
            if query and _.size(query) > 0
                url += "?" + encodeQueryData(query)

            @that.get url
        get: (id) ->
            @that.get "/threads/" + id
        update: (query) ->
            @that.post "/threads",
                labels: query.labels
        delete: (id) ->
            @that.delete "/threads/" + id

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
