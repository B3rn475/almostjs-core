# almostjs-core
__ALMOsT__ is an **A**gi**L**e **MO**del **T**ransformation framework for JavaScript

[![NPM Version][npm-image]][npm-url]
[![Build][travis-image]][travis-url]
[![Build][appveyor-image]][appveyor-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![MIT licensed][license-image]][license-url]

This repository contains a low level graph traversing and aggregation framework used by [ALMOsT](https://github.com/B3rn475/almostjs).
It is mainly manted as a generic __graph__ to __tree__ transformation framework.

## Installation

```bash
$ npm install almost-core
```

## The Pipeline

The transformation follows the following steps
 - __Graph Traversing__ during this phase the input graph (JSON Object) is traversed and a set of analysis points are set
 - __Analysis Execution__ the analysis points are execute one at a time and results are collected
 - __Results Aggregation__ the results are aggregated to generated a final tree

This is an high level view over the system, under the hood we optimize the process in order to interleave analyis points execution and aggregation. This allows us to reduce the final memory footprint.

## The Transformer

A transformer is a reusable function which hides the previously presented pipeline.
It can be constructed using the `createTransformer(traverse, [reduce])` maker function.

```javascript
 var core = require('almost-core');
 
 var transform = core.createTransformer(traverse);
 
 var output1 = transform(input1);
 var output2 = transform(input2);
 // ...
 var outputN = transform(inputN);
```

The arguments of __createTransformer__ are the following:
 - __traverse__ `function (input, emit)` it is responsible of traversing the graph and "emit" a set of functions which represent the analysis points on the graph. Each function emitted will be invoked once (potentially out of order), with the input object as parameter
 - __reduce__ [optional] 'function (accumulator, value)', it is responsible of aggregate the results of the analysis points (by default the results are concatenated)
 
### Basic Examples

#### toPairs
This example creates a transformer which transforms an __Object__ into an __Array__ of `[key, value]` pairs.

```javascript
 var core = require('almost-core');
 
 var toPairs = core.createTransformer(function (input, emit) {
  Object.keys(input).forEach(function (key) {
   emit(function (object) { return object[key]; });
  });
 });
 
 toPairs({a: 1, b: 2, c: 3}) // result: [['a', 1], ['b', 2], ['c', 3]]
```

#### fromPairs
This example creates a transformer which transforms an a __Array__ of `[key, value]` pairs into an __Object__.

```javascript
 var core = require('almost-core');
 
 var fromPairs = core.createTransformer(function (input, emit) {
  input.forEach(function (pair) {
   emit(function () { var object = {}; object[pair[0]] = pair[1]; return object; });
  });
 }, function (accumulator, value) {
  Object.keys(value).forEach(function (key) {
    accumulator[key] = value[key];
  });
  return accumulator;
 });
 
 fromPairs([['a', 1], ['b', 2], ['c', 3]]) // result: {a: 1, b: 2, c: 3}
```

## Reducer

In order to make custom reduction policies, we provide a `reduce(iteratee, [accumulator], [terminate])` maker function.

```javascript
 var core = require('almost-core');

 var first = core.reduce(function (accumulator) { return accumulator; });
 var sum = core.reduce(function (accumulator, value) { return accumulator + value; }, 0);
 var avg = core.reduce(
  function (accumulator, value) {
   accumulator.sum += value;
   accumulator.count += 1;
   return accumulator;
  },
  {sum: 0, count: 0},
  function (accumulated) {
   if (accumulated.count > 0) {
    return accumulated.sum / accumulated.count;
   }
  }
 );
```

We provide a set of helpers to generate complex reduction policies:
 - `none([error])` if even one value is generated an exception is thrown (useful in conjunction with `merge`)
 - `single([error])` if more than one value is generated an exception is thrown (useful in conjunction with `merge`)
 - `first([default])` it returns the first value encountered (if the `default` argument is passed it will be considered as first element if none are generated)
 - `last([default])` it returns the last value encountered (if the `default` argument is passed it will be considered as first element in the sequence)
 - `concat()` it concatenates all the encountered values in an array
 - `flatten()` it concatenates all the encountered values in an array (arrays are flattened in single elements)
 - `flattenDeep()` it concatenates all the encountered values in an array (arrays are flattened in single elements recursively)
 - `merge([policy], [specials])` all the encountered objects will be merged using the last value encountered for each property (if the `policy` argument is provided it will be used to reduce the different values encountered for each property, if the `specials` argument is provided it is expected to be an object with the form `{key: policy, ...}` the policies defined will be used instead of the default one for the related key)
 - `mergeOrSingle()` if objects are encountered it recursively merges them with the same policy, if arrays are encountered it concatenates and recursively merges them with the same policy, if anything else is encountered it behaves like `single`
 - `groupBy(key, [policy])` it returns an object which keys are the unique values of the `key` filed in each input and the value is the reduction of all the inputs with the same key, by default `concat`
 - `lazy(policy)` if at least one input is present `policy` policy is applied normally, if no input is present it is like the policy was never there

### Example

#### fromPairs 2.0
This example creates a transformer which transforms an a __Array__ of `[key, value]` pairs into an __Object__.

```javascript
 var core = require('almost-core');
 
 var fromPairs = core.createTransformer(function (input, emit) {
  input.forEach(function (pair) {
   emit(function () { var object = {}; object[pair[0]] = pair[1]; return object; });
  });
 }, core.merge());
 
 fromPairs([['a', 1], ['b', 2], ['c', 3]]) // result: {a: 1, b: 2, c: 3}
```


#### ALMOsT Model Merging
This example creates a transformer which transforms an a __Array__ of `{elements:[...], relations: [...], metadata: {}}` intermediate models into an a final __Object__.

```javascript
 var core = require('almost-core');
 
 var M2MReduce = core.merge(
  core.none('Just elements, realtions and metadata should be generated'),
  {
   elements: core.flatten(),
   relations: core.flatten(),
   metadata: core.merge()
  }
 );
```

[npm-image]: https://img.shields.io/npm/v/almost-core.svg
[npm-url]: https://npmjs.org/package/almost-core
[travis-image]: https://img.shields.io/travis/B3rn475/almostjs-core/master.svg
[travis-url]: https://travis-ci.org/B3rn475/almostjs-core
[appveyor-image]: https://ci.appveyor.com/api/projects/status/github/B3rn475/almostjs-core?svg=true
[appveyor-url]: https://ci.appveyor.com/project/B3rn475/almostjs-core
[coveralls-image]: https://img.shields.io/coveralls/B3rn475/almostjs-core/master.svg
[coveralls-url]: https://coveralls.io/r/B3rn475/almostjs-core?branch=master
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://raw.githubusercontent.com/B3rn475/almostjs-core/master/LICENSE
