export type Ast = AstCreate | AstComment;

export interface AstComment {
    type: 'comment',
    keyword: 'on',
    target: {
        type: 'table' | 'column',
        name: {
            db: string | null,
            table: string,
            column?: { expr: { type: 'default', value: string, }},
        }
    },
    expr: {
        keyword: 'is',
        expr: {
            type: string,
            value: string,
        }
    }
}

export interface AstCreate {
    type: 'create',
    table: { db: string | null, table: string, as: string | null, }[],
    keyword: 'view' | 'table',
    create_definitions: { 
        column: ColumnAst,
        constraint_type?: string,
        definition: { dataType: string, suffix: any[], length ?: number, } | ColumnAst[],
        resource: 'column',
        primary_key?: 'primary_key',
        nullable?: { type: 'not null', value: 'not null', },
        default_val ?: {
            type: "string",
            value: {
                type: string,
                value: string | boolean | number
            }
        },
        reference_definition?: {
            definition: ColumnAst[],
            table: { db: any, table: string, }[],
            keyword: 'references',
            match: null,
            on_action: any[]
        },
        check?: {
            constraint_type: 'check',
            keyword: any,
            constraint: null,
            definition: any[],
            enforced: string,
            resource: 'constraint',
        }[],
    }[]
}

interface ColumnAst { type: 'column_ref', column: { expr: { type: 'default', value: string, }}, };