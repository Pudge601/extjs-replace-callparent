var _Ext_panel_Panel_prototype_myMethod = Ext.panel.Panel.prototype.myMethod;

Ext.define('MyApp.MyClass', function (MyClass) {
    return {
        override: 'Ext.panel.Panel',

        myMethod: function () {
            _Ext_panel_Panel_prototype_myMethod.call(this);
        }
    };
});
