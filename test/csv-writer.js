var assert = require('assert');
var sc3 = require('../');
var fs = require('fs');

describe('CsvWriter', function() {
  describe('#constructor()', function() {
    it('should return a CsvWriter', function() {
      var w = new sc3.CsvWriter(['one', 'two', 'three']);
      assert(w instanceof sc3.CsvWriter);
    });
    it('should return a CsvWriter without new', function() {
      var w = sc3.CsvWriter(['one', 'two', 'three']);
      assert(w instanceof sc3.CsvWriter);
    });
    it('should set the header correctly', function() {
      var w = sc3.CsvWriter(['one', 'two', 'three']);
      assert.equal(['one', 'two', 'three'] + '', w.header + '');
    });
    it('should default outstream to stdout', function() {
      var w = sc3.CsvWriter(['one', 'two', 'three']);
      assert(process.stdout === w.outstream);
    });
    it('should create a file output stream from string file path', function() {
      var w = sc3.CsvWriter(['one', 'two', 'three'], './out/test.out');
      assert(w.outstream.writable === true);
      assert(w.outstream.path === './out/test.out');
    });
    it('should use output stream we pass to it', function() {
      var w = sc3.CsvWriter(['one', 'two', 'three'], fs.createWriteStream('./out/test.out'));
      assert(w.outstream.writable === true);
      assert(w.outstream.path === './out/test.out');
    });
  });
  describe('#transform()', function() {
    it('should throw an error', function(cb) {
      var w = new sc3.CsvWriter(['one', 'two', 'three']);
      w.transform(null, null, function(err) {
        assert(err.message === 'transform method not implemented');
        cb(null);
      });
    });
  });
  describe('#onFlush()', function() {
    it('should not throw an error', function(cb) {
      var w = new sc3.CsvWriter(['one', 'two', 'three']);
      w.onFlush(null, function(err) {
        assert(!err);
        cb(null);
      });
    });
  });
  describe('#shouldFlush()', function() {
    it('should return true', function() {
      var w = new sc3.CsvWriter(['one', 'two', 'three']);
      assert(w.shouldFlush());
    });
  });
});