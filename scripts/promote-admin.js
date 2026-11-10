const fs = require('node:fs');
const {PrismaClient} = require('@prisma/client');

// Load the ignored local .env without printing credentials.
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env','utf8').split(/\r?\n/)) {
    const match=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^"|"$/g,'');
  }
}

// This is a one-off maintenance command. Prefer Supabase's direct database URL
// so it does not consume a slot from the small session pool used by the app.
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;

const email=(process.argv[2]||'').trim().toLowerCase();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
  console.error('Usage: npm run db:promote-admin -- user@example.com');
  process.exit(2);
}

const db=new PrismaClient();
async function main(){
  const users=await db.$queryRaw`select id from auth.users where lower(email)=lower(${email})`;
  if(users.length!==1){console.error('No unique Supabase Auth user found. Register the account in the app first.');process.exitCode=1;return;}
  const id=users[0].id;
  const profile=await db.profile.findUnique({where:{id}});
  if(profile)await db.profile.update({where:{id},data:{role:'ADMIN'}});
  else await db.profile.create({data:{id,fullName:email.split('@')[0],role:'ADMIN'}});
  console.log('Admin role assigned to the existing Supabase Auth account.');
}
main().catch(error=>{console.error('Could not assign admin role:',error.message);process.exitCode=1}).finally(()=>db.$disconnect());
