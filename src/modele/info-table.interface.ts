export default interface InfoTable {
    code: string,
    clesPrimaires: string[],
    clesEtrangeres: AttributCleEtrangere[],
    attributs: Attribut[],
    description ?: string,
    uniques ?: UniqueContrainte[], 
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
    estUnique?: boolean,
}

export interface UniqueContrainte {
    nom: string,
    code: string[],
}