var _Ext_panel_Panel_myMethod = (Ext.panel.Panel.prototype || Ext.panel.Panel).myMethod;

Ext.define('MyApp.MyClass', {
    override: 'Ext.panel.Panel',

    myMethod: function () {
        _Ext_panel_Panel_myMethod.call(this);
    }

});
