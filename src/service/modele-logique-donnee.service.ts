import { Paragraph, Table } from "docx";
import InfoTable, { InfoColonne } from "../modele/info-table.interface";
import DocxUtils from "../utils/docx.utils";
import { CHEMIN_SAUVEGARDE_DOC } from "../constante/sauvegarde.constante";

const fs = require('fs');
const docx = require('docx');

class ModeleLogiqueDonneesService {
    async construireModele(infoTables: InfoTable[]) {
        const doc = new docx.Document({
            sections: [{
                children: [
                    new Paragraph({
                        heading: "Heading1",
                        text: 'Schéma du modèle logique de données',
                    }),
                    ...DocxUtils.ajouterSautDeLigne(this.construireParagrapheMLD(infoTables)),
                    new Paragraph({
                        heading: "Heading1",
                        text: 'Détails des différentes tables',
                    }),
                    ...infoTables.flatMap((it) => [
                        new Paragraph({
                            heading: "Heading2",
                            text: `Table ${it.code}`
                        }),
                        ...this.construireTableauMLD(it), 
                        ...(this.construireTableauCleEtrangere(it) ?? [])
                    ]),
                ]
            }]
        });
        const blob = await docx.Packer.toBlob(doc);
        const buffer = Buffer.from( await blob.arrayBuffer() );
        fs.writeFileSync(CHEMIN_SAUVEGARDE_DOC + "MLD.docx", buffer);
        console.log('Fin de génération du MLD !')
    }

    private construireParagrapheMLD(infoTables: InfoTable[]) {
        return infoTables
            .map((it) => DocxUtils.ajouterParagraphe(
                `<b>${it.code}</b>(${[
                    '<u>' + this.recupererInfoClePrimaire(it).join(', ') + '</u>',
                    this.recupererInfoAttributsNormaux(it).join(', '),
                    this.recupererInfoCleEtrangere(it).join(', '),
                ]
                .filter((str) => str !== '' && str !== '<u></u>')
                .join(', ')})`
            ))
    }

    private recupererInfoClePrimaire(infoTable: InfoTable): string[] {
        return infoTable.attributs
            .filter((att) => infoTable.clesPrimaires.includes(att.code))
            .map((att) => `${att.code}${infoTable.clesEtrangeres.some((ce) => ce.code === att.code) ? '*' : ''}`);
    }

    private recupererInfoCleEtrangere(infoTable: InfoTable): string[] {
        return infoTable.attributs
            .filter((att) => infoTable.clesEtrangeres.some((it) => it.code === att.code))
            .filter((att) => !infoTable.clesPrimaires.includes(att.code))
            .map((att) => `${att.code}*`);
    }

    private recupererInfoAttributsNormaux(infoTable: InfoTable): string[] {
        return infoTable.attributs
            .filter((att) => infoTable.clesEtrangeres.every((it) => it.code !== att.code))
            .filter((att) => !infoTable.clesPrimaires.includes(att.code))
            .map((att) => att.code);
    }

    private construireTableauMLD(infoTable: InfoTable): [Paragraph, Table] {
        const lignes: InfoColonne[] = infoTable.attributs
            .map((att) => ({
                ...att,
                estClePrimaire: infoTable.clesPrimaires.includes(att.code),
                infoCleEtrangere: infoTable.clesEtrangeres.find((ce) => ce.code === att.code),
            }))
        return [
                new Paragraph({
                    heading: 'Heading3',
                    text: `Informations concernant la table ${infoTable.code}`
                }),
                DocxUtils.construireTableau(
                [
                    { intitule: 'Attribut', contenu: (ic: InfoColonne) => ic.code, largeur: 15, },
                    { intitule: 'Type', contenu: (ic: InfoColonne) => ic.type, largeur: 15, },
                    { intitule: 'Longueur', contenu: (ic: InfoColonne) => ic.taille ? ic.taille.toString() : '', largeur: 15, },
                    { intitule: 'Clé Primaire', contenu: (ic: InfoColonne) => ic.estClePrimaire ? 'X' : '', largeur: 10, },
                    { intitule: 'Obligatoire', contenu: (ic: InfoColonne) => ic.nullable ? '' : 'X', largeur: 10, },
                ],
                lignes,
            )
        ]
    }
    
    private construireTableauCleEtrangere(infoTable: InfoTable): [Paragraph, Table,] | undefined {
        const lignes: InfoColonne[] = infoTable.attributs
            .map((att) => ({
                ...att,
                estClePrimaire: infoTable.clesPrimaires.includes(att.code),
                infoCleEtrangere: infoTable.clesEtrangeres.find((ce) => ce.code === att.code),
            }))
            .filter((att) => att.infoCleEtrangere);
        if (lignes.length === 0) return;
        return [
            new Paragraph({
                heading: "Heading3",
                text: `Clés étrangères de la table ${infoTable.code}`
            }),
            DocxUtils.construireTableau(
            [
                { intitule: 'Attribut', contenu: (ic: InfoColonne) => ic.code, largeur: 15, },
                { intitule: 'Table référence', contenu: (ic: InfoColonne) => ic.infoCleEtrangere.tableReference, largeur: 15, },
                { intitule: 'Colonne référence', contenu: (ic: InfoColonne) => ic.infoCleEtrangere.colonneReference, largeur: 15, },
            ],
            lignes,
        )]
    }
}

export default new ModeleLogiqueDonneesService; 