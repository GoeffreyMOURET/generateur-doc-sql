export default class ObjetUtils {
    static toString(objet : string | number | boolean | undefined | null): string | undefined {
        if (objet === null || objet === undefined) {
            return undefined;
        }
        if (typeof objet === 'string') {
            return objet;
        }
        if (typeof objet === 'number') {
            return objet.toString();
        }
        if (typeof objet === 'boolean') {
            return objet ? 'true' : 'false';
        }
        throw new Error('Impossible')
    }
}