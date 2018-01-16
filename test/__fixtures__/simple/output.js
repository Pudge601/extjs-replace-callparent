
Ext.define('MyApp.MyClass', {

    myMethod: function () {
        MyApp.MyClass.superclass.myMethod.call(this);
    }

});
