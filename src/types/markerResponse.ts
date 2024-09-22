import Marker from "./marker";

type MarkerResponse = {
    data: Marker[],
    links: {
        next: string | null
    }
}

export default MarkerResponse;
