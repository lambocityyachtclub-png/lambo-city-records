export const GUEST_IDENTITY_STORAGE_KEY = "alive.guest.identity.v1";
const TRAITS = new Set(["curious","creative","thoughtful","playful","calm","confident","supportive","adventurous","witty","focused"]);
const ENUMS = Object.freeze({skinTone:["porcelain","light","medium","tan","deep"],hairStyle:["short","curly","long","braids","buzz","none"],hairColor:["black","brown","blonde","auburn","silver"],eyeColor:["brown","blue","green","hazel","gray"],outfit:["streetwear","classic","minimal","creative"],accentColor:["gold","blue","violet","silver"]});
const safeText=(value,max)=>typeof value==="string"?value.trim().slice(0,max):"";
function storageOrThrow(storage){if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function")throw new TypeError("Browser storage is unavailable.");return storage;}
export function normalizeGuestCompanion(value){
 if(!value||typeof value!=="object"||Array.isArray(value))throw new TypeError("Companion details are required.");
 const displayName=safeText(value.displayName,40);if(displayName.length<2)throw new TypeError("Give your Companion a name of at least two characters.");
 const characterForm=["digital-human","stylized"].includes(value.characterForm)?value.characterForm:"digital-human";
 const source=value.appearanceProfile&&typeof value.appearanceProfile==="object"&&!Array.isArray(value.appearanceProfile)?value.appearanceProfile:{};
 const appearanceProfile={};for(const [key,allowed] of Object.entries(ENUMS))appearanceProfile[key]=allowed.includes(source[key])?source[key]:allowed[0];
 const personality=value.personality&&typeof value.personality==="object"&&!Array.isArray(value.personality)?value.personality:{};
 const traits=Array.isArray(personality.traits)?[...new Set(personality.traits.filter(item=>typeof item==="string"&&TRAITS.has(item)))].slice(0,5):[];
 return Object.freeze({displayName,characterForm,appearanceProfile:Object.freeze(appearanceProfile),personality:Object.freeze({summary:safeText(personality.summary,240),traits:Object.freeze(traits)})});
}
export function createGuestIdentity({id,now=()=>new Date().toISOString()}={}){
 const guestId=safeText(id,128)||(globalThis.crypto?.randomUUID?.()||"guest-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,12));
 const timestamp=now();return Object.freeze({schema:"alive-guest-identity",schemaVersion:1,guestId,createdAt:timestamp,updatedAt:timestamp,companion:null});
}
function normalizeGuestIdentity(record){
 if(!record||typeof record!=="object"||Array.isArray(record)||record.schema!=="alive-guest-identity"||record.schemaVersion!==1)return null;
 const guestId=safeText(record.guestId,128);
 const createdAt=safeText(record.createdAt,64);
 const updatedAt=safeText(record.updatedAt,64);
 if(!guestId||!createdAt||!updatedAt)return null;
 let companion=null;
 if(record.companion!==null&&record.companion!==undefined){
  try{companion=normalizeGuestCompanion(record.companion);}catch{return null;}
 }
 return {schema:"alive-guest-identity",schemaVersion:1,guestId,createdAt,updatedAt,companion};
}
export function loadGuestIdentity(storage=globalThis.localStorage){
 try{const raw=storageOrThrow(storage).getItem(GUEST_IDENTITY_STORAGE_KEY);if(!raw)return null;return normalizeGuestIdentity(JSON.parse(raw));}catch{return null;}
}
export function saveGuestIdentity(identity,storage=globalThis.localStorage){
 const normalized=normalizeGuestIdentity(identity);
 if(!normalized)throw new TypeError("A valid guest identity is required.");
 const serialized=JSON.stringify(normalized);if(serialized.length>16000)throw new TypeError("Guest identity is larger than the local storage limit.");
 storageOrThrow(storage).setItem(GUEST_IDENTITY_STORAGE_KEY,serialized);return normalized;
}
export function saveGuestCompanion(companion,{storage=globalThis.localStorage,now=()=>new Date().toISOString()}={}){
 const current=loadGuestIdentity(storage)||createGuestIdentity({now});const normalized=normalizeGuestCompanion(companion);const next={...current,companion:normalized,updatedAt:now()};saveGuestIdentity(next,storage);return next;
}
export function clearGuestIdentity(storage=globalThis.localStorage){if(storage&&typeof storage.removeItem==="function")storage.removeItem(GUEST_IDENTITY_STORAGE_KEY);}
