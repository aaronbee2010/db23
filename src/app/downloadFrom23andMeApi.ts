import * as fs from 'fs';
import * as crypto from 'crypto';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import Accession from '../types/accession';
import AccessionResponse from '../types/accessionResponse';
import Marker from '../types/marker';
import MarkerResponse from '../types/markerResponse';

/**
 * TODO: Migrate verification functions to separate classes when program is complete i.e. Download/Validate, Accession/Marker etc.
 *
 * TODO: Verify checksums of markers and use these to avoid redownloading markers for an accession if a file for said accession already exists and has a valid checksum.
 */

const downloadFrom23andMeApi = async (): Promise<object> => {
    const dl = new Download();

    /**
     * Make sure folders where our downloaded data will be stored exist before continuing with the rest of this procedure.
     */
    dl.createFoldersIfNotExists();

    /**
     * Check if accessions JSON exists and has a valid checksum. If false, we'll download it then check its checksum is valid.
     *
     * We'll repeat this download/check procedure a maximum of 5 times. If we fail to download a valid JSON after 5 attempts, we will throw an exception.
     */
    await dl.verifyAndGetAccessions();

    /**
     * Start downloading markers for each accession simultaneously.
     * The rate limiter will ensure we don't exceed the API's rate limit.
     */
    await dl.getMarkersForAllAccessions();

    return dl.getReturnObject();
};

class Download {
    private readonly minimumMillisecondsBetweenRequests = 5000; // 20 seconds
    private rateLimiter: RateLimiterMemory;

    private startTimestamp: number = 0;

    private returnObject: any = {
        runtimeDurationInSeconds: 0,
        accessionDownloadAttemptCount: 0,
    };

    private accessions: Accession[] = [];

    public constructor() {
        this.startTimestamp = Date.now();

        const durationInSeconds = this.minimumMillisecondsBetweenRequests / 1000;

        this.rateLimiter = new RateLimiterMemory({
            points: 1, // Number of points
            duration: durationInSeconds, // Duration in seconds
        });
    }

    private async fetchJsonAtCappedRate(link: string): Promise<any> {
        try {
            // Consume 1 point before making a request
            await this.rateLimiter.consume(1);

            const res = await fetch(link);

            if (!res.ok) {
                throw new Error(`API request failed with status ${res.status}`);
            }

            return res.json();
        } catch (rateLimiterRes: any) {
            if (rateLimiterRes instanceof Error) {
                // Handle fetch or other errors
                console.error(`Error fetching data from ${link}:`, rateLimiterRes);
                throw rateLimiterRes;
            } else {
                // RateLimiterRes contains msBeforeNext property
                const waitTime = rateLimiterRes.msBeforeNext;
                // console.log(`Rate limit exceeded. Waiting for ${waitTime} ms before retrying.`);
                await this.delay(waitTime);
                // Retry after the wait time
                return this.fetchJsonAtCappedRate(link);
            }
        }
    }

    // Helper method to delay execution
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    public createFoldersIfNotExists(): void {
        const requiredFolders = ['data/', 'data/json/', 'data/json/markers/'];

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
                throw new Error(`Failed to get valid accessions JSON after ${maxAccessionDownloadAttemptsAllowed} attempts.`);
            }

            await this.downloadAccessions();
        }

        this.readAccessionsData();
    }

    public async getMarkersForAllAccessions(): Promise<void> {
        const downloadPromises = this.accessions.map((accession) => {
            if (this.verifyExistingMarkersForAccession(accession)) {
                return Promise.resolve();
            }
            return this.getAllMarkersForSpecifiedAccession(accession);
        });

        await Promise.all(downloadPromises);

        console.log("Finished downloading, sorting and writing markers for all accessions to disc!")
    }

    private verifyExistingMarkersForAccession(accession: Accession): boolean {
        // TODO: Verify checksums once you've got downloaded data to compare to.
        return false;
    }

    private verifyCurrentAccessionsDownload(): boolean {
        if (!fs.existsSync('data/json/accessions.json')) {
            return false;
        }

        const expectedChecksum = '3be7720b22d420fc7af2cbf7933c7257c2319e5bc5fd0422ab608b2a1b5fb80f';

        const data = fs.readFileSync('data/json/accessions.json', 'utf-8');

        const actualChecksum = crypto.createHash('sha256').update(data).digest('hex');

        return expectedChecksum === actualChecksum;
    }

    private async downloadAccessions(): Promise<void> {
        const json: AccessionResponse = await this.fetchJsonAtCappedRate('https://api.23andme.com/3/accession/');

        fs.writeFileSync('data/json/accessions.json', JSON.stringify(json.data));
    }

    private readAccessionsData(): void {
        this.accessions = JSON.parse(fs.readFileSync('data/json/accessions.json', 'utf-8'));
    }

    private async getAllMarkersForSpecifiedAccession(accession: Accession) {
        console.log(`Started downloading markers for chromosome ${accession.chromosome}.`);

        const markers = await this.getSomeMarkersForSpecifiedAccession(accession, null);

        markers.sort(Download.compareMarkers);

        fs.writeFileSync(`data/json/markers/${accession.id}.json`, JSON.stringify(markers));

        console.log(`Successfully saved ${markers.length} markers for chromosome ${accession.chromosome}!`);
    }

    private async getSomeMarkersForSpecifiedAccession(accession: Accession, link: string | null): Promise<Marker[]> {
        const limit = 10000;
        link ??= `https://api.23andme.com/3/marker/?accession_id=${accession.id}&limit=${limit}`;

        const json: MarkerResponse = await this.fetchJsonAtCappedRate(link);

        console.log(`    Downloaded ${json.data.length} markers for chromosome ${accession.chromosome}...`);

        if (json.links.next === null) {
            return json.data;
        } else {
            const nextMarkers = await this.getSomeMarkersForSpecifiedAccession(accession, json.links.next);
            return json.data.concat(nextMarkers);
        }
    }

    private static compareMarkers(marker1: Marker, marker2: Marker): number {
        if (marker1.start !== marker2.start) {
            return marker1.start - marker2.start;
        } else if (marker1.end !== marker2.end) {
            return marker1.end - marker2.end;
        } else {
            return Download.compareRSIDs(marker1.id, marker2.id);
        }
    }

    private static compareRSIDs(rsid1: string, rsid2: string): number {
        const rsid1Prefix = rsid1.replace(/[0-9]+$/, '');
        const rsid2Prefix = rsid2.replace(/[0-9]+$/, '');
        const rsid1Suffix = Number(rsid1.replace(/^(rs|i)/, ''));
        const rsid2Suffix = Number(rsid2.replace(/^(rs|i)/, ''));

        if (rsid1Prefix !== rsid2Prefix) {
            return rsid1Prefix === 'rs' ? -1 : 1;
        } else {
            return rsid2Suffix - rsid1Suffix;
        }
    }

    public getReturnObject() {
        const endTimestamp = Date.now();

        this.returnObject.runtimeDurationInSeconds = Math.floor((endTimestamp - this.startTimestamp) / 1000);

        return this.returnObject;
    }
}

export default downloadFrom23andMeApi;
