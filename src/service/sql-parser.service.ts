import { Ast, AstComment, AstCreate } from "../modele/ast.modele";
import InfoTable, { Attribut, AttributCleEtrangere } from "../modele/info-table.interface";
import ObjetUtils from "../utils/objet.utils";

const nsp = require('node-sql-parser/build/postgresql');
const fs = require('fs');

class SqlParser {
    recupererTablesCrees(): InfoTable[] {
        const infoTable = this.chargerSQL()
            .filter((ast) => ast.type === 'create')
            .map((ast) => this.construireInfoTable(ast))

        this.ajouterCommentaire(
            infoTable, 
            this.chargerSQL().filter((ast) => ast.type === 'comment')
        );
        
        return infoTable;
    }

    private ajouterCommentaire(infoTable: InfoTable[], ast: AstComment[]): void {
        ast
            .filter((ac) => ac.target.type === 'table')
            .forEach((ac) => {
                const table = ac.target.name.table.toUpperCase();
                const infoTableAssocie = infoTable.find((it) => it.code === table);
                infoTableAssocie.description = ac.expr.expr.value;
            });

        ast
            .filter((ac) => ac.target.type === 'column')
            .forEach((ac) => {
                const table = ac.target.name.table.toUpperCase();
                const tableAssociee = infoTable.find((it) => it.code === table);
                const colonneAssociee = tableAssociee.attributs
                    .find((colonne) => colonne.code === ac.target.name.column.expr.value.toUpperCase());
                colonneAssociee.description = ac.expr.expr.value;
            });

        
    }

    private chargerSQL(): Ast[] {
        const sqlFile = fs.readFileSync('./ressources/schema.sql').toString();
        const parser = new nsp.Parser();
        return parser.astify(sqlFile) as Ast[];
    }

    private construireInfoTable(ast: AstCreate): InfoTable {
        return {
            attributs: this.recupererAttribut(ast),
            clesEtrangeres: this.recupererClesEtrangeres(ast),
            clesPrimaires: this.recupererClesPrimaire(ast),
            code: ast.table[0].table.toUpperCase(),
        }
    }

    private recupererClesPrimaire(ast: AstCreate): string[] {
        const clePrimaires = ast.create_definitions
                .filter((cd) => cd.primary_key)
                .map((cd) => {
                    if (Array.isArray(cd.definition)) throw new Error('Type impossible');
                    return cd.column.column.expr.value.toUpperCase();
                });
        const clesPrimares2 = ast.create_definitions
            .filter((cd) => cd.constraint_type === 'primary key' && Array.isArray(cd.definition))
            .flatMap((cd) => Array.isArray(cd.definition) ? cd.definition : [])
            .map((def) => def.column.expr.value.toUpperCase())
        return [...clesPrimares2, ...clePrimaires];
    }

    private recupererAttribut(ast: AstCreate): Attribut[] {
        return ast.create_definitions
            .filter((cd) => !Array.isArray(cd.definition))
            .map((cd) => {
                if (Array.isArray(cd.definition)) throw new Error('Type impossible');
                return {
                    code: cd.column.column.expr.value.toUpperCase(),
                    type: cd.definition.dataType.toUpperCase(),
                    nullable: cd.nullable?.value !== 'not null' && cd.definition.dataType.toUpperCase() !== 'SERIAL',
                    default: ObjetUtils.toString(cd.default_val?.value.value),
                    taille: cd.definition.length,
                };
            })
    }

    private recupererClesEtrangeres(ast: AstCreate): AttributCleEtrangere[] {
        return ast.create_definitions
            .filter((cd) => cd.reference_definition?.table.length > 0)
            .map((cd): AttributCleEtrangere => {
                let codeAttribut: string;
                if (!Array.isArray(cd.definition)) {
                    codeAttribut = cd.column.column.expr.value;
                } else {
                    codeAttribut = cd.definition[0].column.expr.value
                }
                return {
                    code: codeAttribut.toUpperCase(),
                    tableReference: cd.reference_definition?.table[0].table.toUpperCase(),
                    colonneReference: cd.reference_definition.definition[0].column.expr.value.toUpperCase(),
                }
            });
        }
}

export default new SqlParser;