/// <reference path="dojo.d.ts"/>

import json = require('dojo/json');
import array = require('dojo/_base/array');
import connect = require('dojo/_base/connect');
import aspect = require('dojo/aspect');
import dojoDeclare = require('dojo/_base/declare');
import lang = require('dojo/_base/lang');
import hash = require('dojo/hash');
import has = require('dojo/has');
import domConstruct = require('dojo/dom-construct');
import sniff = require('dojo/sniff');
import mobileSniff = require('dojox/mobile/sniff');
import ReUI = require('Sage/Platform/Mobile/ReUI/main');

var app = dojoDeclare("Mobile.SalesLogix.Application", [Application], {
});


export = app;