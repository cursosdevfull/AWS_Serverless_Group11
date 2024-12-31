import { AttributeValue, DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { PublishCommand, PublishCommandInput, SNSClient } from '@aws-sdk/client-sns';

const clientSNS = new SNSClient();
const clientDynamoDB = new DynamoDBClient();

const publishMessage = async (topicArn: string, payload: object) => {
  const params: PublishCommandInput = {
    TopicArn: topicArn,
    Message: JSON.stringify(payload),
  };

  console.log("params", params);

  console.log("payload", payload);

  const command = new PublishCommand(params);
  const result = await clientSNS.send(command);
  console.log("result", result);
};

const saveMessage = async (
  tableName: string,
  payload: Record<string, AttributeValue>
) => {
  const params: PutItemCommandInput = {
    TableName: tableName,
    Item: payload,
  };

  const command = new PutItemCommand(params);
  await clientDynamoDB.send(command);
};

export const execute = async (event: any) => {
  console.log("appointment handler called");
  const tableName = process.env["APPOINTMENT_TABLE"] || "";
  const topic = process.env["TOPIC_ARN"] || "";

  const records = event.Records;
  console.log("records", records);

  for (const record of records) {
    const body = JSON.parse(record.body);

    const item: Record<string, AttributeValue> = {
      countryISO: { S: body.countryISO },
      scheduleId: { N: body.scheduleId.toString() },
      medicId: { N: body.medicId.toString() },
      centerId: { N: body.centerId.toString() },
      patientId: { S: body.patientId },
      status: { S: "COMPLETED" },
      appointmentId: { S: body.appointmentId },
    };

    console.log("item", item);

    await saveMessage(tableName, item);
    await publishMessage(topic, { appointmentId: body.appointmentId });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "appointment handler called",
      input: event,
    }),
  };
};
