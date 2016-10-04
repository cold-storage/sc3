#!/usr/bin/env node

'use strict';

var fs = require('fs');
var async = require('async');
var parse = require('csv-parse');
var stringify = require('csv-stringify')();
var stream = require('stream');
var _ = require('lodash');

// I take "rows" which are really just JSON objects, and allow you to easily
// transform, add, remove, etc. and then write them to CSV output stream.
//
// You must implement my transform() method.
//
// You may implement my onFlush() method.
//
// We allow you to group rows together so they get flushed all at the same time.
// Generally you will have a document sorted by some ID and want to do something
// with all the rows for a given id before moving on to the next set of rows.
//
// We also remember the prior set of rows and allow you to easily eliminate
// adjacent duplicate rows.
//
// This buffering and keeping state on current and prior rows is the real reason
// for my existence. If not for that you could just stream in and stream out
// directly.
//
// header specifies the column names of the CSV output. all output rows must be
// JSON objects with properties of these names.
//
// output can be null, a string file name, or a writable stream.
//
// if output is null, we use stdout.
function CsvWriter(header, output) {
  if (!(this instanceof CsvWriter)) {
    return new CsvWriter(header, output);
  }
  var me = this;
  this.header = header;
  // if remove duplicates is true, we will automatically remove dups from
  // adjacent rows, i.e. there won't be any duplicates in flushRows and
  // priorFlushRows. see rowIsDup()
  this.removeDuplicates = false;
  // if you add one or more input row column headings to groupCols, we will
  // group all rows of the same value for those columns and flush them together.
  // the CSV must be sorted on these columns.
  this.groupCols = [];
  // feel free to directly modify outRows and flushRows as necessary or just
  // modify them as passed to transform() and onFlush().
  this.outRows = [];
  this.flushRows = [];
  // the rest of this probably should be left alone. let the writer work for you.
  this.inRow = {};
  this.priorInRow = {};
  this.priorFlushRows = [];
  if (!output) {
    this.outstream = process.stdout;
  } else if (typeof output === 'string' || output instanceof String) {
    this.outstream = fs.createWriteStream(output);
  } else {
    this.outstream = output;
  }
  this.toString = function toString() {
    return 'CsvWriter\n   header: ' + this.header +
      '\n   removeDuplicates: ' + this.removeDuplicates +
      '\n   groupCols: ' + this.groupCols +
      '\n   outRows: ' + JSON.stringify(this.outRows) +
      '\n   flushRows: ' + JSON.stringify(this.flushRows) +
      '\n   priorFlushRows: ' + JSON.stringify(this.priorFlushRows) +
      '\n   inRow: ' + JSON.stringify(this.inRow) +
      '\n   priorInRow: ' + JSON.stringify(this.priorInRow);
  };
  // This method must be implemented. Just transform inRow to zero or more out
  // rows as needed.
  this.transform = function transform(inRow, outRows, cb) {
    cb(new Error('transform method not implemented'));
  };
  // default implementation does nothing. you can implement if you need to.
  this.onFlush = function onFlush(flushRows, final, cb) {
    cb();
  };
  // shouldFlush could also be named "we got a row (inRow) that's not in the
  // same group as the rows in flushRows AKA not in same group as priorInRow".
  this.shouldFlush = function shouldFlush() {
    if (!me.groupCols || me.groupCols.length === 0) {
      return true;
    } else {
      var shoulFlush = false;
      me.groupCols.forEach(function(colName) {
        if (me.inRow[colName] !== me.priorInRow[colName]) {
          shoulFlush = true;
        }
      });
      return shoulFlush;
    }
  };
  // When moving out rows to flush rows, a row is considered a dup if there is
  // an equivalent row in either current flush rows or prior flush rows.
  // Checking current flush rows will eliminate dups where we are grouping, but
  // it won't eliminate dups of a prior row that's not in my group. So we need
  // prior flush rows to check for that.
  this.rowIsDup = function rowIsDup(row) {
    var rv = false;
    me.flushRows.some(function(flushRow) {
      if (_.isEqual(row, flushRow)) {
        rv = true;
        return true;
      }
    });
    me.priorFlushRows.some(function(flushRow) {
      if (_.isEqual(row, flushRow)) {
        rv = true;
        return true;
      }
    });
    return rv;
  };
  // This is just the stuff I need to do before handling a new row or before
  // flushing for the last time.
  this.moveOutToFlush = function moveOutToFlush(inRow) {
    me.priorInRow = me.inRow || {};
    me.inRow = inRow;
    me.outRows.forEach(function(row) {
      if (!me.removeDuplicates || !me.rowIsDup(row)) {
        me.flushRows.push(row);
      }
    });
    me.outRows = [];
  };
  this.onRow = function onRow(inRow, cb) {
    me.moveOutToFlush(inRow);
    me.transform(inRow, me.outRows, function(err, outRow) {
      if (err) {
        cb(err);
        return;
      }
      if (me.shouldFlush()) {
        me.flush(cb);
      } else {
        cb(null);
      }
    });
  };
  this.flush = function flush(final, cb) {
    if (!cb) {
      cb = final;
      final = false;
    }
    if (final) {
      me.moveOutToFlush();
    }
    me.onFlush(me.flushRows, final, function(err) {
      if (err) {
        cb(err);
        return;
      }
      var fns = [function(cb) {
        cb(null);
      }];
      if (!me.headerWritten) {
        me.headerWritten = true;
        fns.push(me.outstream.write.bind(
          me.outstream, stringify.stringify(me.header) + '\n'));
      }
      me.flushRows.forEach(function(row) {
        var rowa = [];
        me.header.forEach(function(colname) {
          rowa.push(row[colname]);
        });
        fns.push(me.outstream.write.bind(
          me.outstream, stringify.stringify(rowa) + '\n'));
      });
      me.priorFlushRows = me.flushRows;
      me.flushRows = [];
      async.series(fns, function(err) {
        cb(err);
      });
    });
  };
}

