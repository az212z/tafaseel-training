import {createClient} from 'npm:@supabase/supabase-js@2'
const origins=['https://az212z.github.io','http://localhost:4173','http://localhost:5173','http://127.0.0.1:4173','http://127.0.0.1:5173']
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'',headers={'Cache-Control':'no-store, private, max-age=0','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],'Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'}
 const failure=(status=404)=>new Response(JSON.stringify({error:'MATERIAL_UNAVAILABLE'}),{status,headers:{...headers,'Content-Type':'application/json'}})
 if(req.method==='OPTIONS')return new Response(null,{headers})
 if(req.method!=='POST')return failure(405)
 if(origin&&!origins.includes(origin))return failure(403)
 const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');if(!token)return failure(401)
 try{
 const raw=await req.text();if(raw.length>1000)return failure(400);const {lesson_id}=JSON.parse(raw);if(typeof lesson_id!=='string'||!/^[0-9a-f-]{36}$/.test(lesson_id))return failure(400)
 const url=Deno.env.get('SUPABASE_URL')!,service=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}}),caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}})
 const {data:{user},error}=await service.auth.getUser(token);if(error||!user)return failure(401)
 // Query the current database policy on EVERY download; never rely on a cached object authorization.
 const lesson=await caller.from('lessons').select('id,file_path').eq('id',lesson_id).maybeSingle();if(lesson.error||!lesson.data?.file_path)return failure()
 const file=await service.storage.from('course-materials').download(lesson.data.file_path);if(file.error||!file.data)return failure()
 return new Response(file.data,{headers:{...headers,'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="course-material.'+(lesson.data.file_path.split('.').pop()||'pdf')+'"'}})
 }catch{return failure()}
})
