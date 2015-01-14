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
            @queuedMessages = []
            @connected = false

            that = this

            @sockjs.onconnect = (e) ->
                that.connected = true
                if that.queuedMessages.length > 0
                    _.forEach that.queuedMessages, (msg) ->
                        that.sockjs.send msg

            @sockjs.onmessage = (e) ->
                msg = JSON.parse(e.data)

                if that.handlers[msg.id]
                    that.handlers[msg.id](msg)

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
                @onSuccess.push callback
                return this
            catch: (callback) ->
                @onFailure.push callback
                return this

        @handlers[@counter.toString()] = (data) ->
            if data.status >= 200 and data.status < 300
                _.forEach promise.onSuccess, (val) ->
                    val JSON.parse data.body
            else
                _.forEach promise.onFailure, (val) ->
                    val JSON.parse data.body

        msg = JSON.stringify
            id: @counter.toString()
            type: "request"
            method: method
            path: path
            body: data
            headers: options.headers and options.headers or null

        if @connected
            @sockjs.send msg
        else
            @queuedMessages.push msg

        return promise

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

            if x.status >= 200 and x.status < 300
                _.forEach promise.onSuccess, (val) ->
                    val 
                        body: JSON.parse(x.responseText)
                        status: x.status
                        headers: parseResponseHeaders(x.getAllResponseHeaders())
            else
                _.forEach promise.onFailure, (val) ->
                    val 
                        body: JSON.parse(x.responseText)
                        status: x.status
                        headers: parseResponseHeaders(x.getAllResponseHeaders())

        if method is "POST" or method is "PUT"
            x.setRequestHeader "Content-Type", "application/json;charset=utf-8"

        for key of options.headers
            x.setRequestHeader key, options.headers[key]

        x.send(data)

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
