
Ext.define('MyApp.MyClass', {
    override: 'Ext.panel.Panel',

    myMethod: function () {
        this.callParent();
    },

    myOtherMethod: function () {
        this.callParent();
    }

});
