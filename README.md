# almostjs-core
__ALMOsT__ is an **A**gi**L**e **MO**del **T**ransformation framework for JavaScript

[![NPM Version][npm-image]][npm-url]
[![Linux Build][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![MIT licensed][license-image]][license-url]

This repository contains the core components.
For a whole set of helpers see the whole project [ALMOsT](https://github.com/B3rn475/almostjs)

__ALMOsT__ requires the following components:
 - A __Model__ to transform
 - A set of **Rule**s
 - A __Reduction__ configuration

## Installation

```bash
$ npm install almost-core
```

## The Model

__ALMOsT__ does not make any assumption on the structure of your your elements or relations between elements.
The only assumption is made on the structure of the input model.

It must be an __Object__ with at least two properties __elements__ and __relations__ which are **Array**s.

```javascript
  {
    "elements": [],
    "relations": []
  }
```

## The Rules

In __ALMOsT__ rules are created through the __createRule__ maker function.

```javascript
  var createRule = require('almost-core').createRule;
  
  var rule = createRule(
      activationExpression,
      body
    );
```

The __Activation Expression__ is a function which is invoked by the framework to identify if the current rule should be invoked.

```javascript
  // ActivationExpression which always activates the related rule
  function always() { return true; }
```

The __Body__ is a function which returns an __Object__ which is the result of the rule.

```javascript
  // Body which generates nothing
  function always() { return {
    key: value // must be an object
  }; }
```

There are three type of rules:
 - __Model__ rules (rules applied to the whole model)
 - __Element__ rules (rules applied to each element)
 - __Relation__ rules (rules applied to each relation)
 
### Model Rules

__Model__ rules are applied just once to the entire model.
The input of both __Activation Expression__ and __Body__ is the model itself.

```javascript
  createRule(
    function (model) {
      // check if the rule should be applied
      return result_of_the_check;
    },
    function (model) {
      // generate some results
      return result;
    },
  );
```

### Element Rules

__Element__ rules are applied on element in the input model.
The input of both __Activation Expression__ and __Body__ is the the current element and the model.

```javascript
  createRule(
    function (element, model) {
      // check if the rule should be applied
      return result_of_the_check;
    },
    function (element, model) {
      // generate some results
      return result;
    },
  );
```

### Relation Rules

__Relation__ rules are applied on element in the input model.
The input of both __Activation Expression__ and __Body__ is the the current relation and the model.

```javascript
  createRule(
    function (relation, model) {
      // check if the rule should be applied
      return result_of_the_check;
    },
    function (relation, model) {
      // generate some results
      return result;
    },
  );
```

## The Transformer

In __ALMOsT__ the model transformation is applied via a __Transformer__.
A transforme is created through the __createTransformer__ maker function.

```javascript
  var createRule = require('almost-core').createTransformer;
  
  var transformer = createTransformer({
    model: modelRules, // rules related to the model
    element: elementRules, // rules related to the elements
    relation: relationRules, // rules related to the relations
    reduce: reduceConfiguration // how to compact the results
  });
  
  var result1 = transform(model1);
  var result2 = transform(model2);
  // a transformer can be reused many times.
  var resultN = transform(modelN);
```

A __Transformer__ is a function which takes as input a __Model__ object and returns the aggregated results.
It requires a set of **Rule**s related to __Model__, **Element**s and **Relation**s.

### Reduce Configuration

The results of the activated rules are aggregated/merged in a single object.

If results of different rules have the same key the related objects are aggregated.

```javascript
  // Result of rule A
  {
    foo: fooA,
    bar: barA
  }
  // Result of rule B
  {
    bar: barB
  }
  // Aggregated result
  {
    foo: aggregation(fooA),
    bar: aggregation(barA, barB)
  }
```
The attributes of these **Object**s are aggregated using the following policies:
 - __Concatenation__ [default] all the values are stored in an array
 - __First__ the first encountered value is stored (non deterministic)
 - __Last__ the last encountered value is stored (non deterministic)
 - __Minimum__ the minimum value is stored
 - __Maximum__ the greater value is stored
 - __Custom__ same as __Concatenation__, but values are passed to a user provided function which is responsible of the aggregation

The __Reduction Configuration__ object is used to define these policies

```javascript
  var transformer = createTransformer({
    model: modelRules, // rules related to the model
    element: elementRules, // rules related to the elements
    relation: relationRules, // rules related to the relations
    reduce: {
      attr1: 'concat',
      attr2: 'min',
      attr3: 'max',
      attr4: function (values) {
        // return something
      }
    }
  });
```

```javascript
  // Result of rule A
  {
    foo: { attr1: 'Afoo', attr2: 'Afoo', attr3: 'Afoo' },
    bar: { attr1: 'Abar', attr2: 'Abar', attr3: 'Abar' },
  }
  // Result of rule B
  {
    bar: { attr1: 'Bbar', attr2: 'Bbar', attr3: 'Bbar' },
  }
  // Aggregated result
  {
    foo: { attr1: ['Afoo'], attr2: 'Afoo', attr3: 'Afoo' },
    bar: { attr1: ['Abar', 'Bbar'], attr2: 'Abar', attr3: 'Bbar' }    
  }
```

[npm-image]: https://img.shields.io/npm/v/almost-core.svg
[npm-url]: https://npmjs.org/package/almost-core
[travis-image]: https://img.shields.io/travis/B3rn475/almostjs-core/master.svg?label=linux
[travis-url]: https://travis-ci.org/B3rn475/almostjs-core
[coveralls-image]: https://img.shields.io/coveralls/B3rn475/almostjs-core/master.svg
[coveralls-url]: https://coveralls.io/r/B3rn475/almostjs-core?branch=master
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://raw.githubusercontent.com/B3rn475/almostjs-core/master/LICENSE
