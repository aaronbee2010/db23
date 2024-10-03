import * as fs from 'fs';
import * as crypto from 'crypto';

import ChecksumRecord from "../types/checksumRecord";

export default class Validate {
    public static readonly checksums: ChecksumRecord = {
        accessions: "3be7720b22d420fc7af2cbf7933c7257c2319e5bc5fd0422ab608b2a1b5fb80f",
        markers: {
            "NC_000001.10": "49e24934b957823c20a0e06d0fddb5847461698f698526ae30e9cadd4b474097",
            "NC_000002.11": "e7d5ebbb2615db114877dfd548eeac686ce10060ff30e64c6e5217aafc8097e7",
            "NC_000003.11": "621118e4c629039b19c26b84afccafd96c95381f7650b9b3940f6d99195b3569",
            "NC_000004.11": "0a5728e95c9285aedfa64707fdaf79f269439a81259cfc7c6f63853189e57631",
            "NC_000005.9":  "627421fa78c38c6d5ff3b5a908478dd3d3e1716cbab8cf9df2474dc888b0a4b4",
            "NC_000006.11": "9b50d25a1b51b8ea803b7816931bb9bbe77426595b4614630b3407ee3236734b",
            "NC_000007.13": "61837c3b490ffe04d11b13ac8c08b0d29dbf998533a9c38353eabad07c89aea3",
            "NC_000008.10": "11a998fac0478758e51dcb25e41292e2340502ac362e7b5391829b38bb5b8795",
            "NC_000009.11": "93ae29a398f61895adb3fad080f760f9026bef8ad89f84e2e146057471444bc5",
            "NC_000010.10": "4dd4d48b254ede88ce3aa5127e6e401e80175af5ebe0dd6be81e41ee288828ce",
            "NC_000011.9":  "fb6f093d55124b93706164f2c65ff8eab6a86750d389812e244c283a22f0bd32",
            "NC_000012.11": "cbc47041fb82604477f5a7cc15120865b14f3c6d22d0447a4abddec98f4ee089",
            "NC_000013.10": "7db54fe352f9bc984050ec1cd4b19916bca87ca7449abbdfc2c6ad5cbdeecbbc",
            "NC_000014.8":  "8a2720d41b36083f1d592c44e2e5b3b98cd6c3f7d192bc026dbe33c86c520732",
            "NC_000015.9":  "507ea27a911d3ac5cb903ac6d222fba6517d433e2a38cc5ac47d28efe63c6490",
            "NC_000016.9":  "c6c80ed86c7b5d1affc5cf84ca4caece6300bb26d2561427be4c55f77a1902d7",
            "NC_000017.10": "9eb4f771aa5e0dd0a60da89f95ce7ecbf4dc94fafc83ae73d2f6165ce1b085d8",
            "NC_000018.9":  "1e4eb9ec5db9fd9b13ebca26d30bf8243ead1a17df79532110cd1d021359d9de",
            "NC_000019.9":  "f5d5c0274180da355792bd268c48033d33a32059a70a4aa0735ecb91417cef50",
            "NC_000020.10": "f2bcdf2104d0c0c89fa2e38ed6f7da10ac6bc8f529500d46f745ad4bef28c085",
            "NC_000021.8":  "03c6aa9e7119b9c298a25d38f115d84bd44a6bdca5ef21d9a9bd89ad4c73687c",
            "NC_000022.10": "0dba1048a66b721935176c8cff7d60704d0e70378c673b9ca0fa50dd1215998f",
            "NC_000023.10": "8b0030bb8c57a8d73b8a8bbf325fc5139c220a79ae41070f37be6cd2ce222dd3",
            "NC_000024.9":  "c0aa27938ea45e74cb999700064f6c38cca644e44717669c2a6bd618013dc7a0",
            "NC_012920.1":  "a8362265b5a856a89d1dbc7959439af74b2ecd6dfc318ca96acd4a1167be20d5"
        }
    };
    
    public static validateAccessionDownload(): boolean {
        if (!fs.existsSync('data/json/accessions.json')) {
            return false;
        }

        const data = fs.readFileSync('data/json/accessions.json', 'utf-8');

        const actualChecksum = crypto.createHash('sha256')
                                     .update(data)
                                     .digest('hex');

        return this.checksums.accessions === actualChecksum;
    }

    public static validateMarkersForAccession(accessionID: string): boolean {
        const markerPath = `data/json/markers/${accessionID}.json`;

        if (!fs.existsSync(markerPath)) {
            return false;
        }

        const data = fs.readFileSync(markerPath, "utf-8");

        const actualChecksum = crypto.createHash('sha256')
                                     .update(data)
                                     .digest('hex');

        return this.checksums.markers[accessionID] === actualChecksum;
    }
}
