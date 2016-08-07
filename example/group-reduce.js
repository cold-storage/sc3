#!/usr/bin/env node

'use strict';

var sc3 = require('../');
var _ = require('lodash');

var w = sc3.CsvWriter([
  'id',
  'name',
  'mobile',
  'home',
  'work'
]);

w.groupCols = ['id', 'name'];

w.onFlush = function onFlush(flushRows, cb) {
  if (flushRows.length > 0) {
    // Here it was easier to replace flushRows, so we reference w.flushRows
    // instead of the parameter flushRows.
    w.flushRows = [_.reduce(flushRows, _.defaults, {})];
  }
  cb();
}.bind(w);

w.transform = function(inRow, outRows, cb) {
  var outRow = {
    id: inRow.id,
    name: inRow.name
  };
  outRow[inRow.phonetype] = inRow.phone;
  outRows .push(outRow);
  cb(null);
};

// Pass our writer to our reader and kick things off with .read(). Passing
// process.argv[2] allows you to pass input file as parameter or if none passed
// we read from STDIN.
(new sc3.CsvReader(w, process.argv[2])).read(function(err) {
  if (err) {
    throw err;
  }
});