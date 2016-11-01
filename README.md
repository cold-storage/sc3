# sc3

**DEPRECATED**

Now that we know what we are doing, we just do this. You can add as many transform
streams as you like in the pipe.

```
#!/usr/bin/env node

'use strict';

const stream = require('stream');
const csvParse = require('csv-parse');
const csvStringify = require('csv-stringify');
const multipipe = require('multipipe');

const transform = new stream.Transform({
  objectMode: true,
  transform(i, encoding, cb) {
    let o = {};

    o.Email = i['[email]'];
    o.EMAIL_ID__c = i['[email]'];
    o.FirstName = i['[fname]'];
    o.LastName = i['[lname]'] || 'NO LAST NAME';
    // na o.xxx = i['[prefix]'];
    // na only 1 o.xxx = i['[suffix]'];
    // na o.xxx = i['[fax]'];
    o.Phone = i['[phone]'];
    // na only 1 this is the name of a business o.xxx = i['[business]'];
    o.MailingStreet = i['[address1]'];
    // na o.xxx = i['[address2]'];
    o.MailingCity = i['[city]'];
    o.MailingState = i['[state]'];
    o.MailingPostalCode = i['[zip]'];
    o.iContact_Setdate__c = i['[setdate]'].substring(0, 10);

    this.push(o);
    cb();
  }
});

multipipe(
  process.stdin,
  csvParse({
    columns: true
  }),
  transform,
  csvStringify({
    header: true
  }),
  process.stdout,
  (err) => {
    if (err) {
      console.error('ERROR', err);
      process.exit(9);
    }
  });
```

sc3 is a Node.js streaming library for reading, transforming, and writing to
CSV. We may add reading from other formats like Excel or SQL in the future. The
motivational use case for this was Salesforce data migration. Ugh!!!

Multiple writers allow you to output multiple different CSV streams from a
single input.

We allow you to group rows by one or more columns so that all rows for the given
column value(s) get flushed together. The CSV input must be sorted by these
columns.

We can automatically remove duplicate rows from the output (assuming input is
sorted and duplicates are adjacent).

## Examples

### simple.js

`simple.js` eliminates Adolph Hitler from the world and gets rid of duplicate
Mary Poppinses. It also merges the name and birthday fields.

```
$ example/simple.js < example/simple.csv > out/simple.csv
```

**example/simple.csv**

```
firstName,lastName,myAge,birthYear,birthMonth,birthDay
Bill,Withers,83,1947,7,11
Mary,Poppins,72,1993,4,9
Mary,Poppins,72,1993,4,9
Adolf,Hitler,22,1902,3,22
Jolly,Rancher,44,1894,12,1
```

**out/simple.csv**

```
Name,Age,Birthday
Bill Withers,83,7/11/1947
Mary Poppins,72,4/9/1993
Jolly Rancher,44,12/1/1894
```

### group-reduce.js

`group-reduce.js` merges multiple rows for the same person into a single row
with columns for each phone type.

```
$ example/group-reduce.js < example/group-reduce.csv > out/group-reduce.csv
```

**example/group-reduce.csv**

```
id,name,phone,phonetype
007,James Bond,935.342.8884,home
007,James Bond,935.977.1112,mobile
99,Ninety Nine,022.375.3661,mobile
99,Ninety Nine,022.668.0033,home
99,Ninety Nine,022.110.7474,work
```

**out/group-reduce.csv**

```
id,name,mobile,home,work
007,James Bond,935.977.1112,935.342.8884,
99,Ninety Nine,022.375.3661,022.668.0033,022.110.7474
```

### attr.js

```bash
example/attr.js < example/attr.csv
```
