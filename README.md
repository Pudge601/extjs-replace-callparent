# extjs-replace-callparent

[![Build Status](https://img.shields.io/travis/com/Pudge601/extjs-replace-callparent.svg?style=flat)](https://travis-ci.com/Pudge601/extjs-replace-callparent)
[![Latest Stable Version](https://img.shields.io/npm/v/extjs-replace-callparent.svg?style=flat)](https://www.npmjs.com/package/extjs-replace-callparent)
[![Total Downloads](https://img.shields.io/npm/dt/extjs-replace-callparent.svg?style=flat)](https://www.npmjs.com/package/extjs-replace-callparent)

Babel plugin to replace Ext JS `callParent` calls with direct method calls on parent class.

## Examples

```javascript
// Before
Ext.define('MyClass', {
    extend: 'OtherClass',
    
    constructor: function() {
        this.callParent(arguments);
    }    
});


// After
Ext.define('MyClass', {
    extend: 'OtherClass',
    
    constructor: function() {
        (OtherClass.prototype || OtherClass).constructor.apply(this, arguments);
    }    
});
```
```javascript
// Before
Ext.define('Override.OtherClass', {
    override: 'OtherClass',
    
    method: function() {
        this.callParent();
    }    
});


// After
var _o = (OtherClass.prototype || OtherClass).method;
Ext.define('Override.OtherClass', {
    override: 'OtherClass',
    
    method: function() {
        _o.call(this);
    }    
});
```

```javascript
// Before
Ext.override('OtherClass', {
    myMethod: function () {
        this.callParent();
    }
});


// After
var _o = (OtherClass.prototype || OtherClass).myMethod;
Ext.override('OtherClass', {
    myMethod: function () {
        _o.call(this);
    }
});
```


## Installation

```sh
$ npm install --save-dev extjs-replace-callparent
```

## Usage

### Via `.babelrc`

```json
{
  "plugins": ["extjs-replace-callparent"]
}
```

## Rationale

The main goal of this plugin is to allow for Ext JS code to be written in ES2016 (and transpiled for the browser).

This is currently a problem, because `callParent` uses `arguments.caller` to determine the parent class/method.
This issue has been about for [quite a while](https://www.sencha.com/forum/showthread.php?132503-callParent()-breaks-Firefox-when-using-js-strict-mode),
with seemingly no solution on the cards from Sencha.

This plugin tries to solve the problem by replacing all the `callParent` calls in your codebase during babel
compilation.

As a side affect, this could also potentially speed up code execution and reduce the call stack by
cutting out the `callParent` middle man in the live code.
