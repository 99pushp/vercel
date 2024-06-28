const aws = require('aws-sdk');
require('dotenv').config();
const sqs = new aws.SQS({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region:process.env.AWS_REGION,
    apiVersion: process.env.AWS_API_VERSION,
    MessageGroupId : process.env.MESSAGE_GROUP_ID
});

const queueURL = process.env.QUEUE_URL

export const sendMessage = async (messageBody:string) => {
    const params = {
        QueueUrl: queueURL,
        MessageBody: messageBody,
        MessageGroupId : "vercel-queue-group",
        MessageDeduplicationId:"vercel-queue-group-dup"
    };

    try {
        const data = await sqs.sendMessage(params).promise();
        console.log("Message sent, ID:", data.MessageId);
        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        console.log("at time:",currentTimeInSeconds)
    } catch (err) {
        console.error("Error", err);
    }
};


