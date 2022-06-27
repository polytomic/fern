import path from "path";
import * as webpack from "webpack";

export default (): webpack.Configuration => {
    const { PACKAGE_VERSION } = process.env;
    if (PACKAGE_VERSION == null) {
        throw new Error("Cannot bundle because PACKAGE_VERSION is not defined.");
    }

    return {
        mode: "production",
        target: "node",
        entry: path.join(__dirname, "../src/cli.ts"),
        module: {
            rules: [
                {
                    test: /\.js$/,
                    resolve: {
                        fullySpecified: false,
                    },
                },
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                    options: {
                        projectReferences: true,
                        configFile: "tsconfig.esm.json",
                    },
                    exclude: /node_modules/,
                },
                {
                    test: /\.node$/,
                    loader: "node-loader",
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".js"],
        },
        plugins: [new webpack.EnvironmentPlugin(["PACKAGE_VERSION"])],
        output: {
            path: path.join(__dirname, "dist"),
            filename: "bundle.js",
        },
    };
};
