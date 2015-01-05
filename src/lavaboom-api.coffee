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

    get: (path, data, options) ->
        if @authToken
            if not options
                options = {}

            if not options.headers
                options.headers = {}

            options.headers["Authorization"] = "Bearer " + authToken
        qwest.get @url + path, data, options
    post: (path, data, options) ->
        qwest.get @url + path, data, options
    put: (path, data, options) ->
        qwest.get @url + path, data, options
    delete: (path, data, options) ->
        qwest.get @url + path, data, options

    accounts:
        create:
            invited: (query) ->
                @post "/accounts",
                    username: query.username
                    password: query.password
                    token: query.token
            classic: (query) ->
                @post "/accounts",
                    username: query.username
                    password: query.password
                    alt_email: query.email
        reserve:
            queue: (email) ->
                @post "/accounts",
                    alt_email: email
            username: (username, email) ->
                @post "/accounts",
                    username: username
                    alt_email: email
        get: (who) ->
            @get "/accounts/" + who
        update: (who, what) ->
            @put "/accounts/" + who, what
        delete: (who) ->
            @delete "/accounts/" + who
        wipeData: (who) ->
            @post "/accounts/" + who "/wipe-data"

    contacts:
        list: () ->
            @get "/contacts"
        create: (query) ->
            @post "/contacts",
                data: query.data
                name: query.name
                encoding: query.encoding
                version_major: query.version_major
                version_minor: query.version_minor
                pgp_fingerprints: query.pgp_fingerprints
        get: (id) ->
            @get "/contacts/" + id
        update: (id, query) ->
            @put "/contacts/" + id,
                data: query.data
                name: query.name
                encoding: query.encoding
                version_major: query.version_major
                version_minor: query.version_minor
                pgp_fingerprints: query.pgp_fingerprints
        delete: (id) ->
            @delete "/contacts/" + id

    emails:
        list: (query) ->
            # sort
            # offset
            # limit
            url = "/emails"
            if query and _.size(query) > 0
                url += "?" + encodeQueryData(query)

            @get url
        get: (id) ->
            @get "/emails/" + id
        create: (query) ->
            @post "/emails",
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
            @delete "/emails/" + id

    keys:
        list: (name) ->
            @get "/keys?user=" + name
        get: (id) ->
            @get "/keys/" + encodeURIComponent(id)
        create: (key) ->
            @post "/keys",
                key: key

    tokens:
        getCurrent: () ->
            @get "/tokens"
        get: (id) ->
            @get "/tokens/" + id
        create: (query) ->
            @post "/tokens",
                username: query.username
                password: query.password
                type: query.type
                token: query.token
        deleteCurrent: () ->
            @delete "/tokens"
        delete: (id) ->
            @delete "/tokens/" + id
