
export default function ({ types: t }) {

    function isThisOrMeExpression(node) {
        return t.isThisExpression(node) || t.isIdentifier(node, { name: 'me' });
    }

    function isCallParentCallee(node) {
        return t.isMemberExpression(node) &&
            isThisOrMeExpression(node.object) &&
            t.isIdentifier(node.property, { name: 'callParent' });
    }

    function isMethodCall(methodName, extNames) {
        extNames = extNames || ['Ext'];
        return function (path) {
            if (!path.isCallExpression()) {
                return false;
            }
            let callee = path.node.callee;
            return t.isMemberExpression(callee) &&
                t.isIdentifier(callee.object) && extNames.includes(callee.object.name) &&
                t.isIdentifier(callee.property, { name: methodName });
        };
    }

    function isExtDefineCall(extNames) {
        return isMethodCall('define', extNames);
    }

    function isExtOverrideCall(extNames) {
        return isMethodCall('override', extNames);
    }

    function getProtoPropFromObjectExpression(objectExpression) {
        return objectExpression.properties.find((prop) => {
            return t.isIdentifier(prop.key) && (prop.key.name === 'extend' || prop.key.name === 'override');
        });
    }

    function getProtoPropStringLiteral(stringLiteral) {
        return stringLiteral.node;
    }

    const returnStatementVisitor = {
        ReturnStatement(path) {
            if (!path.findParent((p) => p.isFunctionExpression()) === this.functionExpression) {
                return;
            }
            path.stop(); // we've found the return statement, stop traversal
            let returnArg = path.get('argument');
            if (!returnArg.isObjectExpression()) {
                return;
            }
            this.returnArg = returnArg.node;
        }
    };

    function getFunctionDefineReturnObjectExpression(functionExpression) {
        let nestedVisitorState = { functionExpression, returnArg: null };
        functionExpression.traverse(returnStatementVisitor, nestedVisitorState);
        return nestedVisitorState.returnArg;
    }

    function getProtoProp({ defineCall, overrideCall }) {
        const bodyArg = defineCall ? defineCall.get('arguments.1') : overrideCall.get('arguments.0');
        if (bodyArg.isObjectExpression()) {
            return getProtoPropFromObjectExpression(bodyArg.node);
        } else if (bodyArg.isFunctionExpression()) {
            let objectExpression = getFunctionDefineReturnObjectExpression(bodyArg);
            if (!objectExpression) {
                return;
            }
            return getProtoPropFromObjectExpression(objectExpression);
        } else if (bodyArg.isStringLiteral()) {
            return getProtoPropStringLiteral(bodyArg);
        }
    }

    function getDefineOverrideMethodRef(methodRef, defineCall) {
        const methodRefVar = defineCall.scope.generateUidIdentifier('o');
        defineCall.insertBefore(
            t.variableDeclaration(
                'var',
                [
                    t.variableDeclarator(
                        methodRefVar,
                        methodRef
                    )
                ]
            )
        );
        return methodRefVar;
    }

    function isClassMethod(path) {
        return (path.isObjectProperty() && t.isFunction(path.node.value)) ||
            path.isObjectMethod();
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

        if (t.isStringLiteral(protoProp))
            return buildMemberExpression(protoProp.value);

        return t.isStringLiteral(protoProp.value) ? buildMemberExpression(protoProp.value.value) : protoProp.value;
    }

    return {
        visitor: {
            CallExpression(path, state) {
                if (!isCallParentCallee(path.node.callee)) {
                    return;
                }
                const defineCall = path.findParent(isExtDefineCall(state.opts.extNames))
                const overrideCall = path.findParent(isExtOverrideCall(state.opts.extNames));
                if (!defineCall && !overrideCall) {
                    throw path.buildCodeFrameError("Unable to find 'Ext.define' or 'Ext.override for this 'callParent'");
                }

                const clsMethod = path.findParent(isClassMethod);
                if (!clsMethod) {
                    throw path.buildCodeFrameError("Unable to find method declaration for this 'callParent'");
                }
                const methodName = clsMethod.node.key.name;

                const protoProp = getProtoProp({ defineCall, overrideCall });
                const isDefineOverride = protoProp && protoProp.key && protoProp.key.name === 'override';
                const protoRef = getProtoRef(protoProp);

                let methodRef = buildMethodRef(protoRef, methodName);
                if (overrideCall || isDefineOverride) {
                    methodRef = getDefineOverrideMethodRef(methodRef, (defineCall || overrideCall));
                }

                const args = path.node.arguments;
                path.replaceWith(buildReplacement(methodRef, args));
            }
        }
    };
};
