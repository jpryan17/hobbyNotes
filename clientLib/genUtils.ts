export function handleOverrides(c:any,overrides:any[][]|undefined){
    if(overrides){
        overrides.forEach( ov =>{
            let obj = c 
            for(let i=0;i<ov.length-2;i++){
                obj = Reflect.get(obj,ov[i])
             }
            Reflect.set(obj,ov[ov.length-2],ov[ov.length-1])
        })
    }
}
