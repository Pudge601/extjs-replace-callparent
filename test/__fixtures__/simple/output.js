
Ext.define('MyApp.MyClass', {
    extend: 'Ext.panel.Panel',

    myMethod: function () {
        Ext.panel.Panel.prototype.myMethod.call(this);
    }

});
