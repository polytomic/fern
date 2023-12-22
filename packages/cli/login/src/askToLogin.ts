import { FernUserToken } from "@fern-api/auth";


export async function askToLogin(): Promise<FernUserToken> {
   const token = {type:"user", value:"fake-token"} as FernUserToken;
    return token;
}

// async function askForConfirmation(message: string) {
//     const name = "question";
//     const question: ConfirmQuestion<{ [name]: boolean }> = {
//         type: "confirm",
//         name,
//         message
//     };
//     const answers = await inquirer.prompt(question);
//     return answers[name];
// }
