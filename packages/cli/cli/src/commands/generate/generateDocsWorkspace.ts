import { askToLogin } from "@fern-api/login";
import { Project } from "@fern-api/project-loader";
import { runRemoteGenerationForDocsWorkspace } from "@fern-api/remote-workspace-runner";
import { convertOpenApiWorkspaceToFernWorkspace } from "@fern-api/workspace-loader";
import { CliContext } from "../../cli-context/CliContext";
import { validateDocsWorkspaceAndLogIssues } from "../validate/validateDocsWorkspaceAndLogIssues";

export async function generateDocsWorkspace({
    project,
    cliContext,
    instance,
    preview
}: {
    project: Project;
    cliContext: CliContext;
    instance: string | undefined;
    preview: boolean;
}): Promise<void> {
    const docsWorkspace = project.docsWorkspaces;
    if (docsWorkspace == null) {
        return;
    }

    const token = await cliContext.runTask(async () => {
        return askToLogin();
    });


    cliContext.instrumentPostHogEvent({
        orgId: project.config.organization,
        command: "fern generate --docs"
    });

    await cliContext.runTaskForWorkspace(docsWorkspace, async (context) => {
        await validateDocsWorkspaceAndLogIssues({ workspace: docsWorkspace, context, logWarnings: false });

        const fernWorkspaces = await Promise.all(
            project.apiWorkspaces.map(async (workspace) => {
                return workspace.type === "fern"
                    ? workspace
                    : await convertOpenApiWorkspaceToFernWorkspace(workspace, context);
            })
        );

        await runRemoteGenerationForDocsWorkspace({
            organization: project.config.organization,
            fernWorkspaces,
            docsWorkspace,
            context,
            token,
            instanceUrl: instance,
            preview
        });
    });
}
