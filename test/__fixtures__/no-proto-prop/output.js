
Ext.define('MyApp.MyClass', {

    myMethod: function () {
        (Ext.Base.prototype || Ext.Base).myMethod.call(this);
    }

});
