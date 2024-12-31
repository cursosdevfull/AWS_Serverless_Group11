import {
  SendMessageCommand,
  SendMessageCommandInput,
  SQSClient,
} from "@aws-sdk/client-sqs";

const client = new SQSClient();

export const execute = async (event: any) => {
  console.log("appointment handler called");

  const { countryISO } = JSON.parse(event.body);
  const sqsUrl = process.env[`SQS_URL_${countryISO}`];

  const params: SendMessageCommandInput = {
    QueueUrl: sqsUrl,
    MessageBody: event.body,
  };

  const command = new SendMessageCommand(params);
  await client.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "appointment handler called",
      input: event,
    }),
  };
};
