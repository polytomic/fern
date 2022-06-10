import { WorkspaceDefinitionSchema } from "@fern-api/compiler-commons";
import { addJavaGenerator, addTypescriptGenerator } from "../addGenerator";

describe("addGenerator", () => {
    it("adds generator if not present", () => {
        const workspaceDefinition: WorkspaceDefinitionSchema = {
            definition: "./src",
            generators: [],
        };
        const updatedWorkspaceDefinition = addJavaGenerator(workspaceDefinition);
        expect(updatedWorkspaceDefinition.generators?.length).toEqual(1);
    });

    it("skip if present", () => {
        const workspaceDefinition: WorkspaceDefinitionSchema = {
            definition: "./src",
            generators: [
                {
                    name: "fernapi/fern-typescript",
                    version: "0.0.23",
                },
            ],
        };
        const updatedWorkspaceDefinition = addTypescriptGenerator(workspaceDefinition);
        expect(updatedWorkspaceDefinition).toEqual(workspaceDefinition);
    });
});
