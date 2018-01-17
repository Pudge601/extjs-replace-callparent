var _o = (Ext.panel.Panel.prototype || Ext.panel.Panel).myMethod;
var _o2 = (Ext.panel.Panel.prototype || Ext.panel.Panel).myOtherMethod;

Ext.define('MyApp.MyClass', {
    override: 'Ext.panel.Panel',

    myMethod: function () {
        _o.call(this);
    },

    myOtherMethod: function () {
        _o2.call(this);
    }

});
