// ===== VEYRA – Sequenz-Registry (gemeinsame Basis, siehe AGENTS.md) =====
const SEQ={};
async function playSeq(name,opts){const f=SEQ[name];if(typeof f!=='function')return{skipped:true};try{return await f(opts||{});}catch(e){console.error('Sequenz',name,e);return{error:true};}}
