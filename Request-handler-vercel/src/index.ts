import express from "express";
import { S3 } from "aws-sdk";
require('dotenv').config();
const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})



const app = express();


app.get("/*", async(req,res) =>{
    /**
     * 
     * When a request is made to the root route /, 
     * the server extracts the subdomain from the hostname and sends it back in the response.
    For instance, if the request is made to foo.example.com,
    the server will respond with The subdomain is: foo.
    id.vercel.com
    extract the 'id'
     */

    // 123.vercel.com ===> 127.0.0.1


    const host = req.hostname; //id.vercel.com

    const id = host.split(".")[0]; //[id,xyz]

    const filePath = req.path;
    console.log('file path:',filePath);

    const contents = await s3.getObject({
        Bucket: "s3-vercel",
        Key: `dist/${id}${filePath}`
    }).promise();
    
    const type = filePath.endsWith("html") ? "text/html" : filePath.endsWith("css") ? "text/css" : "application/javascript"
    res.set("Content-Type", type);

    res.send(contents.Body);
    console.log(id);
})


app.listen(3001,()=>{console.log('server started at port 3001')});