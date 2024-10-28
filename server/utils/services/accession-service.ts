import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import Ajv, { JSONSchemaType } from "ajv/dist/2020";

export default class AccessionService {
    private readonly _accessionDir = "data/json/"
    private readonly _accessionFileName = "accessions.json"
    private readonly _accessionPath = this._accessionDir + this._accessionFileName
    private _accessions: any[] = [];
    private _wasFileReused = true;

    private constructor() { }

    public static async create() {
        try {
            const service = new AccessionService()

            if (!existsSync(service._accessionPath)) {
                await service.fetchAccessionsFrom23andMe()
                service.writeAccessionsToFile()

                service._wasFileReused = false;
            } else {
                service.readAccessionsFromFile()
            }

            return service
        } catch (err) {
            console.error(err)

            throw err
        }
    }

    private async fetchAccessionsFrom23andMe() {
        let res: Response;

        try {
            res = await fetch("https://api.23andme.com/3/accession/")
        } catch {
            throw new Error("Could not connect to 23andMe accessions endpoint")
        }

        if (res.status !== 200) {
            throw new Error("Connected to 23andMe accessions endpoint but got non-success status code")
        }

        let json: TAccessionResponse

        try {
            json = await res.json()
        } catch {
            throw new Error("Could not parse response as JSON")
        }        

        this.validateAccessionResponseFrom23andMe(json)

        this._accessions = json.data
    }

    private validateAccessionResponseFrom23andMe(json: unknown) {
        if (!json || typeof json !== "object") {
            throw new Error("Non-object response from 23andMe accessions endpoint")
        }

        const ajv = new Ajv({
            strict: true,
            verbose: true
        })

        const schema: JSONSchemaType<TAccessionResponse> = {
            type: "object",
            properties: {
                data: {
                    type: "array",
                    minItems: 1,
                    maxItems: 25,
                    items: {
                        type: "object",
                        properties: {
                            id: {
                                type: "string",
                                nullable: false
                            },
                            chromosome: {
                                type: "string",
                                nullable: false
                            },
                            length: {
                                type: "number",
                                nullable: false
                            }
                        },
                        required: [ "id", "chromosome", "length" ],
                        additionalProperties: false
                    }
                },
                links: {
                    type: "object",
                    properties: {
                        next: {
                            oneOf: [
                                {
                                    type: "string"
                                },
                                {
                                    type: "null",
                                    nullable: true
                                }
                            ]
                        }
                    },
                    required: [ "next" ],
                    additionalProperties: false
                }
            },
            required: [ "data", "links" ],
            additionalProperties: false
        }

        const validate = ajv.compile(schema)

        if (!validate(json)) {
            throw new Error("Invalid response object from 23andMe accessions endpoint")
        }
    }

    private writeAccessionsToFile() {
        try {
            const text = JSON.stringify(this._accessions)

            if (!existsSync(this._accessionDir)) {
                mkdirSync(this._accessionDir, {
                    recursive: true
                })
            }

            writeFileSync(this._accessionPath, text, {
                encoding: "utf8"
            })
        } catch {
            throw new Error("Could not write accessions JSON to disk")
        }
    }

    private readAccessionsFromFile() {
        try {
            const json = readFileSync(this._accessionPath, "utf8")

            this._accessions = JSON.parse(json)
        } catch {
            throw new Error("Could not read accessions JSON from disk")
        }
    }

    public getAllAccessions() {
        return {
            data: this._accessions,
            links: {
                next: null
            }
        }
    }

    public get wasFileReused() {
        return this._wasFileReused
    }
}
