
Ext.define('MyApp.MyClass', function (MyClass) {
    return {
        myMethod: function () {
            MyApp.MyClass.superclass.myMethod.call(this);
        }
    };
});
