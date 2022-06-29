import { IntermediateRepresentation } from "@fern-fern/ir-model/ir";
import {
    createDirectoryAndExportFromModule,
    DependencyManager,
    GeneratedProjectSrcInfo,
    generateTypeScriptProject,
} from "@fern-typescript/commons";
import { generateEncoderFiles } from "@fern-typescript/encoders";
import { HelperManager } from "@fern-typescript/helper-manager";
import { generateModelFiles } from "@fern-typescript/model";
import { Volume } from "memfs/lib/volume";
import { Directory } from "ts-morph";
import { generateHttpService } from "./http/generateHttpService";

export async function generateServerProject({
    intermediateRepresentation,
    helperManager,
    packageName,
    packageVersion,
    volume,
}: {
    intermediateRepresentation: IntermediateRepresentation;
    helperManager: HelperManager;
    packageName: string;
    packageVersion: string | undefined;
    volume: Volume;
}): Promise<void> {
    await generateTypeScriptProject({
        volume,
        packageName,
        packageVersion,
        generateSrc: (directory) => generateServerFiles({ intermediateRepresentation, helperManager, directory }),
    });
}

async function generateServerFiles({
    intermediateRepresentation,
    helperManager,
    directory,
}: {
    intermediateRepresentation: IntermediateRepresentation;
    helperManager: HelperManager;
    directory: Directory;
}): Promise<GeneratedProjectSrcInfo> {
    const dependencyManager = new DependencyManager();

    const modelContext = generateModelFiles({
        modelDirectory: createDirectoryAndExportFromModule(directory, "model"),
        intermediateRepresentation,
        dependencyManager,
    });

    const servicesDirectory = createDirectoryAndExportFromModule(directory, "services");
    for (const service of intermediateRepresentation.services.http) {
        await generateHttpService({
            service,
            servicesDirectory,
            modelContext,
            helperManager,
            dependencyManager,
        });
    }

    await generateEncoderFiles({
        intermediateRepresentation,
        modelContext,
        servicesDirectory,
        helperManager,
    });

    return {
        dependencies: dependencyManager.getDependencies(),
    };
}