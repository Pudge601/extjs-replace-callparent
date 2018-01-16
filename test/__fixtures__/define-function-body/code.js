
Ext.define('MyApp.MyClass', function (MyClass) {
    return {
        extend: 'Ext.panel.Panel',
        myMethod: function () {
            this.callParent();
        }
    };
});
