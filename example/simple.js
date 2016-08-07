#!/usr/bin/env node

'use strict';

var sc3 = require('../');

var w = sc3.CsvWriter([
  'Name',
  'Age',
  'Birthday'
]);

w.removeDuplicates = true;

w.transform = function(inRow, outRows, cb) {
  // Eliminate Hitler from our output file.
  if (inRow.lastName === 'Hitler') {
    cb(null);
  } else {
    var outRow = {
      Name: inRow.firstName + ' ' + inRow.lastName,
      Age: inRow.myAge,
      Birthday: inRow.birthMonth + '/' + inRow.birthDay + '/' + inRow.birthYear
    };
    // This is crazy you would never do it, but just to show you that dup rows
    // will be removed because we specified w.removeDuplicates.
    outRows.push.call(outRows, outRow, outRow, outRow, outRow, outRow, outRow, outRow);
    cb(null);
  }
};

var csv = '';
csv += 'firstName,lastName,myAge,birthYear,birthMonth,birthDay\n';
csv += 'Bill,Withers,83,1947,7,11\n';
csv += 'Mary,Poppins,72,1993,4,9\n';
csv += 'Mary,Poppins,72,1993,4,9\n';
csv += 'Adolf,Hitler,22,1902,3,22\n';
csv += 'Jolly,Rancher,44,1894,12,1\n';

// Pass our writer to our reader and kick things off with .read(). Passing
// process.argv[2] allows you to pass input file as parameter or if none passed
// we read from STDIN.
// (new sc3.CsvReader(w, process.argv[2])).read(function(err) {
//   if (err) {
//     throw err;
//   }
// });

// For testing you can pass a string that represents your csv. If the string
// passed to csv reader has a \n in it, we assume it's csv, otherwise we assume
// it's a file path + name.
(new sc3.CsvReader(w, csv)).read(function(err) {
  if (err) {
    throw err;
  }
});