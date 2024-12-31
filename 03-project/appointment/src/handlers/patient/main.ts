import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, GetObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const clientDynamoDB = new DynamoDBClient();
const clientS3 = new S3Client();

const streamToString = (stream: Readable) => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk) => {
      chunks.push(chunk);
    });
    stream.on("error", reject);
    stream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
  });
};

const getContent = async (bucketName: string, key: string): Promise<string> => {
  const input: GetObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
  };
  const command = new GetObjectCommand(input);
  const response = await clientS3.send(command);
  return (await streamToString(response.Body as Readable)) as Promise<string>;
};

const getInfoPatients = (content: string) => {
  return content.split("\n").map((line) => line.split(","));
};

const savePatients = async (infoPatients: any[]) => {
  for (const infoPatient of infoPatients) {
    const [patientId, name, lastname, email] = infoPatient;
    const payload = {
      patientId: { S: patientId },
      name: { S: name },
      lastname: { S: lastname },
      email: { S: email },
    };

    const tableName = process.env["PATIENT_TABLE"]
      ? process.env["PATIENT_TABLE"]
      : "";
    const params: PutItemCommandInput = {
      TableName: tableName,
      Item: payload,
    };

    console.log("params", params);

    const command = new PutItemCommand(params);
    console.log("command", command);
    await clientDynamoDB.send(command);
  }
};

const eventS3 = async (record: any) => {
  const bucketName = record.s3.bucket.name;
  const key = record.s3.object.key;

  const content = await getContent(bucketName, key);
  const infoPatients = getInfoPatients(content);
  await savePatients(infoPatients);
};

export const execute = async (event: any) => {
  console.log("patient handler called");

  if (event.Records && event.Records.length > 0) {
    for (const record of event.Records) {
      console.log("record", record);
      await eventS3(record);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "appointment handler called",
      input: JSON.stringify(event),
    }),
  };
};
