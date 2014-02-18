###
Copyright (c) 1997-2014, SalesLogix, NA., LLC. All rights reserved.
###

### jshint ignore:start ###

###*
 * @class Mobile.SalesLogix.Application
 *
 * @extends Sage.Platform.Mobile.Application
 * @requires Sage.Platform.Mobile.ErrorManager
 * @requires Mobile.SalesLogix.Environment
 * @requires moment
 *
###
define 'Mobile/SalesLogix/Application', [
    'dojo/_base/window'
    'dojo/_base/declare'
    'dojo/_base/array'
    'dojo/_base/connect'
    'dojo/json'
    'dojo/_base/lang'
    'dojo/has'
    'dojo/string'
    'dojo/text!Mobile/SalesLogix/DefaultMetrics.txt'
    'Sage/Platform/Mobile/ErrorManager'
    'Mobile/SalesLogix/Environment'
    'Sage/Platform/Mobile/Application'
    'dojo/sniff'
    'dojox/mobile/sniff'
    'moment'
],
(
    win
    declare
    array
    connect
    json
    lang
    has
    string
    DefaultMetrics
    ErrorManager
    environment
    Application
    sniff
    mobileSniff
    moment
) ->
    declare 'Mobile.SalesLogix.Application', [Application], {
        navigationState: null
        rememberNavigationState: true
        enableUpdateNotification: false
        multiCurrency: false
        speedSearch:
            includeStemming: true
            includePhonic: true
            includeThesaurus: false
            useFrequentFilter: false
            searchType: 1
        enableCaching: true
        userDetailsQuerySelect: ['UserName', 'UserInfo/UserName', 'UserInfo/FirstName', 'UserInfo/LastName', 'DefaultOwner/OwnerDescription']
        userOptionsToRequest: [
            'General;InsertSecCodeID'
            'General;Currency'
            'Calendar;DayStartTime'
            'Calendar;WeekStart'
            'ActivityMeetingOptions;AlarmEnabled'
            'ActivityMeetingOptions;AlarmLead'
            'ActivityMeetingOptions;Duration'
            'ActivityPhoneOptions;AlarmEnabled'
            'ActivityPhoneOptions;AlarmLead'
            'ActivityPhoneOptions;Duration'
            'ActivityToDoOptions;AlarmEnabled'
            'ActivityToDoOptions;AlarmLead'
            'ActivityToDoOptions;Duration'
            'ActivityPersonalOptions;AlarmEnabled'
            'ActivityPersonalOptions;AlarmLead'
            'ActivityPersonalOptions;Duration'
        ]
        systemOptionsToRequest: [
            'BaseCurrency'
            'MultiCurrency'
            'ChangeOpportunityRate'
            'LockOpportunityRate'
        ]
        serverVersion:
            'major': 8
            'minor': 0
            'revision': 0
        mobileVersion:
            'major': 3
            'minor': 0
            'revision': 2
        versionInfoText: 'Mobile v${0}.${1}.${2} / Saleslogix v${3} platform'
        init: ->
            if has('ie') && has('ie') < 9
                window.location.href = 'unsupported.html'
            @inherited(arguments)
            @_loadNavigationState()
            @_loadPreferences()
        initConnects: ->
            @inherited(arguments)
            @_connects.push(connect.connect(window.applicationCache, 'updateready', @, @_checkForUpdate)) if window.applicationCache
        onSetOrientation: (value) ->
            App.snapper?.close()
        _viewTransitionTo: (view) ->
            @inherited(arguments)
            @_checkSaveNavigationState()
        _checkSaveNavigationState: ->
            if @rememberNavigationState != false
                @_saveNavigationState()
        _checkForUpdate: ->
            applicationCache = window.applicationCache
            if applicationCache && @enableUpdateNotification
                if applicationCache.status == applicationCache.UPDATEREADY
                    @_notifyUpdateAvailable()
            return
        _notifyUpdateAvailable: ->
            @bars?.updatebar?.show()
        _saveNavigationState: ->
            try
                window.localStorage?.setItem('navigationState', json.stringify(ReUI.context.history))
        hasMultiCurrency: ->
            # Check if the configuration specified multiCurrency, this will override the dynamic check.
            # A configuration is not ideal, and we should refactor the edit view to process the layout when it first recieves its data,
            # instead of on startup. We cannot check App.context data that was loaded after login when the startup method is used.
            @multiCurrency == true
        canLockOpportunityRate: ->
            @context?.systemOptions?.LockOpportunityRate == 'True'
        canChangeOpportunityRate: ->
            @context?.systemOptions?.ChangeOpportunityRate == 'True'
        getMyExchangeRate: ->
            results = {code: '', rate: 1}

            if @hasMultiCurrency() &&
            @context &&
            @context['exchangeRates'] &&
            @context['userOptions'] &&
            @context['userOptions']['General:Currency']

                myCode = @context['userOptions']['General:Currency']
                myRate = @context['exchangeRates'][myCode]
                lang.mixin(results, {code: myCode, rate: myRate})

            return results
        getBaseExchangeRate: ->
            results = {code: '', rate: 1}

            if @hasMultiCurrency() &&
            @context &&
            @context['exchangeRates'] &&
            @context['systemOptions'] &&
            @context['systemOptions']['BaseCurrency']

                baseCode = @context['systemOptions']['BaseCurrency']
                baseRate = @context['exchangeRates'][baseCode]
                lang.mixin(results, {code: baseCode, rate: baseRate})

            return results
        getCurrentOpportunityExchangeRate: ->
            results = {code: '', rate: 1}

            found = @queryNavigationContext (o) ->
                return (/^(opportunities)$/).test(o.resourceKind) && o.key

            found = found?.options

            if found
                rate = found.ExchangeRate
                code = found.ExchangeRateCode
                lang.mixin(results, {code: code, rate: rate})

            return results
        run: ->
            @inherited(arguments)

            if App.isOnline() || !App.enableCaching
                @handleAuthentication()
            else
                # todo: always navigate to home when offline? data may not be available for restored state.
                @navigateToHomeView()

            if @enableUpdateNotification
                @_checkForUpdate()
        onAuthenticateUserSuccess: (credentials, callback, scope, result) ->
            user =
                '$key': lang.trim(result['response']['userId'])
                '$descriptor': result['response']['prettyName']
                'UserName': result['response']['userName']

            @context['user'] = user
            @context['roles'] = result['response']['roles']
            @context['securedActions'] = result['response']['securedActions']

            if @context['securedActions']
                array.forEach(@context['securedActions'], (item) ->
                    @[item] = true
                @context['userSecurity'] = {})
            else
                # downgrade server version as only 8.0 has `securedActions` as part of the
                # `getCurrentUser` response.
                @serverVersion =
                    'major': 7
                    'minor': 5
                    'revision': 4

            if credentials.remember
                try
                    window.localStorage?.setItem('credentials', Base64.encode(json.stringify({
                        username: credentials.username,
                        password: credentials.password || ''
                    })))

            callback?.call(scope || @, {user: user})
        onAuthenticateUserFailure: (callback, scope, response, ajax) ->
            service = @getService()
            service?.setUserName(false)
            service?.setPassword(false)

            callback?.call(scope || @, {response: response})
        authenticateUser: (credentials, options) ->
            service = @getService()
                ?.setUserName(credentials.username)
                ?.setPassword(credentials.password || '')

            request = new Sage.SData.Client.SDataServiceOperationRequest(service)
                .setContractName('system')
                .setOperationName('getCurrentUser')

            request.execute({}, {
                success: lang.hitch(@, @onAuthenticateUserSuccess, credentials, options.success, options.scope), # @onAuthenticateUserSuccess.createDelegate(this, [credentials, options.success, options.scope], true),
                failure: lang.hitch(@, @onAuthenticateUserFailure, options.failure, options.scope), # @onAuthenticateUserFailure.createDelegate(this, [options.failure, options.scope], true),
                aborted: lang.hitch(@, @onAuthenticateUserFailure, options.failure, options.scope) # @onAuthenticateUserFailure.createDelegate(this, [options.aborted, options.scope], true)
            })
        hasAccessTo: (security) ->
            if !security
                return true

            user = @context['user']
            userId = user && user['$key']
            userSecurity = @context['userSecurity']

            if /^ADMIN\s*/i.test(userId)
                return true

            if typeof userSecurity == 'undefined'
                return true # running against a pre 8.0 SalesLogix environment

            return !!userSecurity[security]
        reload: ->
            window.location.reload()
        logOut: ->
            if window.localStorage
                window.localStorage.removeItem('credentials')
                window.localStorage.removeItem('navigationState')

            service = @getService()
            service
                ?.setUserName(false)
                ?.setPassword(false)

            @reload()
        handleAuthentication: ->
            try
                if window.localStorage
                    stored = window.localStorage.getItem('credentials')
                    encoded = stored && Base64.decode(stored)
                    credentials = encoded && json.parse(encoded)

            if credentials
                @authenticateUser(credentials, {
                    success: (result) ->
                        @requestUserDetails()
                        @navigateToInitialView()
                    failure: (result) ->
                        @navigateToLoginView()
                    aborted: (result) ->
                        @navigateToLoginView()
                    scope: @
                })
            else
                @navigateToLoginView()
        _clearNavigationState: ->
            try
                @initialNavigationState = null

                window.localStorage?.removeItem('navigationState')
        _loadNavigationState: ->
            try
                @navigationState = window.localStorage?.getItem('navigationState')
        _loadPreferences: ->
            try
                @preferences = json.parse(window.localStorage?.getItem('preferences'))

            #Probably, the first time, its being accessed, or user cleared
            #the data. So lets initialize the object, with default ones.
            if !@preferences
                views = @getDefaultViews()

                @preferences =
                    home:
                        visible: views
                    configure:
                        order: views.slice(0)
        setDefaultMetricPreferences: ->
            if !@preferences.metrics
                defaults = json.parse(DefaultMetrics)
                @preferences.metrics = defaults
                @persistPreferences()
        requestUserDetails: ->
            request = new Sage.SData.Client.SDataSingleResourceRequest(@getService())
                .setResourceKind('users')
                .setResourceSelector(string.substitute('"${0}"', [@context['user']['$key']]))
                .setQueryArg('select', @userDetailsQuerySelect.join(','))

            request.read({
                success: @onRequestUserDetailsSuccess,
                failure: @onRequestUserDetailsFailure,
                scope: @,
                async: false
            })
        onRequestUserDetailsSuccess: (entry) ->
            @context['user'] = entry
            @context['defaultOwner'] = entry?.DefaultOwner

            @requestUserOptions()
            @requestSystemOptions()
            @setDefaultMetricPreferences()
        onRequestUserDetailsFailure: (response, o) ->
            return
        requestUserOptions: ->
            batch = new Sage.SData.Client.SDataBatchRequest(@getService())
                .setContractName('system')
                .setResourceKind('useroptions')
                .setQueryArg('select', 'name,value')
                .using(->
                    service = @getService()
                    array.forEach(@userOptionsToRequest, (item) ->
                        new Sage.SData.Client.SDataSingleResourceRequest(@)
                            .setContractName('system')
                            .setResourceKind('useroptions')
                            .setResourceSelector(string.substitute('"${0}"', [item]))
                            .read()
                    service)
                @)

            batch.commit({
                success: @onRequestUserOptionsSuccess,
                failure: @onRequestUserOptionsFailure,
                scope: @,
                async: false
            })
        onRequestUserOptionsSuccess: (feed) ->
            userOptions = @context['userOptions'] = @context['userOptions'] || {}

            array.forEach(feed && feed['$resources'], (item) ->
                key = item && item['$descriptor']
                value = item && item['value']

                if value && key
                    userOptions[key] = value
            )

            insertSecCode = userOptions['General:InsertSecCodeID']
            currentDefaultOwner = @context['defaultOwner'] && @context['defaultOwner']['$key']

            if insertSecCode && (!currentDefaultOwner || (currentDefaultOwner != insertSecCode))
                @requestOwnerDescription(insertSecCode)

            @loadCustomizedMoment()
        ###
        Loads a custom object to pass into the current moment language. The object for the language gets built in buildCustomizedMoment.
        ###
        loadCustomizedMoment: ->
            custom = @buildCustomizedMoment()

            currentLang = moment.lang()
            moment.lang(currentLang, custom)
        ###
        Builds an object that will get passed into moment.lang()
        ###
        buildCustomizedMoment: ->
            if !App.context.userOptions
                return

            userWeekStartDay = parseInt(App.context.userOptions['Calendar:WeekStart'], 10)
            results = {}# 0-6, Sun-Sat

            if !isNaN(userWeekStartDay)
                results = {
                    week: {
                        dow: userWeekStartDay
                    }
                }

            return results
        onRequestUserOptionsFailure: (response, o) ->
            ErrorManager.addError(response, o, {}, 'failure')
        requestSystemOptions: ->
            request = new Sage.SData.Client.SDataResourceCollectionRequest(@getService())
                .setContractName('system')
                .setResourceKind('systemoptions')
                .setQueryArg('select', 'name,value')

            request.read({
                success: @onRequestSystemOptionsSuccess,
                failure: @onRequestSystemOptionsFailure,
                scope: @,
                async: false
            })
        onRequestSystemOptionsSuccess: (feed) ->
            # TODO: Would be nice if the systemoptions feed supported batch operations like useroptions
            systemOptions = @context['systemOptions'] = @context['systemOptions'] || {}

            array.forEach(feed && feed['$resources'], (item) ->
                key = item && item['name']
                value = item && item['value']

                if value && key && array.indexOf(@systemOptionsToRequest, key) > -1
                    systemOptions[key] = value
            @)

            multiCurrency = systemOptions['MultiCurrency']

            if multiCurrency && multiCurrency == 'True'
                @requestExchangeRates()
        onRequestSystemOptionsFailure: (response, o) ->
            ErrorManager.addError(response, o, {}, 'failure')
        requestExchangeRates: ->
            request = new Sage.SData.Client.SDataResourceCollectionRequest(@getService())
                .setContractName('dynamic')
                .setResourceKind('exchangeRates')
                .setQueryArg('select', 'Rate')

            request.read({
                success: @onRequestExchangeRatesSuccess,
                failure: @onRequestExchangeRatesFailure,
                scope: @,
                async: false
            })
        onRequestExchangeRatesSuccess: (feed) ->
            exchangeRates = @context['exchangeRates'] = @context['exchangeRates'] || {}

            array.forEach(feed && feed['$resources'], (item) ->
                key = item && item['$key']
                value = item && item['Rate']

                if value && key
                    exchangeRates[key] = value
            @)
        onRequestExchangeRatesFailure: (response, o) ->
            ErrorManager.addError(response, o, {}, 'failure')
        requestOwnerDescription: (key) ->
            request = new Sage.SData.Client.SDataSingleResourceRequest(@getService())
                .setResourceKind('owners')
                .setResourceSelector(string.substitute('"${0}"', [key]))
                .setQueryArg('select', 'OwnerDescription')

            request.read({
                success: @onRequestOwnerDescriptionSuccess,
                failure: @onRequestOwnerDescriptionFailure,
                scope: @
            })
        onRequestOwnerDescriptionSuccess: (entry) ->
            @context['defaultOwner'] = entry if entry
        onRequestOwnerDescriptionFailure: (response, o) ->
            ErrorManager.addError(response, o, {}, 'failure')
        persistPreferences: ->
            try
                window.localStorage?.setItem('preferences', json.stringify(App.preferences))
        getDefaultViews: ->
            [
                'myactivity_list',
                'calendar_daylist',
                'history_list',
                'account_list',
                'contact_list',
                'lead_list',
                'opportunity_list',
                'ticket_list',
                'myattachment_list'
            ]
        getExposedViews: ->
            exposed = []

            for id of @views
                view = App.getView(id)

                if view.id == 'home'
                    continue

                if view.expose
                    exposed.push(id)

            return exposed
        cleanRestoredHistory: (restoredHistory) ->
            result = []
            hasRoot = false

            for i in [restoredHistory.length - 1..0] when !hasRoot
                if restoredHistory[i].data.options && restoredHistory[i].data.options.negateHistory
                    result = []
                    continue

                if App.hasView(restoredHistory[i].page)
                    result.unshift(restoredHistory[i])

                hasRoot = (restoredHistory[i].page == 'home')

            return hasRoot && result
        navigateToInitialView: ->
            @loadSnapper()

            try
                restoredState = @navigationState
                restoredHistory = restoredState && json.parse(restoredState)
                cleanedHistory = @cleanRestoredHistory(restoredHistory)

                @_clearNavigationState()

                if cleanedHistory
                    ReUI.context.transitioning = true
                    ReUI.context.history = ReUI.context.history.concat(cleanedHistory.slice(0, cleanedHistory.length - 1))

                    for i in [0..cleanedHistory.length - 1]
                        window.location.hash = cleanedHistory[i].hash

                    ReUI.context.transitioning = false

                    last = cleanedHistory[cleanedHistory.length - 1]
                    view = App.getView(last.page)
                    options = last.data && last.data.options

                    view.show(options)
                else
                    @navigateToHomeView()
            catch e
                @_clearNavigationState()
                @navigateToHomeView()
        navigateToLoginView: ->
            @getView('login')?.show()
        showLeftDrawer: ->
            @getView('left_drawer')?.show()
        showRightDrawer: ->
            view = @getView('right_drawer')?.show()
        navigateToHomeView: ->
            @loadSnapper()
            @getView('myactivity_list')?.show()
        navigateToActivityInsertView: (options) ->
            @getView('activity_types_list')?.show(options || {})
        initiateCall: ->
            # shortcut for environment call
            environment.initiateCall.apply(@, arguments)
        initiateEmail: ->
            # shortcut for environment call
            environment.initiateEmail.apply(@, arguments)
        showMapForAddress: ->
            # shortcut for environment call
            environment.showMapForAddress.apply(@, arguments)
        getVersionInfo: ->
            string.substitute(@versionInfoText,
                [
                    @mobileVersion.major,
                    @mobileVersion.minor,
                    @mobileVersion.revision,
                    @serverVersion.major
                ])
    }
