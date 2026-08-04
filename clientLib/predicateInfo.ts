import { Context } from "./context.js"


export interface Type{
    name:string,
    symbol:string,
    kind: 'primitive'|'collection'|'subtype'
    desc?:string,
    primitiveInstances?:string[],
    typeRef?: string,
    typeRefs?:string[]
}
export interface VariableSet{
    name:string,
    forType:string,
    scheme: 'plain'|'subscripts'
    base:string[]
}
export interface MapDeclaration{
    name:string
    symbol:string,
    desc?:string,
    fromTypes:string[],
    toType:string
}
export interface MapStatement{
    forMap:string,
    statement:string
}
export interface EditorContext{
    name:string,
    types:string[],
    variableSets:string[],
    maps:string[]
}
export class PredInfo{
    static types:Type[]=[
        {
            name:'TruthValue',
            symbol:'\u{1D54B}',
            kind:'primitive',
            primitiveInstances:['true','false']
        },
        {
            name:'GType',
            symbol:'\u{1D4A2}\u{1D4AF}\u{1D4CE}\u{1D4C5}\u{212F}',
            kind:'primitive'
        },
        {
            name:'Type',
            symbol:'\u{1D4AF}',
            kind:'subtype',
            typeRef:'GType'
        },
        {
            name:'TypeCollection',
            symbol:'u\{1D49E}(\u{1D4AF})',
            kind:'collection',
            typeRef:'Type'
        },
        {
            name:'CollectionCollection',
            symbol:'u\{1D49E}(u\{1D49E}(\u{1D4AF}))',
            kind:'collection',
            typeRef:'typeCollection'
        }
    ]
    static variableSets:VariableSet[]=[
        {
            name:'instances',
            forType:'Type',
            scheme:'plain',
            base:['x','y','z','w']
        },
        {
            name:'sets',
            forType:'TypeCollection',
            scheme:'plain',
            base:['a','b','c','d']
        }
    ]
    static maps:MapDeclaration[]=[
        {
            name:'instanceEquality',
            symbol:'=',
            fromTypes:['Type','Type'],
            toType:'TruthValue'
        },
        {
            name:'membership',
            symbol:'\u{220A}',
            fromTypes:['Type','TypeCollection'],
            toType:'TruthValue',
        },
        {
            name:'inclusion',
            symbol:'\u{2282}',
            fromTypes:['TypeCollection','TypeCollection'],
            toType:'TruthValue'
        },
        {
            name:'collectionEquality',
            symbol:'=',
            fromTypes:['TypeCollection','TypeCollection'],
            toType:'TruthValue'
        },
        {
            name:'union',
            symbol:'\u{222A}',
            fromTypes:['TypeCollection','TypeCollection'],
            toType:'TypeCollection'
        },
        {
            name:'intersection',
            symbol:'\u{2229}',
            fromTypes:['TypeCollection','TypeCollection'],
            toType:'TypeCollection'
        }
    ]
    static contexts:EditorContext[]=[
        {
            name:'collectionBase',
            types:['Type','TypeCollection','CollectionCollection'],
            variableSets:['instances','sets'],
            maps:['membership', 'inclusion',
                  'instanceEquality', 'collectionEquality',
                  'union', 'intersection']
        }
    ]
}