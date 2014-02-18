
/*
Copyright (c) 1997-2014, SalesLogix, NA., LLC. All rights reserved.
 */

/* jshint ignore:start */

/**
 * @class Mobile.SalesLogix.Application
 *
 * @extends Sage.Platform.Mobile.Application
 * @requires Sage.Platform.Mobile.ErrorManager
 * @requires Mobile.SalesLogix.Environment
 * @requires moment
 *
 */
define('Mobile/SalesLogix/Application', ['dojo/_base/window', 'dojo/_base/declare', 'dojo/_base/array', 'dojo/_base/connect', 'dojo/json', 'dojo/_base/lang', 'dojo/has', 'dojo/string', 'dojo/text!Mobile/SalesLogix/DefaultMetrics.txt', 'Sage/Platform/Mobile/ErrorManager', 'Mobile/SalesLogix/Environment', 'Sage/Platform/Mobile/Application', 'dojo/sniff', 'dojox/mobile/sniff', 'moment'], function(win, declare, array, connect, json, lang, has, string, DefaultMetrics, ErrorManager, environment, Application, sniff, mobileSniff, moment) {
  return declare('Mobile.SalesLogix.Application', [Application], {
    navigationState: null,
    rememberNavigationState: true,
    enableUpdateNotification: false,
    multiCurrency: false,
    speedSearch: {
      includeStemming: true,
      includePhonic: true,
      includeThesaurus: false,
      useFrequentFilter: false,
      searchType: 1
    },
    enableCaching: true,
    userDetailsQuerySelect: ['UserName', 'UserInfo/UserName', 'UserInfo/FirstName', 'UserInfo/LastName', 'DefaultOwner/OwnerDescription'],
    userOptionsToRequest: ['General;InsertSecCodeID', 'General;Currency', 'Calendar;DayStartTime', 'Calendar;WeekStart', 'ActivityMeetingOptions;AlarmEnabled', 'ActivityMeetingOptions;AlarmLead', 'ActivityMeetingOptions;Duration', 'ActivityPhoneOptions;AlarmEnabled', 'ActivityPhoneOptions;AlarmLead', 'ActivityPhoneOptions;Duration', 'ActivityToDoOptions;AlarmEnabled', 'ActivityToDoOptions;AlarmLead', 'ActivityToDoOptions;Duration', 'ActivityPersonalOptions;AlarmEnabled', 'ActivityPersonalOptions;AlarmLead', 'ActivityPersonalOptions;Duration'],
    systemOptionsToRequest: ['BaseCurrency', 'MultiCurrency', 'ChangeOpportunityRate', 'LockOpportunityRate'],
    serverVersion: {
      'major': 8,
      'minor': 0,
      'revision': 0
    },
    mobileVersion: {
      'major': 3,
      'minor': 0,
      'revision': 2
    },
    versionInfoText: 'Mobile v${0}.${1}.${2} / Saleslogix v${3} platform',
    init: function() {
      if (has('ie') && has('ie') < 9) {
        window.location.href = 'unsupported.html';
      }
      this.inherited(arguments);
      this._loadNavigationState();
      return this._loadPreferences();
    },
    initConnects: function() {
      this.inherited(arguments);
      if (window.applicationCache) {
        return this._connects.push(connect.connect(window.applicationCache, 'updateready', this, this._checkForUpdate));
      }
    },
    onSetOrientation: function(value) {
      var _ref;
      return (_ref = App.snapper) != null ? _ref.close() : void 0;
    },
    _viewTransitionTo: function(view) {
      this.inherited(arguments);
      return this._checkSaveNavigationState();
    },
    _checkSaveNavigationState: function() {
      if (this.rememberNavigationState !== false) {
        return this._saveNavigationState();
      }
    },
    _checkForUpdate: function() {
      var applicationCache;
      applicationCache = window.applicationCache;
      if (applicationCache && this.enableUpdateNotification) {
        if (applicationCache.status === applicationCache.UPDATEREADY) {
          this._notifyUpdateAvailable();
        }
      }
    },
    _notifyUpdateAvailable: function() {
      var _ref, _ref1;
      return (_ref = this.bars) != null ? (_ref1 = _ref.updatebar) != null ? _ref1.show() : void 0 : void 0;
    },
    _saveNavigationState: function() {
      var _ref;
      try {
        return (_ref = window.localStorage) != null ? _ref.setItem('navigationState', json.stringify(ReUI.context.history)) : void 0;
      } catch (_error) {}
    },
    hasMultiCurrency: function() {
      return this.multiCurrency === true;
    },
    canLockOpportunityRate: function() {
      var _ref, _ref1;
      return ((_ref = this.context) != null ? (_ref1 = _ref.systemOptions) != null ? _ref1.LockOpportunityRate : void 0 : void 0) === 'True';
    },
    canChangeOpportunityRate: function() {
      var _ref, _ref1;
      return ((_ref = this.context) != null ? (_ref1 = _ref.systemOptions) != null ? _ref1.ChangeOpportunityRate : void 0 : void 0) === 'True';
    },
    getMyExchangeRate: function() {
      var myCode, myRate, results;
      results = {
        code: '',
        rate: 1
      };
      if (this.hasMultiCurrency() && this.context && this.context['exchangeRates'] && this.context['userOptions'] && this.context['userOptions']['General:Currency']) {
        myCode = this.context['userOptions']['General:Currency'];
        myRate = this.context['exchangeRates'][myCode];
        lang.mixin(results, {
          code: myCode,
          rate: myRate
        });
      }
      return results;
    },
    getBaseExchangeRate: function() {
      var baseCode, baseRate, results;
      results = {
        code: '',
        rate: 1
      };
      if (this.hasMultiCurrency() && this.context && this.context['exchangeRates'] && this.context['systemOptions'] && this.context['systemOptions']['BaseCurrency']) {
        baseCode = this.context['systemOptions']['BaseCurrency'];
        baseRate = this.context['exchangeRates'][baseCode];
        lang.mixin(results, {
          code: baseCode,
          rate: baseRate
        });
      }
      return results;
    },
    getCurrentOpportunityExchangeRate: function() {
      var code, found, rate, results;
      results = {
        code: '',
        rate: 1
      };
      found = this.queryNavigationContext(function(o) {
        return /^(opportunities)$/.test(o.resourceKind) && o.key;
      });
      found = found != null ? found.options : void 0;
      if (found) {
        rate = found.ExchangeRate;
        code = found.ExchangeRateCode;
        lang.mixin(results, {
          code: code,
          rate: rate
        });
      }
      return results;
    },
    run: function() {
      this.inherited(arguments);
      if (App.isOnline() || !App.enableCaching) {
        this.handleAuthentication();
      } else {
        this.navigateToHomeView();
      }
      if (this.enableUpdateNotification) {
        return this._checkForUpdate();
      }
    },
    onAuthenticateUserSuccess: function(credentials, callback, scope, result) {
      var user, _ref;
      user = {
        '$key': lang.trim(result['response']['userId']),
        '$descriptor': result['response']['prettyName'],
        'UserName': result['response']['userName']
      };
      this.context['user'] = user;
      this.context['roles'] = result['response']['roles'];
      this.context['securedActions'] = result['response']['securedActions'];
      if (this.context['securedActions']) {
        array.forEach(this.context['securedActions'], function(item) {
          return this[item] = true;
        }, this.context['userSecurity'] = {});
      } else {
        this.serverVersion = {
          'major': 7,
          'minor': 5,
          'revision': 4
        };
      }
      if (credentials.remember) {
        try {
          if ((_ref = window.localStorage) != null) {
            _ref.setItem('credentials', Base64.encode(json.stringify({
              username: credentials.username,
              password: credentials.password || ''
            })));
          }
        } catch (_error) {}
      }
      return callback != null ? callback.call(scope || this, {
        user: user
      }) : void 0;
    },
    onAuthenticateUserFailure: function(callback, scope, response, ajax) {
      var service;
      service = this.getService();
      if (service != null) {
        service.setUserName(false);
      }
      if (service != null) {
        service.setPassword(false);
      }
      return callback != null ? callback.call(scope || this, {
        response: response
      }) : void 0;
    },
    authenticateUser: function(credentials, options) {
      var request, service, _ref, _ref1;
      service = (_ref = this.getService()) != null ? (_ref1 = _ref.setUserName(credentials.username)) != null ? _ref1.setPassword(credentials.password || '') : void 0 : void 0;
      request = new Sage.SData.Client.SDataServiceOperationRequest(service).setContractName('system').setOperationName('getCurrentUser');
      return request.execute({}, {
        success: lang.hitch(this, this.onAuthenticateUserSuccess, credentials, options.success, options.scope),
        failure: lang.hitch(this, this.onAuthenticateUserFailure, options.failure, options.scope),
        aborted: lang.hitch(this, this.onAuthenticateUserFailure, options.failure, options.scope)
      });
    },
    hasAccessTo: function(security) {
      var user, userId, userSecurity;
      if (!security) {
        return true;
      }
      user = this.context['user'];
      userId = user && user['$key'];
      userSecurity = this.context['userSecurity'];
      if (/^ADMIN\s*/i.test(userId)) {
        return true;
      }
      if (typeof userSecurity === 'undefined') {
        return true;
      }
      return !!userSecurity[security];
    },
    reload: function() {
      return window.location.reload();
    },
    logOut: function() {
      var service, _ref;
      if (window.localStorage) {
        window.localStorage.removeItem('credentials');
        window.localStorage.removeItem('navigationState');
      }
      service = this.getService();
      if (service != null) {
        if ((_ref = service.setUserName(false)) != null) {
          _ref.setPassword(false);
        }
      }
      return this.reload();
    },
    handleAuthentication: function() {
      var credentials, encoded, stored;
      try {
        if (window.localStorage) {
          stored = window.localStorage.getItem('credentials');
          encoded = stored && Base64.decode(stored);
          credentials = encoded && json.parse(encoded);
        }
      } catch (_error) {}
      if (credentials) {
        return this.authenticateUser(credentials, {
          success: function(result) {
            this.requestUserDetails();
            return this.navigateToInitialView();
          },
          failure: function(result) {
            return this.navigateToLoginView();
          },
          aborted: function(result) {
            return this.navigateToLoginView();
          },
          scope: this
        });
      } else {
        return this.navigateToLoginView();
      }
    },
    _clearNavigationState: function() {
      var _ref;
      try {
        this.initialNavigationState = null;
        return (_ref = window.localStorage) != null ? _ref.removeItem('navigationState') : void 0;
      } catch (_error) {}
    },
    _loadNavigationState: function() {
      var _ref;
      try {
        return this.navigationState = (_ref = window.localStorage) != null ? _ref.getItem('navigationState') : void 0;
      } catch (_error) {}
    },
    _loadPreferences: function() {
      var views, _ref;
      try {
        this.preferences = json.parse((_ref = window.localStorage) != null ? _ref.getItem('preferences') : void 0);
      } catch (_error) {}
      if (!this.preferences) {
        views = this.getDefaultViews();
        return this.preferences = {
          home: {
            visible: views
          },
          configure: {
            order: views.slice(0)
          }
        };
      }
    },
    setDefaultMetricPreferences: function() {
      var defaults;
      if (!this.preferences.metrics) {
        defaults = json.parse(DefaultMetrics);
        this.preferences.metrics = defaults;
        return this.persistPreferences();
      }
    },
    requestUserDetails: function() {
      var request;
      request = new Sage.SData.Client.SDataSingleResourceRequest(this.getService()).setResourceKind('users').setResourceSelector(string.substitute('"${0}"', [this.context['user']['$key']])).setQueryArg('select', this.userDetailsQuerySelect.join(','));
      return request.read({
        success: this.onRequestUserDetailsSuccess,
        failure: this.onRequestUserDetailsFailure,
        scope: this,
        async: false
      });
    },
    onRequestUserDetailsSuccess: function(entry) {
      this.context['user'] = entry;
      this.context['defaultOwner'] = entry != null ? entry.DefaultOwner : void 0;
      this.requestUserOptions();
      this.requestSystemOptions();
      return this.setDefaultMetricPreferences();
    },
    onRequestUserDetailsFailure: function(response, o) {},
    requestUserOptions: function() {
      var batch;
      batch = new Sage.SData.Client.SDataBatchRequest(this.getService()).setContractName('system').setResourceKind('useroptions').setQueryArg('select', 'name,value').using(function() {
        var service;
        service = this.getService();
        return array.forEach(this.userOptionsToRequest, function(item) {
          return new Sage.SData.Client.SDataSingleResourceRequest(this).setContractName('system').setResourceKind('useroptions').setResourceSelector(string.substitute('"${0}"', [item])).read();
        }, service);
      }, this);
      return batch.commit({
        success: this.onRequestUserOptionsSuccess,
        failure: this.onRequestUserOptionsFailure,
        scope: this,
        async: false
      });
    },
    onRequestUserOptionsSuccess: function(feed) {
      var currentDefaultOwner, insertSecCode, userOptions;
      userOptions = this.context['userOptions'] = this.context['userOptions'] || {};
      array.forEach(feed && feed['$resources'], function(item) {
        var key, value;
        key = item && item['$descriptor'];
        value = item && item['value'];
        if (value && key) {
          return userOptions[key] = value;
        }
      });
      insertSecCode = userOptions['General:InsertSecCodeID'];
      currentDefaultOwner = this.context['defaultOwner'] && this.context['defaultOwner']['$key'];
      if (insertSecCode && (!currentDefaultOwner || (currentDefaultOwner !== insertSecCode))) {
        this.requestOwnerDescription(insertSecCode);
      }
      return this.loadCustomizedMoment();
    },

    /*
    Loads a custom object to pass into the current moment language. The object for the language gets built in buildCustomizedMoment.
     */
    loadCustomizedMoment: function() {
      var currentLang, custom;
      custom = this.buildCustomizedMoment();
      currentLang = moment.lang();
      return moment.lang(currentLang, custom);
    },

    /*
    Builds an object that will get passed into moment.lang()
     */
    buildCustomizedMoment: function() {
      var results, userWeekStartDay;
      if (!App.context.userOptions) {
        return;
      }
      userWeekStartDay = parseInt(App.context.userOptions['Calendar:WeekStart'], 10);
      results = {};
      if (!isNaN(userWeekStartDay)) {
        results = {
          week: {
            dow: userWeekStartDay
          }
        };
      }
      return results;
    },
    onRequestUserOptionsFailure: function(response, o) {
      return ErrorManager.addError(response, o, {}, 'failure');
    },
    requestSystemOptions: function() {
      var request;
      request = new Sage.SData.Client.SDataResourceCollectionRequest(this.getService()).setContractName('system').setResourceKind('systemoptions').setQueryArg('select', 'name,value');
      return request.read({
        success: this.onRequestSystemOptionsSuccess,
        failure: this.onRequestSystemOptionsFailure,
        scope: this,
        async: false
      });
    },
    onRequestSystemOptionsSuccess: function(feed) {
      var multiCurrency, systemOptions;
      systemOptions = this.context['systemOptions'] = this.context['systemOptions'] || {};
      array.forEach(feed && feed['$resources'], function(item) {
        var key, value;
        key = item && item['name'];
        value = item && item['value'];
        if (value && key && array.indexOf(this.systemOptionsToRequest, key) > -1) {
          return systemOptions[key] = value;
        }
      }, this);
      multiCurrency = systemOptions['MultiCurrency'];
      if (multiCurrency && multiCurrency === 'True') {
        return this.requestExchangeRates();
      }
    },
    onRequestSystemOptionsFailure: function(response, o) {
      return ErrorManager.addError(response, o, {}, 'failure');
    },
    requestExchangeRates: function() {
      var request;
      request = new Sage.SData.Client.SDataResourceCollectionRequest(this.getService()).setContractName('dynamic').setResourceKind('exchangeRates').setQueryArg('select', 'Rate');
      return request.read({
        success: this.onRequestExchangeRatesSuccess,
        failure: this.onRequestExchangeRatesFailure,
        scope: this,
        async: false
      });
    },
    onRequestExchangeRatesSuccess: function(feed) {
      var exchangeRates;
      exchangeRates = this.context['exchangeRates'] = this.context['exchangeRates'] || {};
      return array.forEach(feed && feed['$resources'], function(item) {
        var key, value;
        key = item && item['$key'];
        value = item && item['Rate'];
        if (value && key) {
          return exchangeRates[key] = value;
        }
      }, this);
    },
    onRequestExchangeRatesFailure: function(response, o) {
      return ErrorManager.addError(response, o, {}, 'failure');
    },
    requestOwnerDescription: function(key) {
      var request;
      request = new Sage.SData.Client.SDataSingleResourceRequest(this.getService()).setResourceKind('owners').setResourceSelector(string.substitute('"${0}"', [key])).setQueryArg('select', 'OwnerDescription');
      return request.read({
        success: this.onRequestOwnerDescriptionSuccess,
        failure: this.onRequestOwnerDescriptionFailure,
        scope: this
      });
    },
    onRequestOwnerDescriptionSuccess: function(entry) {
      if (entry) {
        return this.context['defaultOwner'] = entry;
      }
    },
    onRequestOwnerDescriptionFailure: function(response, o) {
      return ErrorManager.addError(response, o, {}, 'failure');
    },
    persistPreferences: function() {
      var _ref;
      try {
        return (_ref = window.localStorage) != null ? _ref.setItem('preferences', json.stringify(App.preferences)) : void 0;
      } catch (_error) {}
    },
    getDefaultViews: function() {
      return ['myactivity_list', 'calendar_daylist', 'history_list', 'account_list', 'contact_list', 'lead_list', 'opportunity_list', 'ticket_list', 'myattachment_list'];
    },
    getExposedViews: function() {
      var exposed, id, view;
      exposed = [];
      for (id in this.views) {
        view = App.getView(id);
        if (view.id === 'home') {
          continue;
        }
        if (view.expose) {
          exposed.push(id);
        }
      }
      return exposed;
    },
    cleanRestoredHistory: function(restoredHistory) {
      var hasRoot, i, result, _i, _ref;
      result = [];
      hasRoot = false;
      for (i = _i = _ref = restoredHistory.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
        if (!(!hasRoot)) {
          continue;
        }
        if (restoredHistory[i].data.options && restoredHistory[i].data.options.negateHistory) {
          result = [];
          continue;
        }
        if (App.hasView(restoredHistory[i].page)) {
          result.unshift(restoredHistory[i]);
        }
        hasRoot = restoredHistory[i].page === 'home';
      }
      return hasRoot && result;
    },
    navigateToInitialView: function() {
      var cleanedHistory, e, i, last, options, restoredHistory, restoredState, view, _i, _ref;
      this.loadSnapper();
      try {
        restoredState = this.navigationState;
        restoredHistory = restoredState && json.parse(restoredState);
        cleanedHistory = this.cleanRestoredHistory(restoredHistory);
        this._clearNavigationState();
        if (cleanedHistory) {
          ReUI.context.transitioning = true;
          ReUI.context.history = ReUI.context.history.concat(cleanedHistory.slice(0, cleanedHistory.length - 1));
          for (i = _i = 0, _ref = cleanedHistory.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
            window.location.hash = cleanedHistory[i].hash;
          }
          ReUI.context.transitioning = false;
          last = cleanedHistory[cleanedHistory.length - 1];
          view = App.getView(last.page);
          options = last.data && last.data.options;
          return view.show(options);
        } else {
          return this.navigateToHomeView();
        }
      } catch (_error) {
        e = _error;
        this._clearNavigationState();
        return this.navigateToHomeView();
      }
    },
    navigateToLoginView: function() {
      var _ref;
      return (_ref = this.getView('login')) != null ? _ref.show() : void 0;
    },
    showLeftDrawer: function() {
      var _ref;
      return (_ref = this.getView('left_drawer')) != null ? _ref.show() : void 0;
    },
    showRightDrawer: function() {
      var view, _ref;
      return view = (_ref = this.getView('right_drawer')) != null ? _ref.show() : void 0;
    },
    navigateToHomeView: function() {
      var _ref;
      this.loadSnapper();
      return (_ref = this.getView('myactivity_list')) != null ? _ref.show() : void 0;
    },
    navigateToActivityInsertView: function(options) {
      var _ref;
      return (_ref = this.getView('activity_types_list')) != null ? _ref.show(options || {}) : void 0;
    },
    initiateCall: function() {
      return environment.initiateCall.apply(this, arguments);
    },
    initiateEmail: function() {
      return environment.initiateEmail.apply(this, arguments);
    },
    showMapForAddress: function() {
      return environment.showMapForAddress.apply(this, arguments);
    },
    getVersionInfo: function() {
      return string.substitute(this.versionInfoText, [this.mobileVersion.major, this.mobileVersion.minor, this.mobileVersion.revision, this.serverVersion.major]);
    }
  });
});

//# sourceMappingURL=Application.js.map
