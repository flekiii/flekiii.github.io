/* Real Steam games from SteamSpy, no made-up cover art or names. */
const ORIGIN="https://flekiii.github.io";
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":ORIGIN,"Cache-Control":"public,max-age=300","X-Content-Type-Options":"nosniff"}});
export async function gamesCatalog(req,path){
 if(path!=="/games/catalog")return null;
 if(req.method!=="GET")return json({error:"Method not allowed"},405);
 const n=Number(new URL(req.url).searchParams.get("page")||0);
 if(!Number.isInteger(n)||n<0||n>10)return json({error:"Invalid page"},400);
 const url="https://steamspy.com/api.php?request=all&page="+n;
 const key=new Request("https://flekis-wrld-api.flekideveloper.workers.dev/games/catalog?page="+n,{method:"GET"});
 try{
  const cache=typeof caches==="object"?caches.default:null;
  const hit=cache?await cache.match(key):null;if(hit)return hit;
  const response=await fetch(url,{headers:{Accept:"application/json","User-Agent":"FlekisWrldGameCatalog/1.0"},cf:{cacheTtl:86400,cacheEverything:true}});
  if(!response.ok)return json({error:"Steam catalog temporarily unavailable. Retry later."},503);
  const raw=await response.json();
  if(!raw||typeof raw!=="object")return json({error:"Unexpected Steam catalog response"},502);
  const games=Object.values(raw).filter(x=>x&&Number.isInteger(x.appid)&&x.appid>0&&typeof x.name==="string"&&x.name.trim()).map(x=>({id:x.appid,name:x.name.trim().slice(0,95)})).slice(0,1000);
  const result=json({games,page:n,source:"SteamSpy",next_page:n+1});
  if(cache&&games.length>0){const cached=new Response(result.body,{status:200,headers:{...Object.fromEntries(result.headers), "Cache-Control":"public,max-age=86400"}});await cache.put(key,cached.clone());return cached}
  return result;
 }catch{return json({error:"Steam catalog unavailable. Check your connection and retry."},503)}
}
