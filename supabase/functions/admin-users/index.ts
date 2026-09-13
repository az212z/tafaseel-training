import {createClient} from 'npm:@supabase/supabase-js@2'
const origins=['https://az212z.github.io','http://localhost:5173','http://localhost:4173','http://127.0.0.1:5173','http://127.0.0.1:4173']
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'',headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],'Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'}
 const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers})
 if(req.method==='OPTIONS')return new Response(null,{headers})
 if(req.method!=='POST')return response({error:'METHOD_NOT_ALLOWED'},405)
 if(origin&&!origins.includes(origin))return response({error:'FORBIDDEN'},403)
 if(Number(req.headers.get('content-length'))>10000)return response({error:'INVALID_INPUT'},400)
 const token=req.headers.get('authorization')?.replace(/^Bearer /i,'')
 if(!token)return response({error:'UNAUTHORIZED'},401)
 const url=Deno.env.get('SUPABASE_URL')!,service=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}}),caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}})
 const {data:{user},error}=await service.auth.getUser(token)
 if(error||!user)return response({error:'UNAUTHORIZED'},401)
 try{
 const raw=await req.text();if(raw.length>10000)return response({error:'INVALID_INPUT'},400);const body=JSON.parse(raw)
 if(body.action==='change_password'){
  if(typeof body.password!=='string'||body.password.length<10||body.password.length>128||!/[A-Z]/.test(body.password)||!/[a-z]/.test(body.password)||!/[0-9]/.test(body.password)||typeof body.current_password!=='string')return response({error:'weak_password'},400)
  const verifier=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
  const check=await verifier.auth.signInWithPassword({email:user.email!,password:body.current_password});if(check.error)return response({error:'invalid_credentials'},400)
  await verifier.auth.signOut({scope:'local'})
  const updated=await service.auth.admin.updateUserById(user.id,{password:body.password});if(updated.error)throw updated.error
  const cleared=await service.from('profiles').update({must_change_password:false}).eq('id',user.id);if(cleared.error)throw cleared.error
  return response({ok:true})
 }
 const role=await caller.rpc('is_admin');if(role.error||role.data!==true)return response({error:'FORBIDDEN'},403)
 const {count}=await service.from('audit_logs').select('id',{count:'exact',head:true}).eq('actor_id',user.id).in('action',['CREATE_ACCOUNT','RESET_PASSWORD']).gt('created_at',new Date(Date.now()-3600000).toISOString())
 if((count||0)>=30)return response({error:'RATE_LIMIT'},429)
 const password='Tf'+crypto.randomUUID().replaceAll('-','').slice(0,18)+'9!'
 let target:string
 if(body.action==='create'){
  const p=body.profile
  if(!p||typeof p.full_name!=='string'||p.full_name.trim().length<2||p.full_name.length>100||typeof p.phone!=='string'||!/^\+?[0-9]{9,15}$/.test(p.phone)||typeof p.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)||p.email.length>254)return response({error:'INVALID_INPUT'},400)
  const created=await service.auth.admin.createUser({email:p.email.trim(),password,email_confirm:true,user_metadata:{full_name:p.full_name.trim(),phone:p.phone,city:String(p.city||'').slice(0,100),education_level:String(p.education_level||'').slice(0,100)}})
  if(created.error)return response({error:created.error.code==='email_exists'?'ACCOUNT_EXISTS':'CREATE_FAILED'},400)
  target=created.data.user.id
 }else if(body.action==='reset'){
  if(typeof body.user_id!=='string')return response({error:'INVALID_INPUT'},400)
  const protectedAccount=await service.from('admin_users').select('user_id').eq('user_id',body.user_id).maybeSingle()
  if(protectedAccount.error||protectedAccount.data)return response({error:'ADMIN_ACCOUNT_PROTECTED'},403)
  const updated=await service.auth.admin.updateUserById(body.user_id,{password});if(updated.error)throw updated.error;target=body.user_id
 }else return response({error:'INVALID_ACTION'},400)
 const marked=await service.from('profiles').update({must_change_password:true}).eq('id',target);if(marked.error)throw marked.error
 const logged=await service.from('audit_logs').insert({actor_id:user.id,action:body.action==='create'?'CREATE_ACCOUNT':'RESET_PASSWORD',table_name:'profiles',record_id:target});if(logged.error)throw logged.error
 return response({user_id:target,password})
 }catch{return response({error:'OPERATION_FAILED'},400)}
})
