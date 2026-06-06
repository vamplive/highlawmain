import{r as o,h as N,j as r}from"./vendor-react-B153i_ke.js";import{d as u}from"./index-DqwIl7Nw.js";import{B as f}from"./Button-DjBJJBlv.js";import{I as S}from"./Input-CYqK8D1Y.js";import{T as $}from"./Textarea-CiAzGmiP.js";const k=`합의서

아래 당사자들은 분쟁을 원만히 해결하기 위하여 다음과 같이 합의한다.

제1조 (합의의 대상)
본 합의의 대상은 [사건 내용]이며, 본 합의로써 관련 청구가 종결됨을 확인한다.

제2조 (합의금)
합의금은 [금액]원으로 하며, 지급 방법과 기일은 [내용]으로 한다.

제3조 (비밀유지)
본 합의의 내용은 법령에 의한 경우를 제외하고 외부에 공개하지 않는다.

제4조 (부제소)
당사자들은 본 합의 대상에 대해 향후 어떠한 민·형사상 청구나 고소·고발도 하지 않는다.


갑 (의뢰인): {{sign:의뢰인}}

을 (상대방): {{sign:상대방}}

대리인(법무법인 하이로): {{sign:변호사}}
`;function R(){const[i,t]=o.useState("합의서"),[e,a]=o.useState(k),[n,c]=o.useState([]),[s,y]=o.useState(!1),[b,p]=o.useState(null),x=N();o.useEffect(()=>{u.get("/contract-templates").then(l=>{const d=(l.data||[]).filter(m=>m.category==="settlement");c(d)}).catch(()=>{})},[]);async function j(l){const d=await u.get(`/contract-templates/${l.id}`);t(l.title);try{const m=JSON.parse(d.data.content_json);a(I(m))}catch{}}async function v(){if(!i.trim()){p("제목이 필요합니다");return}if(!e.trim()){p("본문이 필요합니다");return}y(!0),p(null);try{const l=E(e),d=T(e),g=(await u.post("/contracts",{type:"settlement",title:i,contentJson:l,contentHtml:d})).data.contract.id,w=Array.from(new Set(C(e)));for(const B of w)await u.patch(`/contracts/${g}`,{});await _(g,e),x(`/admin/contracts/${g}`)}catch(l){p(l.message)}finally{y(!1)}}return r.jsxs("div",{className:"p-6 space-y-4",children:[r.jsxs("div",{className:"flex items-center justify-between",children:[r.jsxs("div",{children:[r.jsx("h1",{className:"text-xl font-semibold text-gray-900",children:"새 합의서 작성"}),r.jsxs("p",{className:"text-sm text-gray-500",children:["본문에 ","{{sign:의뢰인}}",", ","{{sign:상대방}}","처럼 서명 위치를 지정하세요."]})]}),r.jsx(f,{variant:"outline",onClick:()=>x("/admin/contracts"),children:"취소"})]}),n.length>0&&r.jsxs("div",{className:"rounded-lg border border-amber-200 bg-amber-50 p-3",children:[r.jsx("p",{className:"mb-2 text-xs font-medium text-amber-900",children:"기존 양식에서 시작"}),r.jsx("div",{className:"flex flex-wrap gap-2",children:n.map(l=>r.jsx("button",{onClick:()=>j(l),className:"rounded border border-amber-300 bg-white px-3 py-1 text-xs hover:bg-amber-100",children:l.title},l.id))})]}),r.jsxs("div",{children:[r.jsx("label",{className:"mb-1 block text-xs text-gray-600",children:"제목"}),r.jsx(S,{value:i,onChange:l=>t(l.target.value)})]}),r.jsxs("div",{children:[r.jsx("label",{className:"mb-1 block text-xs text-gray-600",children:"본문"}),r.jsx($,{rows:22,value:e,onChange:l=>a(l.target.value),className:"font-mono text-sm"})]}),b&&r.jsx("div",{className:"rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700",children:b}),r.jsxs("div",{className:"flex justify-end gap-2",children:[r.jsx(f,{variant:"outline",onClick:()=>x("/admin/contracts"),children:"취소"}),r.jsx(f,{onClick:v,disabled:s,children:s?"생성 중...":"생성 → 서명자 등록"})]})]})}function C(i){const t=[],e=/\{\{sign:([^}]+)\}\}/g;let a;for(;a=e.exec(i);)t.push(a[1]);return t}function E(i){return{type:"doc",content:(i||"").split(/\n/).map(e=>{if(!e.trim())return{type:"paragraph"};const a=[],n=/\{\{sign:([^}]+)\}\}/g;let c=0,s;for(;s=n.exec(e);)s.index>c&&a.push({type:"text",text:e.slice(c,s.index)}),a.push({type:"signatureField",attrs:{fieldKey:`sig-${s[1]}-${Math.random().toString(36).slice(2,8)}`,role:h(s[1]),label:s[1],required:!0}}),c=s.index+s[0].length;return c<e.length&&a.push({type:"text",text:e.slice(c)}),{type:"paragraph",content:a}})}}function T(i){const t=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return(i||"").split(/\n/).map(e=>e.trim()?"<p>"+e.replace(/\{\{sign:([^}]+)\}\}/g,(a,n)=>{const c=`sig-${n}-${Math.random().toString(36).slice(2,8)}`;return`<signature-field data-role="${h(n)}" data-label="${t(n)}" data-required="1" data-field-key="${c}">${t(n)}</signature-field>`})+"</p>":"<p></p>").join(`
`)}function h(i){const t=String(i||"").toLowerCase();return t.includes("의뢰")?"our_client":t.includes("변호")?"lawyer":t.includes("대리")?"counterparty_rep":t.includes("상대")?"counterparty":t.includes("증인")?"witness":"counterparty"}function I(i){if(!i)return"";const t=[];return(i.content||[]).forEach(e=>{if(e.type!=="paragraph"){t.push("");return}let a="";(e.content||[]).forEach(n=>{var c,s;n.type==="text"?a+=n.text||"":n.type==="signatureField"&&(a+=`{{sign:${((c=n.attrs)==null?void 0:c.label)||((s=n.attrs)==null?void 0:s.role)||"서명"}}}`)}),t.push(a)}),t.join(`
`)}async function _(i,t){const e=[],a=/\{\{sign:([^}]+)\}\}/g;let n,c=0;for(;n=a.exec(t);)e.push({label:n[1],role:h(n[1]),orderIndex:c++});for(const s of e)await u.post(`/contracts/${i}/signature-fields`,{fieldKey:`sig-${s.label}-${Math.random().toString(36).slice(2,8)}`,role:s.role,label:s.label,required:!0,orderIndex:s.orderIndex}).catch(()=>{})}export{R as default};
