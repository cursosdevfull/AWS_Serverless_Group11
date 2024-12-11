import {
  InvokeCommand,
  InvokeCommandInput,
  LambdaClient,
} from "@aws-sdk/client-lambda";

export const trigger = async (event: any) => {
  const client = new LambdaClient();

  const parameters: InvokeCommandInput = {
    FunctionName: "lambda-destination-dev-appointment-pe",
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({ message: "trigger" }),
  };

  const command: InvokeCommand = new InvokeCommand(parameters);
  const result = await client.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
