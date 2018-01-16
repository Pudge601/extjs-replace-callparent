var _Ext_panel_Panel_myMethod = Ext.panel.Panel.prototype ? Ext.panel.Panel.prototype.myMethod : Ext.panel.Panel.myMethod;

Ext.define('MyApp.MyClass', function (MyClass) {
    return {
        override: 'Ext.panel.Panel',

        myMethod: function () {
            _Ext_panel_Panel_myMethod.call(this);
        }
    };
});
