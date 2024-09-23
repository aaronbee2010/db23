import Download from "../classes/download";

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

export default downloadFrom23andMeApi;
