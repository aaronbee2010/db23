type TAccession = {
    id: string,
    chromosome: string,
    length: number
}

type TAccessionResponse = {
    data: TAccession[],
    links: {
        next: string | null
    }
}
