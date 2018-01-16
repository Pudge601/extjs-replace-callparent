
Ext.define('MyApp.MyClass', function (MyClass) {
    return {
        override: 'Ext.panel.Panel',

        myMethod: function () {
            this.callParent();
        }
    };
});