// My job is to read a stream of CSV formatted data, transform each row to JSON,
// and pass it to the onRow(row) method of each of my writers. After the
// final row I call each of my writers flush() methods.
//
// input may be null, a file path+name, a CSV string, or a readable.
//
// if input is null, we use stdin.
//
// if input is a string with no newline we assume it's a file name.
//
// if input is a string that contains newline (\n) we assume you passed in the
// entire CSV (probably for testing).
//
// else we assume input is a readable stream.
function CsvReader(writers, input) {
  if (!(this instanceof CsvReader)) {
    return new CsvReader(writers, input);
  }
  var me = this;
  this.writers = writers;
  if (!Array.isArray(this.writers)) {
    this.writers = [this.writers];
  }
  if (!input) {
    this.instream = process.stdin;
  } else if (typeof input === 'string' || input instanceof String) {
    if (input.indexOf('\n') > -1) {
      // If there is a newline we assume you passed us a string that contains
      // your entire csv.
      this.instream = new stream.Readable();
      this.instream.push(input);
      this.instream.push(null);
    } else {
      // If no newline we assume you passed a file name.
      this.instream = fs.createReadStream(input);
    }
  } else {
    this.instream = input;
  }
  this.read = function read(cb) {
    me.instream
      .pipe(parse({
        columns: true
      }))
      .on('data', function(row) {
        var onRows = me.writers.map(function(w) {
          return w.onRow.bind(w, row);
        });
        async.series(onRows, function() {
          // nada
        });
      })
      .on('error', function(err) {
        cb(err);
      })
      .on('finish', function() {
        var flushes = me.writers.map(function(w) {
          return w.flush.bind(w, true);
        });
        async.series(flushes, cb);
      });
  };
}

// TODO add an ExcelReader

// TODO add an SQLReader

exports = module.exports = {
  CsvReader: CsvReader,
  CsvWriter: CsvWriter
};
