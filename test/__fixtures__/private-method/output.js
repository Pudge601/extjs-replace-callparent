
Ext.define('MyApp.MyClass', {
    extend: 'Ext.panel.Panel',

    privates: {
        myMethod: function () {
            Ext.panel.Panel.prototype.myMethod.call(this);
        }
    }

});
