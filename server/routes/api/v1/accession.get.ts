import AccessionService from "~/utils/services/accession-service"

export default defineEventHandler(async () => {
    const service = await AccessionService.create()

    return service.getAllAccessions()
})
