import express from "express";
import downloadFrom23andMeApi from "./app/downloadFrom23andMeApi";
import validateDownloadedFiles from "./app/validateDownloadedFiles";

const app = express();
const port = 3000;

/**
 * TODO: Create defined type/schema for return object from downloadFrom23andMeApi()!
 * 
 * TODO: Find out why nodemon won't work with files in src/
 */

app.get("/api/v1/download/", async (req, res) => {
    const responseObject: {success: boolean, data: object} = {
        success: false,
        data: {}
    }

    responseObject.data = await downloadFrom23andMeApi();

    responseObject.success = true;
    return res.status(200).json(responseObject);
});

app.get("/api/v1/validate/", async (req, res) => {
    const responseObject: {success: boolean, data: object} = {
        success: false,
        data: {}
    }

    responseObject.data = validateDownloadedFiles();

    responseObject.success = true;
    return res.status(200).json(responseObject);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
