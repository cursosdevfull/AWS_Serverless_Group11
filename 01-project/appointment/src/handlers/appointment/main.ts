import {
  InvokeCommand,
  InvokeCommandInput,
  LambdaClient,
} from "@aws-sdk/client-lambda";

const client = new LambdaClient();

export const execute = async (event: any) => {
  console.log("appointment handler called");

  const { countryISO } = JSON.parse(event.body);
  const lambdaNameToInvoke = process.env[`APPOINTMENT_${countryISO}`];

  const params: InvokeCommandInput = {
    FunctionName: lambdaNameToInvoke,
    Payload: event.body,
  };

  const command = new InvokeCommand(params);
  await client.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "appointment handler called",
      input: event,
    }),
  };
};
