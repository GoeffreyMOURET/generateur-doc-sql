import { AstComment, AstCreate, ColumnAst, ReferenceDefinitionAst } from "../modele/ast.modele";
import { readFileSync } from 'fs';
import { AST, ColumnRef, Create, Parser } from 'node-sql-parser/build/postgresql';
import InfoTable, { Attribut, AttributCleEtrangere, UniqueContrainte } from "../modele/info-table.interface";
import ObjetUtils from "../utils/objet.utils";
import { CHEMIN_RESSOURCE } from "../constante/sauvegarde.constante";

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

    private chargerSQL(): (AST | AstComment)[] {
        const sqlFile = readFileSync(`${CHEMIN_RESSOURCE}/schema.sql`).toString();
        const resultat = new Parser().parse(sqlFile).ast;
        return Array.isArray(resultat) ? resultat : [resultat];
    }

    private construireInfoTable(ast: Create): InfoTable {
        return {
            attributs: this.recupererAttribut(ast),
            clesEtrangeres: this.recupererClesEtrangeres(ast),
            clesPrimaires: this.recupererClesPrimaire(ast),
            code: ast.table[0].table.toUpperCase(),
            uniques: this.recupererContraintesUniques(ast)
        }
    }

    private recupererClesPrimaire(ast: Create): string[] {
        const clePrimaires = (ast as unknown as AstCreate).create_definitions
                .filter((cd) => cd.resource === "column")
                .filter((cd) => cd.primary_key)
                .map((cd) => {
                    if (Array.isArray(cd.definition)) throw new Error('Type impossible');
                    return cd.column.column.expr.value.toUpperCase();
                });
        const clesPrimares2 = ast.create_definitions
            .filter((cd) => cd.resource === "constraint" && cd.constraint_type === "primary key")
            .flatMap((cd) => cd.definition)
            .filter((def) => def.type === "column_ref")
            .map((def) => {
                if (typeof def.column === 'string') throw new Error('Type impossible');
                return def.column.expr.value.toString().toUpperCase();
            })
        return [...clesPrimares2, ...clePrimaires];
    }

    private recupererAttribut(ast: Create): Attribut[] {
        return ast.create_definitions
            .filter((cd) => cd.resource === "column")
            .map((cd) => {
                if (cd.column.type !== 'column_ref' 
                    || typeof cd.column.column === 'string') throw new Error('Type impossible');
                return {
                    code: cd.column.column.expr.value.toString().toUpperCase(),
                    type: cd.definition.dataType.toUpperCase(),
                    nullable: cd.nullable?.value !== 'not null' && cd.definition.dataType.toUpperCase() !== 'SERIAL',
                    default: ObjetUtils.toString(cd.default_val?.value.value),
                    taille: cd.definition.length,
                };
            })
    }

    private recupererClesEtrangeres(ast: Create): AttributCleEtrangere[] {
        const cleEtrangereDefinieColonne = ast.create_definitions
            .filter((cd) => cd.resource === "column")
            .filter((cd) => (cd.reference_definition as unknown as ReferenceDefinitionAst)?.table.length > 0)
            .map((cd): AttributCleEtrangere => {
                if (cd.column.type !== 'column_ref' || typeof cd.column.column === 'string') throw new Error('Type impossible');
                const codeAttribut = cd.column.column.expr.value.toString();                

                return {
                    code: codeAttribut.toUpperCase(),
                    tableReference: (cd.reference_definition as unknown as ReferenceDefinitionAst)?.table[0].table.toUpperCase(),
                    colonneReference: (cd.reference_definition as unknown as ReferenceDefinitionAst).definition[0].column.expr.value.toUpperCase(),
                }
            });

        const cleEtrangereDefinieContrainte = ast.create_definitions
            .filter((cd) => cd.resource === "constraint" && cd.constraint_type === "FOREIGN KEY")
            .filter((cd) => (cd.reference_definition as unknown as ReferenceDefinitionAst)?.table.length > 0)
            .map((cd): AttributCleEtrangere => {
                if (cd.definition[0].type !== "column_ref" || typeof cd.definition[0].column === "string") throw new Error('Type impossible')
                const codeAttribut = cd.definition[0].column.expr.value.toString();
                return {
                    code: codeAttribut.toUpperCase(),
                    tableReference: cd.reference_definition.table[0].table.toUpperCase(),
                    colonneReference: cd.reference_definition.definition[0].column.expr.value.toUpperCase(),
                }
            });
            return [...cleEtrangereDefinieColonne, ...cleEtrangereDefinieContrainte,]
    }

    recupererContraintesUniques(ast: Create): UniqueContrainte[] {
        const contraintesUniqueDefinitionColonne: UniqueContrainte[] = ast.create_definitions
            .filter((cd) => cd.resource === "column")
            .filter((cd) => cd.unique)
            .map((cd) => {
                if (cd.column.type !== 'column_ref' || typeof cd.column.column === 'string') throw new Error('Type impossible');
                const codeAttribut = ObjetUtils.toString(cd.column.column.expr.value).toUpperCase() ?? '';
                return {
                    code: [codeAttribut],
                    nom: `CK_UNIQUE_${ast.table[0].table}_${codeAttribut}`
                };
            }
        );

        const contraintesUniqueDefinitionContrainte: UniqueContrainte[] = ast.create_definitions
            .filter((cd) => cd.resource === "constraint")
            .filter((cd) => cd.constraint_type === "unique")
            .map((cd) => {
                return {
                    code: cd.definition
                        .filter((def) => def.type === "column_ref")
                        .map((def) => (def as ColumnAst).column.expr.value.toUpperCase()),
                    nom: cd.constraint.toUpperCase()
                };
            }
        )

        return [...contraintesUniqueDefinitionColonne, ...contraintesUniqueDefinitionContrainte]

    }
}

export default new SqlParser;