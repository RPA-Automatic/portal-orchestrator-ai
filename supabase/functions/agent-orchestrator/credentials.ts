// As credenciais são cifradas por proprietário e provedor; nunca retornam ao cliente.
// A rotação da chave de serviço exige recadastrar os segredos cifrados por esta versão.
const encoder = new TextEncoder();
async function key() {
 const digest=await crypto.subtle.digest('SHA-256',encoder.encode(`portal-credentials-v1:${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`));
 return crypto.subtle.importKey('raw',digest,'AES-GCM',false,['encrypt','decrypt']);
}
export async function encrypt(value:string,scope:string){const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(scope)},await key(),encoder.encode(value));return JSON.stringify({iv:Array.from(iv),data:Array.from(new Uint8Array(ciphertext))});}
export async function credential(db:any,owner:string,provider:string):Promise<string|null>{const {data,error}=await db.rpc('ao_secret_get',{p_owner:owner,p_provider:provider});if(error)throw new Error('CREDENTIAL_STORE');if(!data)return provider==='openai'?Deno.env.get('OPENAI_API_KEY')||null:null;const blob=JSON.parse(data);const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(blob.iv),additionalData:encoder.encode(`${owner}:${provider}`)},await key(),new Uint8Array(blob.data));return new TextDecoder().decode(plain);}
