interface ContextInput {
    name:string,
    nickName?:string,
    import?:string[],
    domain:string[],
    binding:string[],
    primitive?:string[]
    definition:string[],
    statement:string[]
}
export class Context{ 

    constructor(public ci:ContextInput){

    }
    recordContext(){

    }
    static retrieveContextObject(contextName:string){

    }
}