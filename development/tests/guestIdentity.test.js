import test from "node:test";
import assert from "node:assert/strict";
import {GUEST_IDENTITY_STORAGE_KEY,createGuestIdentity,loadGuestIdentity,saveGuestIdentity,saveGuestCompanion,clearGuestIdentity} from "../../alive/identity/guestIdentity.js";
function memoryStorage(){const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};}
test("guest identity starts without an account or companion",()=>{const identity=createGuestIdentity({id:"guest-test",now:()=>"2026-11-27T00:00:00.000Z"});assert.equal(identity.guestId,"guest-test");assert.equal(identity.companion,null);});
test("guest companion saves and restores locally without an account",()=>{const storage=memoryStorage();const saved=saveGuestCompanion({displayName:"Nova",characterForm:"stylized",appearanceProfile:{hairColor:"silver"},personality:{traits:["curious","playful"]}},{storage,now:()=>"2026-11-27T00:00:00.000Z"});const restored=loadGuestIdentity(storage);assert.equal(restored.guestId,saved.guestId);assert.equal(restored.companion.displayName,"Nova");assert.equal(restored.companion.appearanceProfile.hairColor,"silver");assert.equal(restored.companion.personality.traits.length,2);});
test("guest storage rejects invalid identities and invalid companion names",()=>{const storage=memoryStorage();assert.throws(()=>saveGuestIdentity({schema:"wrong",schemaVersion:1,guestId:"x"},storage));assert.throws(()=>saveGuestCompanion({displayName:" "},{storage}));});
test("guest identity can be cleared from the device",()=>{const storage=memoryStorage();saveGuestIdentity(createGuestIdentity({id:"guest-clear"}),storage);clearGuestIdentity(storage);assert.equal(storage.getItem(GUEST_IDENTITY_STORAGE_KEY),null);});

test("restored guest records are normalized and unknown fields are discarded",()=>{
 const storage=memoryStorage();
 storage.setItem(GUEST_IDENTITY_STORAGE_KEY,JSON.stringify({
  schema:"alive-guest-identity",schemaVersion:1,guestId:" guest-safe ",
  createdAt:"2026-11-28T00:00:00.000Z",updatedAt:"2026-11-28T00:01:00.000Z",
  companion:{displayName:"  Nova  ",characterForm:"unknown",appearanceProfile:{hairColor:"silver",extra:"ignored"},unexpected:"ignored"},
  admin:true
 }));
 const restored=loadGuestIdentity(storage);
 assert.equal(restored.guestId,"guest-safe");
 assert.equal(restored.companion.displayName,"Nova");
 assert.equal(restored.companion.characterForm,"digital-human");
 assert.equal(restored.companion.appearanceProfile.hairColor,"silver");
 assert.equal("extra" in restored.companion.appearanceProfile,false);
 assert.equal("admin" in restored,false);
});
test("malformed or unsupported guest records are ignored without rewriting stored data",()=>{
 const storage=memoryStorage();
 const malformed=JSON.stringify({schema:"alive-guest-identity",schemaVersion:1,guestId:"guest-bad",createdAt:"now",updatedAt:"now",companion:{displayName:""}});
 storage.setItem(GUEST_IDENTITY_STORAGE_KEY,malformed);
 assert.equal(loadGuestIdentity(storage),null);
 assert.equal(storage.getItem(GUEST_IDENTITY_STORAGE_KEY),malformed);
 storage.setItem(GUEST_IDENTITY_STORAGE_KEY,JSON.stringify({schema:"alive-guest-identity",schemaVersion:99,guestId:"guest-old"}));
 assert.equal(loadGuestIdentity(storage),null);
});
test("saving rejects malformed identity timestamps and malformed Companion data",()=>{
 const storage=memoryStorage();
 assert.throws(()=>saveGuestIdentity({schema:"alive-guest-identity",schemaVersion:1,guestId:"guest-x",createdAt:"",updatedAt:"",companion:null},storage));
 assert.throws(()=>saveGuestIdentity({schema:"alive-guest-identity",schemaVersion:1,guestId:"guest-x",createdAt:"now",updatedAt:"now",companion:{displayName:""}},storage));
});
