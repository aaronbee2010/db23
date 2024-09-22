import * as fs from "fs";
import * as crypto from "crypto";
import Accession from "../types/accession";
import AccessionResponse from "../types/accessionResponse";

/**
 * TODO: Migrate verification functions to separate class when program is complete.
 */

const downloadFrom23andMeApi = async (): Promise<object> => {
    const dl = new Download();

    /**
     * Make sure folders where our downloaded data will be stored exist before continuing with the rest of this procedure.
     */
    dl.createFoldersIfNotExists();

    /**
     * Check if accessions JSON exists and has a valid checksum. If false, we'll download it then check it's checksum is valid.
     * 
     * We'll repeat this download/check procedure a maximum of 5 times. If we fail to download a valid JSON after 5 attempts, we will throw an exception.
     */
    await dl.verifyAndGetAccessions();

    /**
     * Start downloading markers for each accession simultaneously.
     * We don't want to start downloads for all accessions at once or we risk getting our IP tempbanned for sending requests too frequently.
     * What we'll do in that case is set a 5 second delay between downloads for each accession.
     * 
     * For each accession, we'll download a set of 10000 markers at a time. Once all markers for an accession are downloaded, we'll sort the markers for that accession
     * then write the sorted markers to a JSON file.
     */
    await dl.getMarkersForAllAccessions();

    return dl.getReturnObject();
}

class Download {
    private startTimestamp: number = 0;

    private returnObject: any = {
        runtimeDurationInSeconds: 0,
        accessionDownloadAttemptCount: 0
    };

    private accessions: Accession[] = [];

    public constructor() {
        this.startTimestamp = Math.floor( Date.now() / 1000 );
    }

    public createFoldersIfNotExists(): void {
        const requiredFolders = [ "data/", "data/json/", "data/json/markers/" ];

        for (let folder of requiredFolders) {
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
        }
    }

    public async verifyAndGetAccessions(): Promise<void> {
        const maxAccessionDownloadAttemptsAllowed = 5;

        while (!this.verifyCurrentAccessionsDownload()) {
            ++this.returnObject.accessionDownloadAttemptCount;
    
            if (this.returnObject.accessionDownloadAttemptCount > maxAccessionDownloadAttemptsAllowed) {
                throw `Failed to get valid accessions JSON after ${maxAccessionDownloadAttemptsAllowed} attempts.`;
            }
    
            await this.downloadAccessions();  
        }

        this.readAccessionsData();
    }

    private verifyCurrentAccessionsDownload(): boolean {
        if (!fs.existsSync("data/json/accessions.json")) {
            return false;
        }

        const expectedChecksum = "3be7720b22d420fc7af2cbf7933c7257c2319e5bc5fd0422ab608b2a1b5fb80f";

        const data = fs.readFileSync("data/json/accessions.json", "utf-8");

        const actualChecksum = crypto.createHash("sha256")
                                     .update(data)
                                     .digest("hex");
        
        return (expectedChecksum === actualChecksum);
    }

    private async downloadAccessions(): Promise<void> {
        const res = await fetch("https://api.23andme.com/3/accession/");
        const json: AccessionResponse = await res.json();

        fs.writeFileSync("data/json/accessions.json", JSON.stringify(this.accessions));
    }

    private readAccessionsData(): void {
        this.accessions = JSON.parse(
            fs.readFileSync("data/json/accessions.json", "utf-8")
        );
    }

    public async getMarkersForAllAccessions(): Promise<void> {
        for (let accession of this.accessions) {
            this.getMarkersForSpecifiedAccession(accession, null);

            await new Promise(res => {
                setTimeout(res, 5000);
            });
        }

        console.log("Done.");
    }

    private async getMarkersForSpecifiedAccession(accession: Accession, link: string | null) {
        console.log(accession.chromosome);
    }

    public getReturnObject() {
        const endTimestamp = Math.floor( Date.now() / 1000 );

        this.returnObject.runtimeDurationInSeconds = (endTimestamp - this.startTimestamp)

        return this.returnObject;
    }
}

export default downloadFrom23andMeApi;
