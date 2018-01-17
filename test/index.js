
import PluginTester from 'babel-plugin-tester';
import ReplaceCallParentPlugin from '../lib/index';

PluginTester({
    plugin: ReplaceCallParentPlugin,
    pluginName: 'extjs-replace-callparent',
    filename: __filename,
    fixtures: '__fixtures__'
});
