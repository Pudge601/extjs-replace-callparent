
Ext.define('MyApp.MyClass', {
    extend: 'Ext.panel.Panel',

    privates: {
        myMethod: function () {
            this.callParent();
        }
    }

});
