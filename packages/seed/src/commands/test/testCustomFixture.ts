import { AbsoluteFilePath, join } from "@fern-api/fs-utils";
import { GenerationLanguage } from "@fern-api/generators-configuration";
import { LogLevel } from "@fern-api/logger";
import tmp from "tmp-promise";
import { ParsedDockerName } from "../../cli";
import { SeedWorkspace } from "../../loadSeedWorkspaces";
import { Semaphore } from "../../Semaphore";
import { TaskContextFactory } from "./TaskContextFactory";
import { acquireLocksAndRunTest } from "./testWorkspaceFixtures";

export async function testCustomFixture({
    pathToFixture,
    workspace,
    irVersion,
    language,
    docker,
    logLevel,
    numDockers
}: {
    pathToFixture: AbsoluteFilePath;
    workspace: SeedWorkspace;
    irVersion: string | undefined;
    language: GenerationLanguage | undefined;
    docker: ParsedDockerName;
    logLevel: LogLevel;
    numDockers: number;
}): Promise<void> {
    const lock = new Semaphore(numDockers);
    const outputDir = await tmp.dir();
    const absolutePathToOutput = AbsoluteFilePath.of(outputDir.path);
    const taskContextFactory = new TaskContextFactory(logLevel);

    const taskContext = taskContextFactory.create(`${workspace.workspaceName}:${"custom"} -`);

    const result = await acquireLocksAndRunTest({
        absolutePathToWorkspace: join(pathToFixture),
        lock,
        irVersion,
        outputVersion: undefined,
        language,
        fixture: "custom",
        docker,
        scripts: undefined,
        customConfig: {},
        taskContext,
        outputDir: absolutePathToOutput,
        outputMode: "github",
        outputFolder: "custom",
        id: "custom"
    });

    if (result.type === "failure") {
        taskContext.logger.error(`Encountered error with ${result.reason}`);
    } else {
        taskContext.logger.info(`Wrote files to ${absolutePathToOutput}`);
    }
}
