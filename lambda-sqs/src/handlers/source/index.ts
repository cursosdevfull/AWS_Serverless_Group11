import {
  SendMessageCommand,
  SendMessageCommandInput,
  SQSClient,
} from "@aws-sdk/client-sqs";

const client = new SQSClient();

export const execute = async (event: any) => {
  const sqsUrl = process.env.SQS_URL;
  //const values = JSON.parse(event.body);

  const params: SendMessageCommandInput = {
    QueueUrl: sqsUrl,
    MessageBody: event.body,
  };
  console.log("Sending message to SQS", params);
  const command = new SendMessageCommand(params);
  console.log("Command", command);
  const result = await client.send(command);
  console.log("Result", result);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
