
module.exports = function({ types: t }) {

    function isThisOrMeExpression(node) {
        return t.isThisExpression(node) ||
            (t.isIdentifier(node) && (node.name === 'this' || node.name === 'me'));
    }

    function isExtExpression(node) {
        return t.isIdentifier(node) &&
            (node.name === 'Ext' || node.name === 'Ext3' || node.name === 'Mxm3');
    }

    function isCallParentCallee(node) {
        return t.isMemberExpression(node) &&
            isThisOrMeExpression(node.object) &&
            t.isIdentifier(node.property, {name: 'callParent'});
    }

    function isExtDefineCallee(node) {
        return t.isMemberExpression(node) &&
            isExtExpression(node.object) &&
            t.isIdentifier(node.property, {name: 'define'});
    }

    function isExtDefineCall(path) {
        return path.isCallExpression() && isExtDefineCallee(path.node.callee, t);
    }

    function getClsName(defineCallNode) {
        t.assertStringLiteral(defineCallNode.arguments[0]);
        return defineCallNode.arguments[0].value;
    }

    function isClassMethod(path) {
        return path.isObjectProperty() &&
            t.isFunction(path.node.value);
    }

    function buildMethodMemberExpression(methodRef) {
        return methodRef.split('.').reduce((last, next) => {
            return last ? t.memberExpression(last, t.identifier(next)) : t.identifier(next);
        }, null)
    }

    function buildReplacement(clsName, methodName, args) {
        const memberExpression = buildMethodMemberExpression(clsName + '.superclass.' + methodName + '.' + (args.length ? 'apply' : 'call'));
        return args.length ? t.callExpression(memberExpression, [t.thisExpression(), args[0]]) :
            t.callExpression(memberExpression, [t.thisExpression()]);
    }

    return {
        visitor: {
            CallExpression(path) {
                if (!isCallParentCallee(path.node.callee)) {
                    return;
                }
                const defineCall = path.findParent(isExtDefineCall);
                if (!defineCall) {
                    return; // throw?
                }

                const clsName = getClsName(defineCall.node);
                const clsMethod = path.findParent(isClassMethod);
                if (!clsMethod) {
                    return; // throw?
                }
                const methodName = clsMethod.node.key.name;

                const args = path.node.arguments;
                path.replaceWith(buildReplacement(clsName, methodName, args));
            }
        }
    };
};

