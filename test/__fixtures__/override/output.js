var _Ext_panel_Panel_prototype_myMethod = Ext.panel.Panel.prototype.myMethod;

Ext.define('MyApp.MyClass', {
    override: 'Ext.panel.Panel',

    myMethod: function () {
        _Ext_panel_Panel_prototype_myMethod.call(this);
    }

});
