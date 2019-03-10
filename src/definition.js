/**
 * Definition Module
 *
 * This file contains the code for finding the parent `Ext.define` or `Ext.override` definition for a `callParent` call.
 */
export default function initDefinitionFactory(t) {

    function isCalleeExtDefine(callee) {
        return t.isIdentifier(callee.property, {name: 'define'});
    }

    function isCalleeExtOverride(callee) {
        return t.isIdentifier(callee.property, {name: 'override'});
    }

    function isDefinition(extNames) {
        extNames = extNames || ['Ext'];
        return function isDefinition(path) {
            if (!path.isCallExpression()) {
                return false;
            }
            let callee = path.node.callee;
            return t.isMemberExpression(callee) &&
                t.isIdentifier(callee.object) && extNames.includes(callee.object.name) &&
                (isCalleeExtDefine(callee) || isCalleeExtOverride(callee));
        };
    }

    function getProtoPropFromObjectExpression(objectExpression) {
        return objectExpression.properties.find((prop) => {
            return t.isIdentifier(prop.key) && (prop.key.name === 'extend' || prop.key.name === 'override');
        });
    }

    const returnStatementVisitor = {
        ReturnStatement(path, state) {
            if (!path.findParent((p) => p.isFunctionExpression()) === state.functionExpression) {
                return;
            }
            path.stop(); // we've found the return statement, stop traversal
            let returnArg = path.get('argument');
            if (!returnArg.isObjectExpression()) {
                return;
            }
            state.returnArg = returnArg.node;
        }
    };

    function getFunctionDefineReturnObjectExpression(functionExpression) {
        let nestedVisitorState = { functionExpression, returnArg: null };
        functionExpression.traverse(returnStatementVisitor, nestedVisitorState);
        return nestedVisitorState.returnArg;
    }

    function getDefineProtoProp(bodyArg) {
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

    function buildMemberExpression(stringRef) {
        return stringRef.split('.').reduce((last, next) => {
            return last ? t.memberExpression(last, t.identifier(next)) : t.identifier(next);
        }, null);
    }

    function getPrototypeRef(prototypeValue) {
        return t.isStringLiteral(prototypeValue) ? buildMemberExpression(prototypeValue.value) : prototypeValue;
    }

    class AbstractDefinition {
        constructor(path) {
            this.path = path;
        }

        prependVariableRef(value) {
            const refVar = this.path.scope.generateUidIdentifier('o');
            this.path.insertBefore(t.variableDeclaration('var', [t.variableDeclarator(refVar,value)]));
            return refVar;
        }
    }

    class DefineDefinition extends AbstractDefinition {
        constructor(path) {
            super(path);

            const bodyArg = path.get('arguments.1');
            const protoProp = getDefineProtoProp(bodyArg);
            this.protoRef = protoProp ? getPrototypeRef(protoProp.value) : buildMemberExpression('Ext.Base');

            this.isOverride = protoProp && protoProp.key.name === 'override';
        }
    }

    class OverrideDefinition extends AbstractDefinition {
        constructor(path) {
            super(path);

            const prototypeValue = path.get('arguments.0').node;
            this.protoRef = getPrototypeRef(prototypeValue);

            this.isOverride = true;
        }
    }

    /**
     * Find the `Ext.define` or `Ext.override` definition
     *
     * If the `callParent` call is within an `Ext.define`, then a `DefineDefinition` is returned
     * If the `callParent` call is within an `Ext.override`, then a `OverrideDefinition` is returned
     *
     * In either case, they expose `protoRef`, `isOverride` properties, and a `createPrependedVariableRef` method which
     * is used for prepending the reference to the overriden method when the definition is overriding a class.
     */
    return function findParentDefinition(childPath, extNames) {
        const path = childPath.findParent(isDefinition(extNames));
        if (!path) {
            throw childPath.buildCodeFrameError("Unable to find 'Ext.define' or 'Ext.override' for this 'callParent'");
        }
        return isCalleeExtOverride(path.node.callee) ? new OverrideDefinition(path) : new DefineDefinition(path);
    }
}
