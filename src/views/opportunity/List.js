/// <reference path="../../../../../argos-sdk/libraries/ext/ext-core-debug.js"/>
/// <reference path="../../../../../argos-sdk/libraries/sdata/sdata-client-debug"/>
/// <reference path="../../../../../argos-sdk/libraries/Simplate.js"/>
/// <reference path="../../../../../argos-sdk/src/View.js"/>
/// <reference path="../../../../../argos-sdk/src/List.js"/>

Ext.namespace("Mobile.SalesLogix.Opportunity");

(function() {
    Mobile.SalesLogix.Opportunity.List = Ext.extend(Sage.Platform.Mobile.List, {
        //Templates
        itemTemplate: new Simplate([
            '<li data-action="activateEntry" data-key="{%= $.$key %}" data-descriptor="{%: $.$descriptor %}" data-opportunity-status="{%: $.Status %}">',
            '<div data-action="selectEntry" class="list-item-selector"></div>',
            '{%! $$.contentTemplate %}',
            '</li>'
        ]),
        //TODO: Support ExchangeRateCode with proper symbol
        contentTemplate: new Simplate([                       
            '<h3>{%: $.Description %} <span class="p-account">{% if ($.Account) { %}({%: $.Account.AccountName %}){% } %}</span></h3>',
            '<h4>',
            '{%: $.Status %} {%: Mobile.SalesLogix.Format.currency($.SalesPotential) %}',
            '{% if ($.Stage) { %} | {%: $.Stage %}{% } %}',
            '{% if ($.Account) { %} | {%: $.Account.AccountManager.UserInfo.UserName %}{% } %}',
            '{% if ($.Account.AccountManager.UserInfo.Region) { %} - {%: $.Account.AccountManager.UserInfo.Region %}{% } %}',
            '</h4>'
        ]),

        //Localization
        titleText: 'Opportunities',
        activitiesText: 'Activities',
        notesText: 'Notes',
        scheduleText: 'Schedule',

        //View Properties
        detailView: 'opportunity_detail',
        icon: 'content/images/icons/opportunity_24.png',
        id: 'opportunity_list',
        insertView: 'opportunity_edit',
        queryOrderBy: 'EstimatedClose desc',
        querySelect: [
            'Account/AccountName',
            'Account/AccountManager/UserInfo/UserName',
            'Account/AccountManager/UserInfo/Region',
            'Description',
            'Stage',
            'Status',
            'SalesPotential'
        ],
        resourceKind: 'opportunities',

        formatSearchQuery: function(query) {
            return String.format('(Description like "%{0}%")', query);

            // todo: The below does not currently work as the dynamic SData adapter does not support dotted notation for queries
            //       except in certain situations.  Support for general dotted notation is being worked on.
            //return String.format('(Description like "%{0}%" or Account.AccountName like "%{0}%")', query);
        }
    });
})();
