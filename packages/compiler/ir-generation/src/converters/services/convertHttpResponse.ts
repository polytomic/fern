import { CustomWireMessageEncoding, FernFilepath, HttpResponse } from "@fern-api/api";
import { RawSchemas } from "@fern-api/syntax-analysis";
import { convertEncoding } from "./convertEncoding";
import { convertResponseErrors } from "./convertResponseErrors";
import { convertServiceTypeDefinition } from "./convertServiceTypeDefinition";

export function convertHttpResponse({
    response,
    fernFilepath,
    imports,
    nonStandardEncodings,
}: {
    response: RawSchemas.HttpResponseSchema | undefined;
    fernFilepath: FernFilepath;
    imports: Record<string, string>;
    nonStandardEncodings: CustomWireMessageEncoding[];
}): HttpResponse {
    return {
        docs: typeof response !== "string" ? response?.docs : undefined,
        encoding: convertEncoding({
            rawEncoding: typeof response !== "string" ? response?.encoding : undefined,
            nonStandardEncodings,
        }),
        ok: convertServiceTypeDefinition({
            typeDefinition: typeof response !== "string" ? response?.ok : response,
            fernFilepath,
            imports,
        }),
        errors: convertResponseErrors({
            rawResponseErrors: typeof response !== "string" ? response?.errors : undefined,
            fernFilepath,
            imports,
        }),
    };
}