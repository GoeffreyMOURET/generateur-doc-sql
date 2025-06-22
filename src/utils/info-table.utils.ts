import InfoTable, { InfoColonne } from "../modele/info-table.interface";

export default class InfoTableUtils {
    static versInfoColonne(infoTable: InfoTable): InfoColonne[] {
        return infoTable.attributs
            .map((att) => ({
                ...att,
                estClePrimaire: infoTable.clesPrimaires.includes(att.code),
                infoCleEtrangere: infoTable.clesEtrangeres.find((ce) => ce.code === att.code),
                estUnique: infoTable.uniques.some((unique) => unique.codesAttributs.every((code) => code === att.code))
            }))
    }
}