
Ext.define('MyApp.MyClass', {
    extend: 'Ext.panel.Panel',

    myMethod() {
        (Ext.panel.Panel.prototype || Ext.panel.Panel).myMethod.call(this);
    }

});