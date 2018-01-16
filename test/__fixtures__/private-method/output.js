
Ext.define('MyApp.MyClass', {

    privates: {
        myMethod: function () {
            MyApp.MyClass.superclass.myMethod.call(this);
        }
    }

});
