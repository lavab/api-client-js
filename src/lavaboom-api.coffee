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
            url = "http://api.lavaboom.com"
        @url = url
        @token = token

        @accounts.that = this
        @accounts.create.that = this
        @accounts.reserve.that = this
        @contacts.that = this
        @emails.that = this
        @keys.that = this
        @tokens.that = this

    get: (path, data, options) ->
        if not options
            options = {}

        options.responseType = "json"

        if @authToken and not options.headers
            options.headers = {}
            options.headers["Authorization"] = "Bearer " + authToken

        qwest.get @url + path, data, options

    post: (path, data, options) ->
        if not options
            options = {}

        options.responseType = "json"

        qwest.post @url + path, data, options

    put: (path, data, options) ->
        if not options
            options = {}

        options.responseType = "json"

        qwest.put @url + path, data, options

    delete: (path, data, options) ->
        if not options
            options = {}

        options.responseType = "json"

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
