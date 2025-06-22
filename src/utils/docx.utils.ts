import { Paragraph, Table, TableCell, TableRow, WidthType } from "docx";

const docx = require('docx');

interface BaliseTraduction {
    balise: string,
    option: { [key: string]: boolean, },
    optionSupprimee: { [key: string]: boolean, },
}

interface ColonneTableau<T> { 
    intitule: string, 
    contenu: (donnee: T) => string, 
    largeur ?: number, 
};

interface ColonneNormee<T> {
    intitule: string,
    contenu: (donnee: T) => string,
    largeur: number,
}

const balisesTraductions: BaliseTraduction[] = [
    { balise: '<b>', option: { bold: true, }, optionSupprimee: { bold: false, }, },
    { balise: '<i>', option: { italics: true, }, optionSupprimee: { italics: false, }, },
    { balise: '<u>', option: { underline: true, }, optionSupprimee: { underline: false, }, },
]

const LARGEUR_TABLE = 10000;

export default class DocxUtils {
    static ajouterParagraphe(text: string) {
        return new docx.Paragraph({
            children: this.toDocxFormat(text),
        })
    }

    private static toDocxFormat(texte: string) {
        const balisesAConsiderer = balisesTraductions.map((balise) => balise.balise);
        const balisesFermantesAConsiderer = balisesAConsiderer.map(baliseFermante);
        const infoIntermediaire = {
            texte: '',
            options: {}
        };
        const resultat = [];

        for (let i = 0; i < texte.length; i++) {
            if (i+2<texte.length && balisesAConsiderer.includes(texte.substring(i, i+3))) {
                resultat.push(new docx.TextRun({
                    text: infoIntermediaire.texte,
                    ...infoIntermediaire.options,
                }));
                infoIntermediaire.texte = '';
                const baliseTraduction = balisesTraductions.find((balTrad) => balTrad.balise === texte.substring(i, i+3));
                infoIntermediaire.options = { ...infoIntermediaire.options, ...baliseTraduction.option, };
                i+=2;
            } else if (i+3<texte.length && balisesFermantesAConsiderer.includes(texte.substring(i, i+4))) {
                resultat.push(new docx.TextRun({
                    text: infoIntermediaire.texte,
                    ...infoIntermediaire.options,
                }));
                infoIntermediaire.texte = '';
                const baliseTraduction = balisesTraductions.find((balTrad) => baliseFermante(balTrad.balise) === texte.substring(i, i+4));
                infoIntermediaire.options = { ...infoIntermediaire.options, ...baliseTraduction.optionSupprimee, };
                i+=3;
            } else {
                infoIntermediaire.texte = infoIntermediaire.texte + texte.charAt(i);
            }
        }
        if (infoIntermediaire.texte !== '') {
            resultat.push(new docx.TextRun({ text: infoIntermediaire.texte, }))
        }
        return resultat;
    }

    /**
     * Permet de construire un tableau au format docx
     * @param colonnes : informations conrresponsantes aux colonnes. La largeur finale appliquée sera calculée proportionnellement 
     *  à la largeur d'une page. Si une colonne n'a pas de largeur spécifiée, une largeur par défaut sera calculée 
     * @param donnees : Les données à mettre dans les lignes du tableau
     */
    static construireTableau<T>(
        colonnes: ColonneTableau<T>[],
        donnees: T[]
    ) {
        this.appliquerLargeurDefaut(colonnes);
        const colonnesNormees = this.construireColonnesNormees(colonnes);
        
        return this.construireTableauDocx(colonnesNormees, donnees);

    }

    private static appliquerLargeurDefaut<T>(colonnes: ColonneTableau<T>[]): void {
        const largeurDefaut = LARGEUR_TABLE / colonnes.length;
        colonnes.forEach((col) => col.largeur = col.largeur ?? largeurDefaut);
    }

    private static construireColonnesNormees<T> (
        colonnes: ColonneTableau<T>[]
    ): ColonneNormee<T>[] {
        const sommeLargeurColonnes = colonnes.map((c) => c.largeur).reduce((a, b) => a + b, 0) ;
        const colonnesNormees: ColonneNormee<T>[] = colonnes
            .map((col) => ({
                intitule: col.intitule,
                contenu: col.contenu,
                largeur: LARGEUR_TABLE * col.largeur / sommeLargeurColonnes 
            }));
        return colonnesNormees;
    }

    private static construireTableauDocx<T>(
        colonnesNormees: ColonneNormee<T>[],
        donnees: T[]
    ): Table {
        return  new Table({
            columnWidths: colonnesNormees.map((cn) => cn.largeur),
            rows: [
                new TableRow({
                    children: colonnesNormees
                        .map((cn) => new TableCell({
                            width: { size: cn.largeur, type: WidthType.DXA, },
                            children: [new Paragraph({ text: cn.intitule, })],
                        })
                    ),
                }),
                ...donnees.map((donnee) =>  new TableRow({
                    children: colonnesNormees
                        .map((cn) => new TableCell({
                            width: { size: cn.largeur, type: WidthType.DXA, },
                            children: [new Paragraph({ text: cn.contenu(donnee), })],
                        })),
                    }),
                ),
            ],
        });
    }

    static ajouterSautDeLigne<T>(lignes: (T | undefined)[]): (T | Paragraph)[] {
        return lignes
            .filter((table) => table !== undefined)
            .flatMap((table) => [table, new Paragraph('')]);
    }

    static sautDeLigne(): Paragraph {
        return new Paragraph('')
    }

    static construireTitre1(titre: string): Paragraph {
        return new Paragraph({
            heading: "Heading1",
            text: titre,
        })
    }

    static construireTitre2(titre: string): Paragraph {
        return new Paragraph({
            heading: "Heading2",
            text: titre,
        })
    }
    
    static construireTitre3(titre: string): Paragraph {
        return new Paragraph({
            heading: "Heading3",
            text: titre,
        })
    }
}

const baliseFermante = (balise: string) => balise[0] + '/' + balise.substring(1);