import { ContainerType, ModelReference, PrimitiveType, TypeReference } from "@fern-api/api";
import { Directory, SourceFile, ts } from "ts-morph";
import { getModelTypeReference } from "./getModelTypeReference";

export function getTypeReference({
    reference,
    referencedIn,
    modelDirectory,
    forceUseNamespaceImport,
}: {
    reference: TypeReference;
    referencedIn: SourceFile;
    modelDirectory: Directory;
    forceUseNamespaceImport?: getModelTypeReference.Args["forceUseNamespaceImport"];
}): ts.TypeNode {
    return TypeReference._visit<ts.TypeNode>(reference, {
        named: (typeName) =>
            getModelTypeReference({
                reference: ModelReference.type(typeName),
                referencedIn,
                modelDirectory,
                forceUseNamespaceImport,
            }),
        primitive: (primitive) => {
            return PrimitiveType._visit<ts.TypeNode>(primitive, {
                boolean: () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
                double: () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
                integer: () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
                long: () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
                string: () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                _unknown: () => {
                    throw new Error("Unexpected primitive type: " + primitive);
                },
            });
        },
        container: (container) => {
            return ContainerType._visit<ts.TypeNode>(container, {
                map: (map) =>
                    ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Record"), [
                        getTypeReference({
                            reference: map.keyType,
                            referencedIn,
                            modelDirectory,
                        }),
                        getTypeReference({
                            reference: map.valueType,
                            referencedIn,
                            modelDirectory,
                        }),
                    ]),
                list: (list) =>
                    ts.factory.createArrayTypeNode(getTypeReference({ reference: list, referencedIn, modelDirectory })),
                set: (set) =>
                    ts.factory.createArrayTypeNode(getTypeReference({ reference: set, referencedIn, modelDirectory })),
                optional: (optional) =>
                    ts.factory.createUnionTypeNode([
                        getTypeReference({
                            reference: optional,
                            referencedIn,
                            modelDirectory,
                        }),
                        ts.factory.createLiteralTypeNode(ts.factory.createNull()),
                        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
                    ]),
                _unknown: () => {
                    throw new Error("Unexpected container type: " + container._type);
                },
            });
        },
        unknown: () => {
            return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
        },
        void: () => {
            return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Record"), [
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
            ]);
        },
        _unknown: () => {
            throw new Error("Unexpected type reference: " + reference._type);
        },
    });
}
