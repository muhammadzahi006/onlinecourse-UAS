const fs=require('node:fs');
const {PrismaClient}=require('@prisma/client');
const {createClient}=require('@supabase/supabase-js');

function loadEnv(file){
  if(!fs.existsSync(file))return;
  for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const match=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
  }
}
loadEnv('.env');
loadEnv('.env.local');

const password=process.env.DEMO_ACCOUNT_PASSWORD;
if(!password||password.length<12){
  console.error('Set DEMO_ACCOUNT_PASSWORD to a demo password of at least 12 characters, then rerun.');
  process.exit(2);
}
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!anonKey){console.error('Supabase URL and anon key must be set in .env.local.');process.exit(2);}

const accounts=[
  {id:'10000000-0000-4000-8000-000000000001',name:'Nadia Putri',role:'INSTRUCTOR'},
  {id:'10000000-0000-4000-8000-000000000002',name:'Rizky Pratama',role:'INSTRUCTOR'},
  {id:'10000000-0000-4000-8000-000000000003',name:'Sarah Amelia',role:'INSTRUCTOR'},
  {id:'10000000-0000-4000-8000-000000000004',name:'Fajar Wibowo',role:'INSTRUCTOR'},
  {id:'10000000-0000-4000-8000-000000000005',name:'Dewi Lestari',role:'INSTRUCTOR'},
  {id:'20000000-0000-4000-8000-000000000001',name:'Alya Putri',role:'STUDENT'},
  {id:'20000000-0000-4000-8000-000000000002',name:'Bima Saputra',role:'STUDENT'},
  {id:'20000000-0000-4000-8000-000000000003',name:'Citra Maharani',role:'STUDENT'},
  {id:'20000000-0000-4000-8000-000000000004',name:'Dimas Prakoso',role:'STUDENT'},
  {id:'20000000-0000-4000-8000-000000000005',name:'Eka Lestari',role:'STUDENT'},
].map(account=>({...account,email:`${account.name.toLowerCase().replace(/\s+/g,'.')}.ruangbelajar@example.com`}));

const supabase=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
const db=new PrismaClient();

async function getOrCreateAuthUser(account){
  let {data,error}=await supabase.auth.signUp({email:account.email,password,options:{data:{full_name:account.name}}});
  if(error&&/already registered|user already|already exists/i.test(error.message)){
    const login=await supabase.auth.signInWithPassword({email:account.email,password});
    data=login.data;error=login.error;
  }
  if(error)throw new Error(`Auth signup failed for ${account.email}: ${error.message}`);
  if(!data.user?.id)throw new Error(`Supabase did not return a user for ${account.email}. Check that Confirm Email is disabled.`);
  return data.user.id;
}

async function remapStudent(tx,oldId,newId){
  for(const row of await tx.enrollment.findMany({where:{studentId:oldId}})){
    const duplicate=await tx.enrollment.findUnique({where:{studentId_courseId:{studentId:newId,courseId:row.courseId}}});
    if(duplicate)await tx.enrollment.delete({where:{id:row.id}});
    else await tx.enrollment.update({where:{id:row.id},data:{studentId:newId}});
  }
  for(const row of await tx.lessonProgress.findMany({where:{studentId:oldId}})){
    const duplicate=await tx.lessonProgress.findUnique({where:{studentId_lessonId:{studentId:newId,lessonId:row.lessonId}}});
    if(duplicate)await tx.lessonProgress.delete({where:{id:row.id}});
    else await tx.lessonProgress.update({where:{id:row.id},data:{studentId:newId}});
  }
  for(const row of await tx.quizAttempt.findMany({where:{studentId:oldId}})){
    const duplicate=await tx.quizAttempt.findFirst({where:{studentId:newId,quizId:row.quizId}});
    if(duplicate)await tx.quizAttempt.delete({where:{id:row.id}});
    else await tx.quizAttempt.update({where:{id:row.id},data:{studentId:newId}});
  }
}

async function main(){
  const results=[];
  for(const account of accounts){
    const authId=await getOrCreateAuthUser(account);
    await db.$transaction(async tx=>{
      await tx.profile.upsert({where:{id:authId},update:{fullName:account.name,role:account.role},create:{id:authId,fullName:account.name,role:account.role}});
      if(account.role==='INSTRUCTOR'){
        await tx.course.updateMany({where:{instructorId:account.id},data:{instructorId:authId}});
      }else{
        await remapStudent(tx,account.id,authId);
      }
      await tx.profile.deleteMany({where:{id:account.id}});
    });
    results.push({email:account.email,role:account.role==='INSTRUCTOR'?'Pengajar':'Peserta'});
  }
  console.log(JSON.stringify({event:'demo_accounts_ready',password,accounts:results},null,2));
}

main().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>db.$disconnect());
