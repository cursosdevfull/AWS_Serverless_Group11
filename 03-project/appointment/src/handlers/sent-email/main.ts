import {
  GetObjectCommand,
  GetObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  SendEmailCommand,
  SendEmailCommandInput,
  SESClient,
} from "@aws-sdk/client-ses";
import { Readable } from "stream";
import * as velocity from "velocityjs";

const clientS3 = new S3Client();
const clientSES = new SESClient();

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

  console.log("input", input);

  const command = new GetObjectCommand(input);
  const response = await clientS3.send(command);
  return (await streamToString(response.Body as Readable)) as Promise<string>;
};

const replaceParameters = (content: string, data: Record<string, string>) => {
  return velocity.render(content, data);
};

const sentEmail = async (
  dest: string,
  sender: string,
  content: string,
  subject: string
) => {
  const input: SendEmailCommandInput = {
    Destination: {
      ToAddresses: [dest],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: content,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: sender,
  };

  const command = new SendEmailCommand(input);
  await clientSES.send(command);
};

export const execute = async (event: any) => {
  console.log("sent email handler called");

  const records = event.Records;
  console.log("records", records);

  for (const record of records) {
    console.log("body", record.body);

    const { templateName, bucketName, name, lastname, email, subject } =
      JSON.parse(record.body);

    const content = await getContent(
      bucketName,
      `templates/${templateName}/index.html`
    );
    const contentToSent = replaceParameters(content, { name, lastname });
    console.log("contentToSent", contentToSent);

    await sentEmail(email, email, contentToSent, subject);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "sent email handler called",
      input: event,
    }),
  };
};
