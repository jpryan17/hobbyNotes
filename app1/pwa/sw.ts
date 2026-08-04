//hobbyNote app service worker
import {DBI} from '../../clientLib/dbi.js'


const app = 'app1'
const editFlag = false
const thisOrigin = 'https://localhost:8080'
const requestSegsURL = `${thisOrigin}/getSegs/${app}/${editFlag ? 'true' : 'false'}` 
const requestSegsDateURL = `${thisOrigin}/getSegsDate/${app}/${editFlag ? 'true' : 'false'}` 
let serverFetchStatus = -1
let msg:string = ''
//
async function serverFetch(){
  try{
    const serverResponse = await fetch(requestSegsURL, {method:'GET'}) 
    serverFetchStatus = 0
    msg = `server fetch responded ok ${serverResponse.ok} status ${serverResponse.status}`
    return serverResponse
  } catch (err){
    serverFetchStatus = 1
    msg = `server fetch failed ${err}`
  }
  console.log(msg)
}
async function serverDateFetch(){
  try{
    const serverResponse = await fetch(requestSegsDateURL, {method:'GET'}) 
    serverFetchStatus = 0
    msg = `server date fetch responded ok ${serverResponse.ok} status ${serverResponse.status}`
    return serverResponse
  } catch (err){
    serverFetchStatus = 1
    msg = `server date fetch failed ${err}`
  }
  console.log(msg)
}
async function installer(){
  serverFetchStatus = -1
  msg = ''
  console.log('in sw install')
  try {
    const serverResponse = await serverFetch() as Response
    if (serverFetchStatus == 0 && serverResponse.ok){
      const segs = await serverResponse.text()
      await DBI.store(segs)
    }
  } catch (err) {
    serverFetchStatus = 1
    console.log(`server connect error ${err}`)
  }  
}
addEventListener('install', installer)
addEventListener("message", async (event) => {
  console.log(`processing message ${event.data}`)
  const currentClients = await clients.matchAll()
  if(currentClients.length == 1){
    const currentClient = currentClients[0]
    if (event.data == 'reinstall') {
      await installer()
      if(serverFetchStatus = -1) {
        currentClient.postMessage('reinstalled')
        console.log('reinstall successful')
      } else {
        currentClient.postMessage('reinstallError')
        console.log('reinstall message fetch error')
      }
    }
  } else {
    console.log('reinstall message client match error')
  }
  
  
})
addEventListener("fetch", (ev:FetchEvent) => {
  ev.respondWith(new Promise(async () => {
    console.log('in sw fetch')
    await DBI.getSegs()
    let res:Response
    if (DBI.status == 0){
      res = new Response(DBI.retrieved[1],{status:200})
    } else {
      res = new Response(null,{status:400})
    }
    checkForNewVersion()
    return (res)
  }))
})
async function checkForNewVersion(){
  serverFetchStatus = -1
  msg = ''
  console.log('checking for new version')
  const serverResponse = await serverDateFetch() as Response
  if (serverFetchStatus == 0 && serverResponse.ok){
      const timestampString = await serverResponse.text()
      const timestamp = +timestampString
      await DBI.getSegs()
      let res:Response
      if (DBI.status == 0){
        const storeTime = DBI.retrieved[0].getTime()
        if(timestamp > storeTime){
          DBI.setNewVersion(true)
        }
      }
  }
}

    