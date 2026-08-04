// indexedDB interface
export class DBI {

    static db:IDBDatabase
    static dbName = 'segStore'
    static objStore = 'segsInfo'
    static objName = 'segs'
    static status = -1
    static msg = ''
    static retrieved:[Date,string]
    static newVersion = false
    static reinstalled = false

    static setNewVersion(v:boolean){DBI.newVersion=v}
    static setReinstalled(v:boolean){DBI.reinstalled=v}

    static async open(){
        let request = await indexedDB.open(DBI.dbName, 1)
        request.onerror = event => {
            DBI.status = 1
            DBI.msg = `could not open db ${event}`
        }
        request.onupgradeneeded = event => {
            console.log('idb onupgradeneeded firing')
            const dbr = event.target as IDBOpenDBRequest
            const db = dbr.result
            db.createObjectStore(DBI.objStore)
        }
        request.onsuccess = event => {
            let dbr = event.target as IDBOpenDBRequest
            DBI.db = dbr.result
        }
    }
    static async store(segs:string){
        await DBI.open()
        if(DBI.status == -1){
            try{
                let transaction = DBI.db.transaction([DBI.objStore], 'readwrite')
                transaction.oncomplete = () => {
                    const store = transaction.objectStore(DBI.objStore)
                    const info = [Date(),segs] 
                    try {
                        store.put(info,DBI.objName)
                        DBI.status = 0
                        DBI.msg  = 'segs stored'
                    } catch (err) {
                        DBI.status = 2
                        DBI.msg = `segs store error ${err}`
                    }
                }
                transaction.onerror = event => {
                    DBI.status = 3
                    DBI.msg = `transaction error storing segs ${event}`
                }
            } catch (err) {
                DBI.status = 4
                DBI.msg =`error establishing db transaction ${err}`
            }
            console.log(`status ${DBI.status} msg ${DBI.msg}`)
        } 
    }          
    static async getSegs(){
        await DBI.open()
        if (DBI.status == -1){
            try {
                let transaction = DBI.db.transaction([DBI.objStore], 'readonly')
                transaction.oncomplete = event => {
                    const store = transaction.objectStore(DBI.objStore)
                    const request = store.get(DBI.objName)
                    request.onsuccess = event => {
                        const target = event.target as IDBRequest
                        DBI.retrieved = target.result
                        DBI.status = 0
                        DBI.msg = 'segs retrieved'
                    }
                    request.onerror = event => {
                        DBI.status = 1
                        DBI.msg = `segs retrieve error ${event}`
                    }
                }
                transaction.onerror = event => {
                    DBI.status = 2
                    DBI.msg = `transaction error retrieving segs ${event}`

                }
            } catch (err){
                DBI.status = 1
                DBI.msg = `error establishing db transaction ${err}`
            }
            console.log(`status ${DBI.status} msg ${DBI.msg}`)
        }
    }
}
 