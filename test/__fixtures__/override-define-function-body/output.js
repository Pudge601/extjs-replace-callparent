var _o = (Ext.panel.Panel.prototype || Ext.panel.Panel).myMethod;

Ext.define('MyApp.MyClass', function (MyClass) {
    return {
        override: 'Ext.panel.Panel',

        myMethod: function () {
            _o.call(this);
        }
    };
});
