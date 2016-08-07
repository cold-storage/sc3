# sc3

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