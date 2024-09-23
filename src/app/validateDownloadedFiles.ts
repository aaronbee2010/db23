import Validate from "../classes/validate";

const validateDownloadedFiles = () => {
    const returnObject: { accession: boolean, markers: Record<string, boolean> } = {
        accession: false,
        markers: {
            "NC_000001.10": false,
            "NC_000002.11": false,
            "NC_000003.11": false,
            "NC_000004.11": false,
            "NC_000005.9":  false,
            "NC_000006.11": false,
            "NC_000007.13": false,
            "NC_000008.10": false,
            "NC_000009.11": false,
            "NC_000010.10": false,
            "NC_000011.9":  false,
            "NC_000012.11": false,
            "NC_000013.10": false,
            "NC_000014.8":  false,
            "NC_000015.9":  false,
            "NC_000016.9":  false,
            "NC_000017.10": false,
            "NC_000018.9":  false,
            "NC_000019.9":  false,
            "NC_000020.10": false,
            "NC_000021.8":  false,
            "NC_000022.10": false,
            "NC_000023.10": false,
            "NC_000024.9":  false,
            "NC_012920.1":  false
        }
    };

    returnObject.accession = Validate.validateAccessionDownload();

    for (let accessionID in Validate.checksums.markers) {
        returnObject.markers[accessionID] = Validate.validateMarkersForAccession(accessionID);
    }

    return returnObject;
}

export default validateDownloadedFiles;
