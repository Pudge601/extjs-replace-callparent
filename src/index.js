
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

    function getProtoPropFromObjectExpression(objectExpression) {
        return objectExpression.properties.find((prop) => {
            return t.isIdentifier(prop.key) && (prop.key.name === 'extend' || prop.key.name === 'override');
        });
    }

    function getFunctionDefineReturnObjectExpression(functionExpression) {
        let objectExpression = null;
        functionExpression.traverse({
            ReturnStatement(path) {
                if (!path.findParent((p) => p.isFunctionExpression()) === functionExpression) {
                    return;
                }
                path.stop(); // we've found the return statement, stop traversal
                let returnArg = path.get('argument');
                if (!returnArg.isObjectExpression()) {
                    return;
                }
                objectExpression = returnArg.node;
            }
        });
        return objectExpression;
    }

    function getProtoProp(defineCall) {
        const bodyArg = defineCall.get('arguments.1');
        if (bodyArg.isObjectExpression()) {
            return getProtoPropFromObjectExpression(bodyArg.node);
        } else if (bodyArg.isFunctionExpression()) {
            let objectExpression = getFunctionDefineReturnObjectExpression(bodyArg);
            if (!objectExpression) {
                return;
            }
            return getProtoPropFromObjectExpression(objectExpression);
        }
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

    function buildReplacement(methodRef, args) {
        const memberExpression = buildMethodMemberExpression(methodRef + '.' + (args.length ? 'apply' : 'call'));
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

                const protoProp = getProtoProp(defineCall);
                if (!protoProp) {
                    return; // throw?
                }
                const clsMethod    = path.findParent(isClassMethod);
                if (!clsMethod) {
                    return; // throw?
                }
                const protoName = protoProp.value.value;
                const methodRef = protoName + '.prototype.' + clsMethod.node.key.name;

                const args = path.node.arguments;
                path.replaceWith(buildReplacement(methodRef, args));
            }
        }
    };
};

