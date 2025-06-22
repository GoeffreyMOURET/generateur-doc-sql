import { Paragraph, Table, Document, Packer } from "docx";
import { writeFileSync } from 'fs'
import InfoTable, { InfoColonne, InfoIndex, UniqueContrainte } from "../modele/info-table.interface";
import DocxUtils from "../utils/docx.utils";
import { CHEMIN_SAUVEGARDE_DOC } from "../constante/sauvegarde.constante";
import InfoTableUtils from "../utils/info-table.utils";
import ObjetUtils from "../utils/objet.utils";

class ModelePhysiqueDonneesService {
    async construireModele(infoTables: InfoTable[]) {
         const doc = new Document({
            sections: [{
                children: infoTables.flatMap((it) => [
                    DocxUtils.construireTitre2(`Détail de la table ${it.code}`),
                    
                    ...(it.description ? [
                        DocxUtils.construireTitre3(`Description de la table ${it.code}`),
                        DocxUtils.ajouterParagraphe(it.description)
                    ] : []),
                    
                    DocxUtils.construireTitre3(`Détails des champs de la table ${it.code}`),
                    this.construireDetailChamps(it),
                    DocxUtils.sautDeLigne(),
                    this.construireInfoPhysiqueChamp(it),
                    ...(this.construireTableauCleEtrangere(it) ?? []),
                    ...(this.construireTableauContraintesUnicite(it) ?? []),
                    ...(this.construireTableauIndex(it) ?? []),
                ])
            }]
        });
        const blob = await Packer.toBlob(doc);
        const buffer = Buffer.from( await blob.arrayBuffer() );
        writeFileSync(CHEMIN_SAUVEGARDE_DOC + "/MPD.docx", buffer);
        console.log('Fin de génération du MPD !')
    }

    private construireDetailChamps(it: InfoTable): Table {
        return DocxUtils.construireTableau(
            [
                { intitule: 'Attribut', contenu: (ic: InfoColonne) => ic.code, largeur: 20, },
                { intitule: 'Type', contenu: (ic: InfoColonne) => ic.type, largeur: 10, },
                { intitule: 'Taille', contenu: (ic: InfoColonne) => ObjetUtils.toString(ic.taille) ?? '', largeur: 10, },
                { intitule: 'Description', contenu: (ic: InfoColonne) => ic.description ?? '', largeur: 30, },
            ],
            InfoTableUtils.versInfoColonne(it)
        )
    }

    private construireInfoPhysiqueChamp(it: InfoTable): Table {
        return DocxUtils.construireTableau(
            [
                { intitule: 'Attribut', contenu: (ic: InfoColonne) => ic.code, largeur: 20, },
                { intitule: 'Type', contenu: (ic: InfoColonne) => ic.type, largeur: 10, },
                { intitule: 'Clé Primaire', contenu: (ic: InfoColonne) => ic.estClePrimaire ? 'X' : '', largeur: 10, },
                { intitule: 'Obligatoire', contenu: (ic: InfoColonne) => ic.nullable ? '' : 'X', largeur: 10, },
                { intitule: 'Clé Etrangère', contenu: (ic: InfoColonne) => ic.infoCleEtrangere ? 'X' : '', largeur: 10, },
                { intitule: 'Unique', contenu: (ic: InfoColonne) => ic.estUnique ? 'X' : '', largeur: 10, },
            ],
            InfoTableUtils.versInfoColonne(it)
        )
    }

    private construireTableauCleEtrangere(infoTable: InfoTable): [Paragraph, Table,] | undefined {
        const lignes: InfoColonne[] = InfoTableUtils.versInfoColonne(infoTable)
            .filter((att) => att.infoCleEtrangere);
        if (lignes.length === 0) return;
        return [
            DocxUtils.construireTitre3(`Clés étrangères de la table ${infoTable.code}`),
            DocxUtils.construireTableau(
            [
                { intitule: 'Attribut', contenu: (ic: InfoColonne) => ic.code, largeur: 15, },
                { intitule: 'Table référence', contenu: (ic: InfoColonne) => ic.infoCleEtrangere.tableReference, largeur: 15, },
                { intitule: 'Colonne référence', contenu: (ic: InfoColonne) => ic.infoCleEtrangere.colonneReference, largeur: 15, },
            ],
            lignes,
        )]
    }

    private construireTableauContraintesUnicite(infoTable: InfoTable): [Paragraph, Table,] | undefined {
        if ((infoTable.uniques?.length ?? 0) === 0) return;
        return [
            DocxUtils.construireTitre3(`Contraintes d'unicité de la table ${infoTable.code}`),
            DocxUtils.construireTableau(
            [
                { intitule: 'Nom de la contrainte', contenu: (uc: UniqueContrainte) => uc.nom, },
                { intitule: 'Colonnes concernées', contenu: (uc: UniqueContrainte) => uc.codesAttributs.join(', '), },
            ],
            infoTable.uniques,
        )]
    }

    private construireTableauIndex(infoTable: InfoTable): [Paragraph, Table,] | undefined {
        if ((infoTable.indexes?.length ?? 0) === 0) return;
        return [
            DocxUtils.construireTitre3(`Indexes de la table ${infoTable.code}`),
            DocxUtils.construireTableau(
            [
                { intitule: 'Nom de l\'index', contenu: (uc: InfoIndex) => uc.nom, },
                { intitule: 'Colonnes concernées', contenu: (uc: InfoIndex) => uc.codesAttributs.join(', '), },
            ],
            infoTable.indexes,
        )]
    }
}

export default new ModelePhysiqueDonneesService;