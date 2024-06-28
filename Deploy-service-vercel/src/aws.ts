import { S3 } from "aws-sdk";
import { log } from "console";
import fs from "fs";
import path from "path";
require('dotenv').config();
const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION // Make sure to include the region
});


// replace with your own credentials

export async function downloadS3Folder(prefix: string) {
    try {
        console.log('Starting download from S3 folder');
        
        const allFiles = await s3.listObjectsV2({
            Bucket: "s3-vercel",
            Prefix: prefix
        }).promise();

        if (!allFiles.Contents || allFiles.Contents.length === 0) {
            console.log("No files found");
            return;
        }

        const allPromises = allFiles.Contents.map(({ Key }) => {
            return new Promise((resolve, reject) => {
                if (!Key) {
                    resolve("");
                    return;
                }

                const finalOutputPath = path.join(__dirname, Key);
                const outputFile = fs.createWriteStream(finalOutputPath);
                const dirName = path.dirname(finalOutputPath);

                // Check if the directory exists, if not create it
                if (!fs.existsSync(dirName)) {
                    fs.mkdirSync(dirName, { recursive: true });
                }

                s3.getObject({
                    Bucket: "s3-vercel",
                    Key
                }).createReadStream()
                .on("error", (err) => {
                    reject(err);
                })
                .pipe(outputFile)
                .on("finish", () => {
                    console.log(`Downloaded: ${Key}`);
                    resolve("");
                })
                .on("error", (err) => {
                    reject(err);
                });
            });
        });

        console.log("Awaiting file downloads");
        await Promise.all(allPromises);
        console.log("All files downloaded successfully");
    } catch (error) {
        console.error("Error downloading S3 folder", error);
    }
}
///////////////////////////////////////////////////////////////////////////////

export function copyFinalDist(id: string) {
    console.log('in copy final dist function:');
    //const folderPath = path.join(__dirname, `output/${id}/build`); // Ensure this path matches the downloaded folder structure
    const folderPath = path.join(__dirname, `output/${id}/dist`);
    console.log('Folder path to copy:', folderPath);
    
    if (!fs.existsSync(folderPath)) {
        console.error('Directory does not exist:', folderPath);
        return;
    }
    
    const allFiles = getAllFiles(folderPath);
    allFiles.forEach(file => {
        uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
    });
    console.log('ending of the copy file dist');
}

const getAllFiles = (folderPath: string) => {
    log('in get all files function')
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        } else {
            response.push(fullFilePath);
        }
    });
    return response;
}

const uploadFile = async (fileName: string, localFilePath: string) => {
    console.log('uploading back to s3:', fileName);
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "s3-vercel",
        Key: fileName,
    }).promise();
    console.log(response);
}
