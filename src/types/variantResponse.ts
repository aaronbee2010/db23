import Variant from "./variant";

type VariantResponse = {
    data: Variant[],
    links: {
        next: string | null
    }
}

export default VariantResponse;
