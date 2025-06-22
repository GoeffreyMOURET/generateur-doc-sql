import modeleLogiqueDonneeService from "./service/modele-logique-donnee.service";
import modelePhysiqueDonneesService from "./service/modele-physique-donnees.service";
import sqlParserService from "./service/sql-parser.service";

export async function main() {
    
    const infoTable = sqlParserService.recupererTablesCrees();
    modeleLogiqueDonneeService.construireModele(infoTable);
    modelePhysiqueDonneesService.construireModele(infoTable);
    
}

main();
