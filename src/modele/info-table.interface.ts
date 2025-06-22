export default interface InfoTable {
    code: string,
    clesPrimaires: string[],
    clesEtrangeres: AttributCleEtrangere[],
    attributs: Attribut[],
    description ?: string,
}

export interface Attribut {
    code: string,
    type: string,
    nullable: boolean,
    description ?: string,
    default ?: string,
    taille ?: number,
}

export interface AttributCleEtrangere {
    code: string,
    tableReference: string,
    colonneReference: string,
}

export interface InfoColonne extends Attribut {
    estClePrimaire ?: boolean,
    infoCleEtrangere ?: AttributCleEtrangere,
}