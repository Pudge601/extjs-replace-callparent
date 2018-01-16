
Ext.define('MyApp.MyClass', {

    myMethod: function () {
        Ext.Base.prototype.myMethod.call(this);
    }

});
