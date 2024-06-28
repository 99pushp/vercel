import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { downloadS3Folder, copyFinalDist } from "./aws";
import { buildProject } from "./utils";
import { createClient, commandOptions } from "redis";

require('dotenv').config();

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();


// Initialize the SQS client with access key, secret key, and region

const sqsClient = new SQSClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || " ",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    region: process.env.AWS_REGION || "" ,
    apiVersion: process.env.AWS_API_VERSION || ""
});

const queueUrl = process.env.QUEUE_URL ; // Replace with your SQS queue URL

async function main() {
    while (true) {
        try {
            const params = {
                QueueUrl: queueUrl,
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 10,
            };

            const data = await sqsClient.send(new ReceiveMessageCommand(params));

            if (data.Messages && data.Messages.length > 0) {
                const message = data.Messages[0];
                console.log("Received message:", message);

                const id = message.Body;
                if (typeof id === 'string') {
                    console.log('Processing message ID:', id);

                    try {
                        console.log('Downloading S3 folder...');
                        await downloadS3Folder(`output/${id}`);
                        console.log("Download completed");

                        console.log("Building project...");
                        await buildProject(id);
                        console.log("Build completed");

                        console.log("Copying final dist...");
                        await copyFinalDist(id);
                        console.log("Copy completed");
                        console.log('Adding deployed entry in DB');
                        publisher.hSet("status", id, "deployed")
                        // After processing the message, delete it from the queue
                        const deleteParams = {
                            QueueUrl: queueUrl,
                            ReceiptHandle: message.ReceiptHandle,
                        };
                        console.log('Deleting message with ReceiptHandle:', message.ReceiptHandle);
                        const deleteResponse = await sqsClient.send(new DeleteMessageCommand(deleteParams));
                        console.log('Delete response:', deleteResponse);
                        console.log('Message deleted successfully');
                        
                        publisher.hSet("status", id, "deployed")
                    } catch (processingError) {
                        console.error("Error processing the message:", processingError);
                    }
                } else {
                    console.error("Message body is not a string");
                }
            } else {
                console.log("No messages to process");
            }
        } catch (error) {
            console.error("Error receiving or deleting message from SQS", error);
        }

    
    }
}

main();
