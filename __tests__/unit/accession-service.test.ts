import { vi, beforeEach, afterEach, afterAll, describe, it, expect } from "vitest"
import { fs, vol } from "memfs"
import { http, HttpResponse } from "msw"
import { setupServer } from 'msw/node'
import AccessionService from "../../server/utils/services/accession-service"

vi.mock("node:fs")

const accessionResponse = {
    data: [
        {
            id:"NC_000001.10",
            chromosome:"1",
            length:249250621
        },
        {
            id:"NC_000002.11",
            chromosome:"2",
            length:243199373
        },
        {
            id:"NC_000003.11",
            chromosome:"3",
            length:198022430
        },
        {
            id:"NC_000004.11",
            chromosome:"4",
            length:191154276
        },
        {
            id:"NC_000005.9",
            chromosome:"5",
            length:180915260
        },
        {
            id:"NC_000006.11",
            chromosome:"6",
            length:171115067
        },
        {
            id:"NC_000007.13",
            chromosome:"7",
            length:159138663
        },
        {
            id:"NC_000008.10",
            chromosome:"8",
            length:146364022
        },
        {
            id:"NC_000009.11",
            chromosome:"9",
            length:141213431
        },
        {
            id:"NC_000010.10",
            chromosome:"10",
            length:135534747
        },
        {
            id:"NC_000011.9",
            chromosome:"11",
            length:135006516
        },
        {
            id:"NC_000012.11",
            chromosome:"12",
            length:133851895
        },
        {
            id:"NC_000013.10",
            chromosome:"13",
            length:115169878
        },
        {
            id:"NC_000014.8",
            chromosome:"14",
            length:107349540
        },
        {
            id:"NC_000015.9",
            chromosome:"15",
            length:102531392
        },
        {
            id:"NC_000016.9",
            chromosome:"16",
            length:90354753
        },
        {
            id:"NC_000017.10",
            chromosome:"17",
            length:81195210
        },
        {
            id:"NC_000018.9",
            chromosome:"18",
            length:78077248
        },
        {
            id:"NC_000019.9",
            chromosome:"19",
            length:59128983
        },
        {
            id:"NC_000020.10",
            chromosome:"20",
            length:63025520
        },
        {
            id:"NC_000021.8",
            chromosome:"21",
            length:48129895
        },
        {
            id:"NC_000022.10",
            chromosome:"22",
            length:51304566
        },
        {
            id:"NC_000023.10",
            chromosome:"X",
            length:155270560
        },
        {
            id:"NC_000024.9",
            chromosome:"Y",
            length:59373566
        },
        {
            id:"NC_012920.1",
            chromosome:"MT",
            length:16569
        }
    ],
    links: {
        next: null
    }
}

const restHandlers = [
    http.get("https://api.23andme.com/3/accession/", () => {
        return HttpResponse.json(accessionResponse)
    })
]

const server = setupServer(...restHandlers)

beforeEach(() => {
    vol.reset()

    server.listen({
        onUnhandledRequest: "error"
    })
})

afterEach(() => server.resetHandlers())

afterAll(() => server.close())

