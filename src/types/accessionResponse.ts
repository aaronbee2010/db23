import Accession from "./accession";

type AccessionResponse = {
    data: Accession[],
    links: {
        next: string | null
    }
}

export default AccessionResponse;
