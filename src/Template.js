/*
 * Copyright (c) 1997-2013, SalesLogix, NA., LLC. All rights reserved.
 */

/**
 * @class Mobile.SalesLogix.Template
 *
 * Helper class that contains re-usuable {@link Simplate} templates.
 *
 * @requires Sage.Platform.Mobile.Format
 *
 */
define('Mobile/SalesLogix/Template', [
    'dojo/_base/lang',
    'Sage/Platform/Mobile/Format'
], function(
    lang,
    format
) {
    return lang.setObject('Mobile.SalesLogix.Template', {
        /**
         * @property {Simplate} nameLF
         * Template for lastname, firstname
         */
        nameLF: new Simplate([
            '{% if ($) { %}',
                '{% if ($.LastName && $.FirstName) { %}',
                    '{%= $.LastName %}, {%= $.FirstName%}',
                '{% } else { %}',
                    '{%: $.LastName ? $.LastName : $.FirstName %}',
                '{% } %}',
            '{% } %}'
        ]),

        /**
         * @property {Simplate} alternateKeyPrefixSuffix
         * Template for alternate key, takes a prefix and suffix 
         */
        alternateKeyPrefixSuffix: new Simplate([
            '{%= $.AlternateKeyPrefix %}-{%= $.AlternateKeySuffix %}'
        ]),

        /**
         * @property {Simplate} noteDetailPropertyOld
         * Template for note details
         */
        noteDetailPropertyOld: new Simplate([
            '{% var F = Sage.Platform.Mobile.Format; %}',
            '<div class="row note-text-row {%= $.cls %}" data-property="{%= $.name %}">',
                '<label>{%: $.label %}</label>',
                '<div class="note-text-property">',
                    '<div class="note-text-wrap">',
                        '{%= F.nl2br(F.encode($.value)) %}',
                    '</div>',
                '</div>',
            '</div>'
        ]),

        /**
         * @property {Simplate} noteDetailProperty
         * Template for note details
         */
        noteDetailProperty: new Simplate([
            '{% var F = Sage.Platform.Mobile.Format; %}',
            '<div class="row note-text-row {%= $.cls %}" data-property="{%= $.name %}">',
                '<label>{%: $.label %}</label>',
                '<pre>',
                '{%= F.encode($.value) %}',
                '</pre>',
            '</div>'
        ])
    });
});