describe("AccessionService", () => {
    describe("getAllAccessions", () => {
        const expected = accessionResponse

        it("creates JSON if one doesn't already exist", async () => {
            expect(fs.existsSync("data/json/accessions.json")).toBe(false)

            const service = await AccessionService.create()

            expect(fs.existsSync("data/json/accessions.json")).toBe(true)

            expect(service.wasFileReused).toBe(false)
        })

        it("reuses existing JSON if it already exists and is valid", async () => {
            vol.fromJSON(
                {
                    "data/json/accessions.json": '[{"id":"NC_000001.10","chromosome":"1","length":249250621},{"id":"NC_000002.11","chromosome":"2","length":243199373},{"id":"NC_000003.11","chromosome":"3","length":198022430},{"id":"NC_000004.11","chromosome":"4","length":191154276},{"id":"NC_000005.9","chromosome":"5","length":180915260},{"id":"NC_000006.11","chromosome":"6","length":171115067},{"id":"NC_000007.13","chromosome":"7","length":159138663},{"id":"NC_000008.10","chromosome":"8","length":146364022},{"id":"NC_000009.11","chromosome":"9","length":141213431},{"id":"NC_000010.10","chromosome":"10","length":135534747},{"id":"NC_000011.9","chromosome":"11","length":135006516},{"id":"NC_000012.11","chromosome":"12","length":133851895},{"id":"NC_000013.10","chromosome":"13","length":115169878},{"id":"NC_000014.8","chromosome":"14","length":107349540},{"id":"NC_000015.9","chromosome":"15","length":102531392},{"id":"NC_000016.9","chromosome":"16","length":90354753},{"id":"NC_000017.10","chromosome":"17","length":81195210},{"id":"NC_000018.9","chromosome":"18","length":78077248},{"id":"NC_000019.9","chromosome":"19","length":59128983},{"id":"NC_000020.10","chromosome":"20","length":63025520},{"id":"NC_000021.8","chromosome":"21","length":48129895},{"id":"NC_000022.10","chromosome":"22","length":51304566},{"id":"NC_000023.10","chromosome":"X","length":155270560},{"id":"NC_000024.9","chromosome":"Y","length":59373566},{"id":"NC_012920.1","chromosome":"MT","length":16569}]'
                }
            )

            expect(fs.existsSync("data/json/accessions.json")).toBe(true)

            const service = await AccessionService.create()

            expect(service.wasFileReused).toBe(true)
        })

        it("returns all accessions", async () => {
            // Arrange
            const service = await AccessionService.create()

            // Act
            const actual = service.getAllAccessions()

            // Assert
            expect(actual).toStrictEqual(expected)
        })

        it("throws exception if request to 23andMe API fails", () => {
            server.use(
                http.get("https://api.23andme.com/3/accession/", () => {
                    return HttpResponse.error()
                })
            )

            expect(() => AccessionService.create()).rejects.toThrow("Could not connect to 23andMe accessions endpoint")
        })

        it("throws exception if request to 23andMe API succeeds but returns non-200 status code", () => {
            server.use(
                http.get("https://api.23andme.com/3/accession/", () => {
                    return new HttpResponse(null, {
                        status: 404
                    })
                })
            )

            expect(() => AccessionService.create()).rejects.toThrow("Connected to 23andMe accessions endpoint but got non-success status code")
        })

        it("throws exception if response cannot be parsed as JSON", () => {
            server.use(
                http.get("https://api.23andme.com/3/accession/", () => {
                    return HttpResponse.json()
                })
            )

            expect(() => AccessionService.create()).rejects.toThrow("Could not parse response as JSON")
        })

        const parsableNonObjectResponseProvider = [
            0,
            3.14159,
            "",
            "invalid response",
            `<p class="greeting">Hello world!</p>`,
            `<post><id>abc-123</id><title>Modern Testing Practices</title></post>`,
            true,
            false,
            null
        ]

        it.each(parsableNonObjectResponseProvider)("throws exception if response is not an object %#", (responseBody) => {
            server.use(
                http.get("https://api.23andme.com/3/accession/", () => {
                    return HttpResponse.json(responseBody)
                })
            )

            expect(() => AccessionService.create()).rejects.toThrow("Non-object response from 23andMe accessions endpoint")
        })

        const invalidObjectProvider = [
            {
                status: false,
                message: "invalid response"
            },
            [],
            [1, 2, 3]
        ]

        it.each(invalidObjectProvider)("throws exception if response object is invalid - %#", (response) => {
            server.use(
                http.get("https://api.23andme.com/3/accession/", () => {
                    return HttpResponse.json(response)
                })
            )

            expect(() => AccessionService.create()).rejects.toThrow("Invalid response object from 23andMe accessions endpoint")
        })

        it("throws exception if new JSON cannot be written", () => {
            vol.chmodSync("/", "555")

            expect(() => AccessionService.create()).rejects.toThrow("Could not write accessions JSON to disk")
        })

        it("throws exception if existing JSON cannot be read", () => {
            vol.fromJSON(
                {
                    "data/json/accessions.json": '[{"id":"NC_000001.10","chromosome":"1","length":249250621},{"id":"NC_000002.11","chromosome":"2","length":243199373},{"id":"NC_000003.11","chromosome":"3","length":198022430},{"id":"NC_000004.11","chromosome":"4","length":191154276},{"id":"NC_000005.9","chromosome":"5","length":180915260},{"id":"NC_000006.11","chromosome":"6","length":171115067},{"id":"NC_000007.13","chromosome":"7","length":159138663},{"id":"NC_000008.10","chromosome":"8","length":146364022},{"id":"NC_000009.11","chromosome":"9","length":141213431},{"id":"NC_000010.10","chromosome":"10","length":135534747},{"id":"NC_000011.9","chromosome":"11","length":135006516},{"id":"NC_000012.11","chromosome":"12","length":133851895},{"id":"NC_000013.10","chromosome":"13","length":115169878},{"id":"NC_000014.8","chromosome":"14","length":107349540},{"id":"NC_000015.9","chromosome":"15","length":102531392},{"id":"NC_000016.9","chromosome":"16","length":90354753},{"id":"NC_000017.10","chromosome":"17","length":81195210},{"id":"NC_000018.9","chromosome":"18","length":78077248},{"id":"NC_000019.9","chromosome":"19","length":59128983},{"id":"NC_000020.10","chromosome":"20","length":63025520},{"id":"NC_000021.8","chromosome":"21","length":48129895},{"id":"NC_000022.10","chromosome":"22","length":51304566},{"id":"NC_000023.10","chromosome":"X","length":155270560},{"id":"NC_000024.9","chromosome":"Y","length":59373566},{"id":"NC_012920.1","chromosome":"MT","length":16569}]'
                }
            )

            vol.chmodSync("data/json/accessions.json", "222")

            expect(() => AccessionService.create()).rejects.toThrow("Could not read accessions JSON from disk")
        })
    })
})
