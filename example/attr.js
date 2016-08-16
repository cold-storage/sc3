#!/usr/bin/env node

'use strict';

var sc3 = require('../');

// Transform function shared by both accounts and contacts.
sc3.CsvWriter.prototype.trans = function(inRow) {
  var outRows = [];
  this.doAttr('Alumni Choir', inRow, outRows);
  this.doAttr('Alumni Founders', inRow, outRows);
  this.doAttr('Athletics', inRow, outRows);
  this.doAttr('CareerDay', inRow, outRows);
  this.doAttr('Christmas Card List', inRow, outRows);
  this.doAttr('Class Reps', inRow, outRows);
  this.doAttr('Co-Curricular', inRow, outRows);
  this.doAttr('Distinguished Alum Award Recip', inRow, outRows);
  this.doAttr('Emerald Club', inRow, outRows);
  this.doAttr('Hall of Fame', inRow, outRows);
  this.doAttr('Leadership Cabinet', inRow, outRows);
  this.doAttr('Legacy Gift', inRow, outRows);
  this.doAttr('Performing Arts', inRow, outRows);
  this.doAttr('Presidents Dinner Invitee', inRow, outRows);
  this.doAttr('Reunion Volunteer', inRow, outRows);
  this.doAttr('Veteran', inRow, outRows);
  this.doAttr('Volunteer', inRow, outRows);
  return outRows;
};

// A bit easier way to get the field value.
function getVal(r, name, idcomdes) {
  return r['Constituent Specific Attributes ' + name + ' ' + idcomdes];
}

// This got really messy sometimes the attribute value was in the comments
// field, sometimes it was in the description field. Sometimes the attribute
// had no value just kind of like a boolean flag.
sc3.CsvWriter.prototype.doAttr = function(attrName, inRow, outRows) {
  var vv = getVal(inRow, attrName, 'Import ID');
  if (vv) {
    var newRow = {
      Name: attrName,
      Value__c: '',
      Notes__c: ''
    };
    if (attrName === 'Alumni Choir') {
      newRow.Notes__c = getVal(inRow, attrName, 'Comments');
    } else if (attrName === 'Alumni Founders') {
      // no comments, no description
    } else if (attrName === 'Athletics') {
      newRow.Value__c = getVal(inRow, attrName, 'Description');
      newRow.Notes__c = getVal(inRow, attrName, 'Comments');
    } else if (attrName === 'CareerDay') {
      newRow.Notes__c = getVal(inRow, attrName, 'Description');
    } else if (attrName === 'Christmas Card List') {
      // no comments, no description
    } else if (attrName === 'Class Reps') {
      newRow.Notes__c = getVal(inRow, attrName, 'Comments');
    } else if (attrName === 'Co-Curricular') {
      newRow.Notes__c = getVal(inRow, attrName, 'Description');
    } else if (attrName === 'Distinguished Alum Award Recip') {
      newRow.Value__c = getVal(inRow, attrName, 'Comments');
      newRow.Notes__c = getVal(inRow, attrName, 'Description');
    } else if (attrName === 'Emerald Club') {
      // no comments, no description
    } else if (attrName === 'Hall of Fame') {
      newRow.Notes__c = getVal(inRow, attrName, 'Description');
    } else if (attrName === 'Leadership Cabinet') {
      // no comments, no description
    } else if (attrName === 'Legacy Gift') {
      newRow.Notes__c = getVal(inRow, attrName, 'Comments');
    } else if (attrName === 'Performing Arts') {
      newRow.Value__c = getVal(inRow, attrName, 'Description');
      newRow.Notes__c = getVal(inRow, attrName, 'Comments');
    } else if (attrName === 'Presidents Dinner Invitee') {
      // no comments, no description
    } else if (attrName === 'Reunion Volunteer') {
      newRow.Value__c = getVal(inRow, attrName, 'Description');
      newRow.Notes__c = getVal(inRow, attrName, 'Comments');
    } else if (attrName === 'Veteran') {
      newRow.Value__c = getVal(inRow, attrName, 'Description');
    } else if (attrName === 'Volunteer') {
      newRow.Value__c = getVal(inRow, attrName, 'Description');
      newRow.Notes__c = getVal(inRow, attrName, 'Comments');
    }
    this.setAccount(inRow, newRow);
    outRows.push(newRow);
  }
};

// A writer for contact attributes.
var cattr = new sc3.CsvWriter([
  'Contact__c',
  'Name',
  'Value__c',
  'Notes__c'
], './out/cattr2.csv');

// A writer for account attributes.
var aattr = new sc3.CsvWriter([
  'Account__c',
  'Name',
  'Value__c',
  'Notes__c'
], './out/aattr2.csv');

cattr.removeDuplicates = true;
aattr.removeDuplicates = true;

// We are grouping by the constituent id column and making sure we don't
// output duplicates per constituent.
cattr.groupCols = ['Constituent ID'];
aattr.groupCols = ['Constituent ID'];

cattr.setAccount = function (inRow, newRow) {
  newRow.Contact__c = inRow['Constituent ID'] + ': ' + inRow.Name;
};

aattr.setAccount = function (inRow, newRow)  {
  newRow.Account__c = inRow['Constituent ID'] + ': ' + inRow['Organization Name'];
};

cattr.transform = function(inRow, outRows, cb) {
  // we don't want accounts
  if (!inRow['Organization Name']) {
    cattr.outRows = this.trans(inRow);
  }
  cb(null);
};

aattr.transform = function(inRow, outRows, cb) {
  // we want accounts only
  if (inRow['Organization Name']) {
    aattr.outRows = this.trans(inRow);
  }
  cb(null);
};

// Pass our writer to our reader and kick things off with .read(). Passing
// process.argv[2] allows you to pass input file as parameter or if none passed
// we read from STDIN.
(new sc3.CsvReader([cattr], process.argv[2])).read(function(err) {
  if (err) {
    throw err;
  }
});