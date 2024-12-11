import { LambdaClient } from "@aws-sdk/client-lambda";

const client = new LambdaClient();

export const execute = async (event: any) => {
  console.log("appointment handler called");

  const body = JSON.parse(event.body);
  const { countryISO } = body;

  const lambdaLogicId = process.env[`APPOINTMENT_${countryISO}`];
  console.log("lambdaLogicId", lambdaLogicId);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "appointment handler called",
      input: event,
    }),
  };
};
