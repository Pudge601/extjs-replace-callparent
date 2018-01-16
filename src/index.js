
module.exports = function({ types: t }) {

    function isThisOrMeExpression(node) {
        return t.isThisExpression(node) ||
            (t.isIdentifier(node) && (node.name === 'this' || node.name === 'me'));
    }

    function isCallParentCallee(node) {
        return t.isMemberExpression(node) &&
            isThisOrMeExpression(node.object) &&
            t.isIdentifier(node.property, {name: 'callParent'});
    }

    function isExtDefineCall(extNames) {
        extNames = extNames || ['Ext'];
        return function (path) {
            if (!path.isCallExpression()) {
                return false;
            }
            let callee = path.node.callee;
            return t.isMemberExpression(callee) &&
                t.isIdentifier(callee.object) && extNames.includes(callee.object.name) &&
                t.isIdentifier(callee.property, {name: 'define'});
        };
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

    function getOverrideMethodRef(protoRef, methodName, defineCall) {
        const defineCls    = defineCall.get('arguments.0').node.value;
        const methodRefVar = '_' + (defineCls + '_' + methodName).replace(/\W/g, '_') + '_original';
        defineCall.insertBefore(
            t.variableDeclaration(
                'var',
                [
                    t.variableDeclarator(
                        t.identifier(methodRefVar),
                        buildMethodRef(protoRef, methodName)
                    )
                ]
            )
        );
        return t.identifier(methodRefVar);
    }

    function isClassMethod(path) {
        return path.isObjectProperty() &&
            t.isFunction(path.node.value);
    }

    function buildMemberExpression(stringRef) {
        return stringRef.split('.').reduce((last, next) => {
            return last ? t.memberExpression(last, t.identifier(next)) : t.identifier(next);
        }, null);
    }

    function buildMethodRef(protoRef, methodName) {
        return t.memberExpression(
            t.logicalExpression(
                '||',
                t.memberExpression(protoRef, t.identifier('prototype')),
                protoRef
            ),
            t.identifier(methodName)
        );
    }

    function buildReplacement(methodRef, args) {
        const memberExpression = t.memberExpression(methodRef, t.identifier(args.length ? 'apply' : 'call'));
        return args.length ? t.callExpression(memberExpression, [t.thisExpression(), args[0]]) :
            t.callExpression(memberExpression, [t.thisExpression()]);
    }

    function getProtoRef(protoProp) {
        if (!protoProp) {
            return buildMemberExpression('Ext.Base');
        }
        return t.isStringLiteral(protoProp.value) ? buildMemberExpression(protoProp.value.value) : protoProp.value;
    }

    return {
        visitor: {
            CallExpression(path, state) {
                if (!isCallParentCallee(path.node.callee)) {
                    return;
                }
                const defineCall = path.findParent(isExtDefineCall(state.opts.extNames));
                if (!defineCall) {
                    return; // throw?
                }

                const clsMethod    = path.findParent(isClassMethod);
                if (!clsMethod) {
                    return; // throw?
                }
                const methodName = clsMethod.node.key.name;

                const protoProp  = getProtoProp(defineCall);
                const isOverride = protoProp && protoProp.key.name === 'override';
                const protoRef   = getProtoRef(protoProp);
                let methodRef;
                if (isOverride) {
                    methodRef = getOverrideMethodRef(protoRef, methodName, defineCall);
                } else {
                    methodRef = buildMethodRef(protoRef, methodName);
                }

                const args = path.node.arguments;
                path.replaceWith(buildReplacement(methodRef, args));
            }
        }
    };
};

