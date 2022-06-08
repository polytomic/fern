import { HttpEndpoint, HttpService } from "@fern-api/api";
import { getTypeReference } from "@fern-typescript/commons";
import { HelperManager } from "@fern-typescript/helper-manager";
import { Directory, SourceFile, ts } from "ts-morph";
import { ClientConstants } from "../../../constants";
import { GeneratedEndpointTypes } from "../generate-endpoint-types/types";
import { EndpointTypeName } from "../getLocalEndpointTypeReference";
import { generateEncoderCall } from "./generateEncoderCall";

export async function generateReturnResponse({
    serviceFile,
    serviceDefinition,
    endpoint,
    endpointTypes,
    getReferenceToLocalEndpointType,
    modelDirectory,
    helperManager,
}: {
    serviceFile: SourceFile;
    serviceDefinition: HttpService;
    endpoint: HttpEndpoint;
    endpointTypes: GeneratedEndpointTypes;
    getReferenceToLocalEndpointType: (typeName: EndpointTypeName) => ts.TypeReferenceNode;
    modelDirectory: Directory;
    helperManager: HelperManager;
}): Promise<ts.Statement> {
    return ts.factory.createIfStatement(
        ts.factory.createCallExpression(
            ts.factory.createIdentifier(ClientConstants.HttpService.ServiceUtils.Imported.IS_RESPONSE_OK_FUNCTION),
            undefined,
            [ts.factory.createIdentifier(ClientConstants.HttpService.Endpoint.Variables.ENCODED_RESPONSE)]
        ),
        ts.factory.createBlock(
            await generateReturnSuccessResponse({
                serviceFile,
                serviceDefinition,
                endpoint,
                endpointTypes,
                getReferenceToLocalEndpointType,
                modelDirectory,
                helperManager,
            })
        ),
        ts.factory.createBlock(
            await generateReturnErrorResponse({
                serviceDefinition,
                endpoint,
                endpointTypes,
                getReferenceToLocalEndpointType,
                helperManager,
            })
        )
    );
}

async function generateReturnSuccessResponse({
    serviceFile,
    serviceDefinition,
    endpoint,
    endpointTypes,
    getReferenceToLocalEndpointType,
    modelDirectory,
    helperManager,
}: {
    serviceFile: SourceFile;
    serviceDefinition: HttpService;
    endpoint: HttpEndpoint;
    endpointTypes: GeneratedEndpointTypes;
    getReferenceToLocalEndpointType: (typeName: EndpointTypeName) => ts.TypeReferenceNode;
    modelDirectory: Directory;
    helperManager: HelperManager;
}): Promise<ts.Statement[]> {
    const statements: ts.Statement[] = [];

    const properties: ts.ObjectLiteralElementLike[] = getBaseResponseProperties({ ok: true });

    if (endpointTypes.response.successBodyReference != null) {
        const decodeResponseStatement = await generateDecodeResponse({
            helperManager,
            endpoint,
            endpointTypes,
            serviceDefinition,
            decodedVariableName: ClientConstants.HttpService.Endpoint.Variables.DECODED_RESPONSE,
            wireMessageType: "Response",
        });
        statements.push(decodeResponseStatement);

        properties.push(
            ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier(
                    ClientConstants.HttpService.Endpoint.Types.Response.Success.Properties.Body.PROPERTY_NAME
                ),
                ts.factory.createAsExpression(
                    ts.factory.createIdentifier(ClientConstants.HttpService.Endpoint.Variables.DECODED_RESPONSE),
                    endpointTypes.response.successBodyReference.isLocal
                        ? getReferenceToLocalEndpointType(endpointTypes.response.successBodyReference.typeName)
                        : getTypeReference({
                              reference: endpointTypes.response.successBodyReference.typeReference,
                              referencedIn: serviceFile,
                              modelDirectory,
                          })
                )
            )
        );
    }

    const returnStatement = ts.factory.createReturnStatement(
        ts.factory.createObjectLiteralExpression(properties, true)
    );
    statements.push(returnStatement);

    return statements;
}

async function generateReturnErrorResponse({
    serviceDefinition,
    endpoint,
    endpointTypes,
    getReferenceToLocalEndpointType,
    helperManager,
}: {
    serviceDefinition: HttpService;
    endpoint: HttpEndpoint;
    endpointTypes: GeneratedEndpointTypes;
    getReferenceToLocalEndpointType: (typeName: EndpointTypeName) => ts.TypeReferenceNode;
    helperManager: HelperManager;
}): Promise<ts.Statement[]> {
    const decodeErrorStatement = await generateDecodeResponse({
        helperManager,
        endpoint,
        endpointTypes,
        serviceDefinition,
        decodedVariableName: ClientConstants.HttpService.Endpoint.Variables.DECODED_ERROR,
        wireMessageType: "Error",
    });

    const returnStatement = ts.factory.createReturnStatement(
        ts.factory.createObjectLiteralExpression(
            [
                ...getBaseResponseProperties({ ok: false }),
                ts.factory.createPropertyAssignment(
                    ts.factory.createIdentifier(
                        ClientConstants.HttpService.Endpoint.Types.Response.Error.Properties.Body.PROPERTY_NAME
                    ),
                    ts.factory.createAsExpression(
                        ts.factory.createIdentifier(ClientConstants.HttpService.Endpoint.Variables.DECODED_ERROR),
                        getReferenceToLocalEndpointType(
                            ClientConstants.HttpService.Endpoint.Types.Response.Error.Properties.Body.TYPE_NAME
                        )
                    )
                ),
            ],
            true
        )
    );

    return [decodeErrorStatement, returnStatement];
}

function getBaseResponseProperties({ ok }: { ok: boolean }): ts.ObjectLiteralElementLike[] {
    return [
        ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(ClientConstants.HttpService.Endpoint.Types.Response.Properties.OK),
            ok ? ts.factory.createTrue() : ts.factory.createFalse()
        ),
        ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(ClientConstants.HttpService.Endpoint.Types.Response.Properties.STATUS_CODE),
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(ClientConstants.HttpService.Endpoint.Variables.ENCODED_RESPONSE),
                ts.factory.createIdentifier(ClientConstants.HttpService.ServiceUtils.Fetcher.Response.STATUS_CODE)
            )
        ),
    ];
}

async function generateDecodeResponse({
    helperManager,
    endpointTypes,
    serviceDefinition,
    endpoint,
    decodedVariableName,
    wireMessageType,
}: {
    helperManager: HelperManager;
    endpointTypes: GeneratedEndpointTypes;
    serviceDefinition: HttpService;
    endpoint: HttpEndpoint;
    decodedVariableName: string;
    wireMessageType: "Response" | "Error";
}): Promise<ts.Statement> {
    const decoder = await helperManager.getEncoderForEncoding(endpointTypes.response.encoding);
    const decodedResponse = generateEncoderCall({
        encoder: decoder,
        method: "decode",
        variableReference: {
            _type: "wireMessage",
            wireMessageType,
            serviceName: serviceDefinition.name.name,
            endpointId: endpoint.endpointId,
            variable: ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(ClientConstants.HttpService.Endpoint.Variables.ENCODED_RESPONSE),
                ts.factory.createIdentifier(ClientConstants.HttpService.ServiceUtils.Fetcher.Response.BODY)
            ),
        },
    });

    return ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
            [
                ts.factory.createVariableDeclaration(
                    ts.factory.createIdentifier(decodedVariableName),
                    undefined,
                    undefined,
                    decodedResponse
                ),
            ],
            ts.NodeFlags.Const
        )
    );
}