import Variant from "./variant";

type Marker = {
    id: string;
    alternate_ids: string[];
    gene_names: string[];
    accession_id: string;
    start: number;
    end: number;
    variants: Variant[]
}

export default Marker;
