var _o = (Ext.panel.Panel.prototype || Ext.panel.Panel).myMethod;

Ext.override('Ext.panel.Panel', {
    myMethod: function () {
        _o.call(this);
    }
});
