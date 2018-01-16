
const path = require('path');
const PluginTester = require('babel-plugin-tester');
const ReplaceCallParentPlugin  = require('../src/index');

PluginTester({
    plugin: ReplaceCallParentPlugin,
    pluginName: 'replace-call-parent',
    filename: __filename,
    fixtures: '__fixtures__'
});
