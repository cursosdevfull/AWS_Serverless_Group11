import {
  AttributeValue,
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsCommandInput,
} from "@aws-sdk/client-eventbridge";
import {
  PublishCommand,
  PublishCommandInput,
  SNSClient,
} from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";

const clientSNS = new SNSClient();
const clientDynamoDB = new DynamoDBClient();
const clientEventBridge = new EventBridgeClient();

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

  console.log("params", params);

  const command = new PutItemCommand(params);
  console.log("command", command);
  await clientDynamoDB.send(command);
};

const updateMessage = async (
  tableName: string,
  appointmentId: string,
  status: string
) => {
  const params: UpdateItemCommandInput = {
    TableName: tableName,
    Key: {
      appointmentId: { S: appointmentId },
    },
    UpdateExpression: "SET #status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": { S: status },
    },
    ReturnValues: "ALL_NEW",
  };

  console.log("params", params);

  const command = new UpdateItemCommand(params);
  console.log("command", command);
  await clientDynamoDB.send(command);
};

const publishMessagePattern = async (
  busName: string,
  source: string,
  detailType: string,
  data: Record<string, any>
) => {
  const input: PutEventsCommandInput = {
    Entries: [
      {
        Source: source,
        DetailType: detailType,
        Detail: JSON.stringify(data),
        EventBusName: busName,
      },
    ],
  };

  const command = new PutEventsCommand(input);
  await clientEventBridge.send(command);
};

const eventApiGateway = async (event: any) => {
  console.log("body", event.body);

  const topicArn = process.env["TOPIC_ARN"] || "";
  const tableName = process.env["APPOINTMENT_TABLE"] || "";

  const body = JSON.parse(event.body);
  const identify = uuidv4();
  const item = {
    countryISO: { S: body.countryISO },
    scheduleId: { N: body.scheduleId.toString() },
    medicId: { N: body.medicId.toString() },
    centerId: { N: body.centerId.toString() },
    patientId: { S: body.patientId },
    status: { S: "PENDING" },
    appointmentId: { S: identify },
  };

  const message = {
    countryISO: body.countryISO,
    scheduleId: body.scheduleId.toString(),
    medicId: body.medicId.toString(),
    centerId: body.centerId.toString(),
    patientId: body.patientId,
    status: "PENDING",
    appointmentId: identify,
  };

  console.log("item", item);
  console.log("message", message);

  const eventBusName = process.env["EVENT_BUS_NAME"]
    ? process.env["EVENT_BUS_NAME"]
    : "";

  await publishMessage(topicArn, message);
  await saveMessage(tableName, item);
  await publishMessagePattern(
    eventBusName,
    "MOBILE",
    "APPOINTMENT_CREATED",
    message
  );
};

const eventSQS = async (event: any) => {
  const records = event.Records;
  const tableName = process.env["APPOINTMENT_TABLE"]
    ? process.env["APPOINTMENT_TABLE"]
    : "";
  for (const record of records) {
    const message = JSON.parse(record.body);
    const appointmentId = message.appointmentId;

    await updateMessage(tableName, appointmentId, "COMPLETED");
  }
};

export const execute = async (event: any) => {
  console.log("appointment handler called");

  if (event.Records) {
    console.log("event from SQS");
    await eventSQS(event);
  } else {
    console.log("event from API Gateway");
    await eventApiGateway(event);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "appointment handler called",
      input: JSON.stringify(event),
    }),
  };
};
