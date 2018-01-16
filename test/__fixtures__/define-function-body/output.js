
Ext.define('MyApp.MyClass', function (MyClass) {
    return {
        extend: 'Ext.panel.Panel',
        myMethod: function () {
            Ext.panel.Panel.prototype.myMethod.call(this);
        }
    };
});
