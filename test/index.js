
import PluginTester from 'babel-plugin-tester';
import ReplaceCallParentPlugin from '../lib/index';

PluginTester({
    plugin: ReplaceCallParentPlugin,
    pluginName: 'replace-call-parent',
    filename: __filename,
    fixtures: '__fixtures__'
});
