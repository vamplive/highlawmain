const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/InsertTab-CkiJ0UVA.js","assets/vendor-react-B153i_ke.js","assets/constants-CSms8tMu.js","assets/vendor-utils-Cql1boae.js","assets/index-DqwIl7Nw.js","assets/index-CXXSdK1x.css","assets/useMediaQuery-DSCcoVgw.js","assets/blogContent-D1eXZVaP.js","assets/timing-DaTgRtwy.js","assets/vendor-tiptap-hFz_QKwL.js","assets/DrawTab-DPlwKcC2.js","assets/DesignTab-DNU9_YAC.js","assets/LayoutTab-D9BkcLDr.js","assets/ReferencesTab-C6f3GM5V.js","assets/ReviewTab-4zqW7dX1.js","assets/ViewTab-QwMPaVLF.js","assets/FindReplaceBar-Bc9oVuGQ.js","assets/MobileToolSheet-_V85cvL0.js","assets/MobileSidebarDrawer-C97-fz7N.js","assets/MobileSlashMenu-0_O1bE3P.js","assets/MobileVoiceInput-Dhe6Labe.js","assets/MobileImageQuickAdd-Cxx_9LBR.js","assets/MobileOutline-8s2wap2D.js","assets/MobileMetaSheet-C23u3VW3.js","assets/MobileWritingHud-DZwPqRbF.js","assets/MobileSpeedDial-DxBreYeX.js","assets/MobileCommandPalette-CyFcaTGp.js","assets/MobileAiAssistant-CVISj5Ac.js","assets/MobilePublishSheet-DkfQOix1.js","assets/MobileFindReplace-Df5AhVX7.js","assets/MobileVersionHistory-vsNBcidm.js","assets/MobileGoalBar-DfxIhyA-.js","assets/BackstageView-CqwR-eJ2.js","assets/DialogManager-DVXRYO3P.js","assets/MediaPicker-BGpodlQ-.js","assets/jspdf.es.min-Dis_9kLl.js","assets/jszip.min-CxqYyiPY.js","assets/jszip.min-B45yVXQZ.js","assets/index-Dcb--nax.js"])))=>i.map(i=>d[i]);
import{j as t,r as u,f as qi,k as Ki}from"./vendor-react-B153i_ke.js";import{s as Xi,_ as Q,i as Yi,d as fe}from"./index-DqwIl7Nw.js";import{u as Ji}from"./useMediaQuery-DSCcoVgw.js";import{B as xt,D as ur,T as Or,a as Br,b as Hr,F as gt,c as Ze,H as En,d as zn,L as Zi,P as Qi,e as ea,S as ta,E as lo,f as $r,M as Ur}from"./constants-CSms8tMu.js";import{p as Eo,t as oa,a as Oe}from"./blogContent-D1eXZVaP.js";import{r as mt,R as zo,y as In,q as Kt,z as pr,I as Pn,J as Ve,N as Xt,X as et,O as ra,Q as na,V as An,C as Ln,W as Dn,E as Io,Y as _n,Z as fr,_ as yo,$ as gr,a0 as mr,a1 as Rn,a2 as Nn,a3 as ia,a4 as aa,a5 as sa,a6 as yt,a7 as vt,a8 as kt,a9 as hr,aa as Fn,ab as On,ac as br,ad as xr,ae as Yt,af as Po,ag as la,ah as yr,ai as vr,aj as wt,ak as Jt,al as Zt,am as kr,an as da,ao as wr,ap as ca,aq as Bn,ar as Hn,as as vo,at as ua,au as pa,av as fa,aw as ga,ax as ma,ay as jt,az as ha,v as Ao,aA as $n,aB as ba,aC as xa,aD as ya,aE as Ce,aF as va,aG as Un,aH as Wn,aI as ka,aJ as Lo,aK as Gn,aL as wa,aM as ja,F as Sa,j as Ca,G as Ta,aN as Ma,aO as Ea,aP as za,aQ as Vn,aR as qn,aS as Kn,s as Ia,aT as Qe,aU as Xn,aV as Wr,aW as Yn,aX as Pa,aY as Aa,aZ as La,a_ as Da,a$ as _a,b0 as Ra,b1 as Na,b2 as Fa,b3 as Oa,w as Ba,b4 as Ha,b5 as Jn}from"./vendor-utils-Cql1boae.js";import{T as $a,a as Ua,F as Zn,A as Wa}from"./timing-DaTgRtwy.js";import{N as qe,P as jr,a as Sr,m as Cr,E as Do,b as ue,D as Ga,c as Va,M as _o,u as qa,U as Ka,C as Xa,T as Ya,F as Ja,d as Za,e as Qa,f as es,g as ts,S as os,h as rs,i as ns,j as is,k as as,l as ss,H as ls,L as ds,n as cs,o as us,p as ps}from"./vendor-tiptap-hFz_QKwL.js";const Gr=["#E53935","#1E88E5","#43A047","#8E24AA","#FB8C00","#00ACC1","#D81B60","#6D4C41"];let Vr=0;function fs(){const e=Gr[Vr%Gr.length];return Vr++,e}const Qn="comment_author",ko="comment_data";function ei(){return"cmt_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7)}function gs(){try{const e=localStorage.getItem(Qn);if(e)return JSON.parse(e)}catch{}return null}function ms(e){localStorage.setItem(Qn,JSON.stringify(e))}function hs(e,o){return{id:"author_"+Date.now().toString(36),name:e,initials:o||e.charAt(0),color:fs()}}function ti(e,o,r=null){const i=new Date;return{id:ei(),author:e,createdAt:i.toISOString(),modifiedAt:i.toISOString(),content:o,parentId:r,replies:[],resolved:!1,resolvedBy:null,resolvedAt:null}}function bs(){return{comments:{},activeCommentId:null,markupMode:"all",showCommentsPanel:!0,showReviewingPane:null}}function xs(e,o){switch(o.type){case"ADD_COMMENT":{const{comment:r}=o;return{...e,comments:{...e.comments,[r.id]:r},activeCommentId:r.id,showCommentsPanel:!0,markupMode:e.markupMode==="none"||e.markupMode==="original"?"all":e.markupMode}}case"ADD_REPLY":{const{parentId:r,reply:i}=o,n=e.comments[r];return n?{...e,comments:{...e.comments,[r]:{...n,replies:[...n.replies,i]}}}:e}case"EDIT_COMMENT":{const{id:r,content:i}=o,n=e.comments[r];return n?{...e,comments:{...e.comments,[r]:{...n,content:i,modifiedAt:new Date().toISOString()}}}:e}case"EDIT_REPLY":{const{parentId:r,replyIndex:i,content:n}=o,a=e.comments[r];if(!a)return e;const s=[...a.replies];return s[i]={...s[i],content:n,modifiedAt:new Date().toISOString()},{...e,comments:{...e.comments,[r]:{...a,replies:s}}}}case"DELETE_COMMENT":{const{id:r}=o,i={...e.comments};return delete i[r],{...e,comments:i,activeCommentId:e.activeCommentId===r?null:e.activeCommentId}}case"DELETE_REPLY":{const{parentId:r,replyIndex:i}=o,n=e.comments[r];if(!n)return e;const a=n.replies.filter((s,l)=>l!==i);return{...e,comments:{...e.comments,[r]:{...n,replies:a}}}}case"DELETE_ALL":return{...e,comments:{},activeCommentId:null};case"RESOLVE_COMMENT":{const{id:r,author:i}=o,n=e.comments[r];return n?{...e,comments:{...e.comments,[r]:{...n,resolved:!0,resolvedBy:i,resolvedAt:new Date().toISOString()}}}:e}case"REOPEN_COMMENT":{const{id:r}=o,i=e.comments[r];return i?{...e,comments:{...e.comments,[r]:{...i,resolved:!1,resolvedBy:null,resolvedAt:null}}}:e}case"RESOLVE_ALL":{const{author:r}=o,i=new Date().toISOString(),n={};for(const[a,s]of Object.entries(e.comments))n[a]={...s,resolved:!0,resolvedBy:r,resolvedAt:i};return{...e,comments:n}}case"SET_ACTIVE":return{...e,activeCommentId:o.id};case"SET_MARKUP_MODE":return{...e,markupMode:o.mode};case"SET_PANEL_VISIBLE":return{...e,showCommentsPanel:o.visible};case"SET_REVIEWING_PANE":return{...e,showReviewingPane:o.mode};case"LOAD_COMMENTS":return{...e,comments:o.comments||{}};default:return e}}function oi(e){return Object.values(e.comments).filter(o=>!o.parentId).sort((o,r)=>new Date(o.createdAt)-new Date(r.createdAt))}function ht(e){if(!e)return[];const o=[],{doc:r}=e.state;return r.descendants((i,n)=>{i.isText&&i.marks.forEach(a=>{if(a.type.name==="comment"){const s=o.find(l=>l.commentId===a.attrs.commentId);s?(s.from=Math.min(s.from,n),s.to=Math.max(s.to,n+i.nodeSize)):o.push({commentId:a.attrs.commentId,from:n,to:n+i.nodeSize})}})}),o.sort((i,n)=>i.from-n.from)}function ys(e,o){const r=ht(e);return r.length?r.find(n=>n.from>o)||r[0]:null}function vs(e,o){const r=ht(e);if(!r.length)return null;const i=[...r].reverse();return i.find(a=>a.from<o)||i[0]}function ks(e,o){try{const r=e?`${ko}_${e}`:ko;localStorage.setItem(r,JSON.stringify(o))}catch{}}function ws(e){try{const o=e?`${ko}_${e}`:ko,r=localStorage.getItem(o);if(r)return JSON.parse(r)}catch{}return null}function Tr(e){if(!e)return"";const o=new Date(e),r=new Date,i=o.getMonth()+1,n=o.getDate(),a=o.getHours(),s=String(o.getMinutes()).padStart(2,"0");return o.toDateString()===r.toDateString()?`오늘 ${a}:${s}`:`${i}월 ${n}일 ${a}:${s}`}function wo({author:e,size:o=28}){return t.jsx("div",{className:"comment-author-avatar",style:{width:o,height:o,backgroundColor:e.color,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:o*.43,fontWeight:600,flexShrink:0,letterSpacing:-.5},children:e.initials})}function ri({items:e,onClose:o}){const r=u.useRef(null);return u.useEffect(()=>{const i=n=>{r.current&&!r.current.contains(n.target)&&o()};return document.addEventListener("mousedown",i),()=>document.removeEventListener("mousedown",i)},[o]),t.jsx("div",{ref:r,className:"comment-more-menu",children:e.map((i,n)=>i.divider?t.jsx("div",{className:"comment-more-divider"},n):t.jsxs("button",{type:"button",onMouseDown:a=>{var s;a.preventDefault(),a.stopPropagation(),(s=i.onClick)==null||s.call(i),o()},disabled:i.disabled,className:`comment-more-item${i.danger?" danger":""}${i.disabled?" disabled":""}`,children:[i.icon&&t.jsx("span",{className:"comment-more-icon",children:i.icon}),t.jsx("span",{children:i.label})]},n))})}function js({reply:e,index:o,isOwn:r,onEdit:i,onDelete:n}){const[a,s]=u.useState(!1),[l,d]=u.useState(!1),[m,p]=u.useState(e.content),f=()=>{m.trim()&&i(o,m.trim()),d(!1)};return t.jsxs("div",{className:"comment-reply-item",children:[t.jsxs("div",{className:"comment-reply-header",children:[t.jsx(wo,{author:e.author,size:22}),t.jsx("span",{className:"comment-author-name",style:{fontSize:12},children:e.author.name}),t.jsx("span",{className:"comment-timestamp",children:Tr(e.createdAt)}),e.modifiedAt!==e.createdAt&&t.jsx("span",{className:"comment-edited-badge",children:"(편집됨)"}),t.jsx("div",{style:{flex:1}}),r&&t.jsxs("div",{style:{position:"relative"},children:[t.jsx("button",{type:"button",className:"comment-more-btn",onClick:()=>s(!a),children:t.jsx(In,{size:14,color:"#888"})}),a&&t.jsx(ri,{onClose:()=>s(!1),items:[{label:"답글 편집",icon:t.jsx(Pn,{size:12}),onClick:()=>{d(!0),p(e.content)}},{label:"답글 삭제",icon:t.jsx(Ve,{size:12}),onClick:()=>n(o),danger:!0}]})]})]}),l?t.jsxs("div",{style:{marginTop:4,marginLeft:28},children:[t.jsx("textarea",{value:m,onChange:c=>p(c.target.value),className:"comment-edit-textarea",onKeyDown:c=>{c.key==="Escape"&&d(!1),c.key==="Enter"&&!c.shiftKey&&(c.preventDefault(),f())},autoFocus:!0}),t.jsxs("div",{className:"comment-edit-actions",children:[t.jsx("button",{className:"word-dialog-btn primary",style:{padding:"2px 10px",fontSize:11},onClick:f,children:"저장"}),t.jsx("button",{className:"word-dialog-btn",style:{padding:"2px 10px",fontSize:11},onClick:()=>d(!1),children:"취소"})]})]}):t.jsx("div",{className:"comment-content",style:{marginLeft:28},children:e.content})]})}function Ss({comment:e,isActive:o,currentAuthor:r,editor:i,dispatch:n,onActivate:a}){const s=!e.content,[l,d]=u.useState(!1),[m,p]=u.useState(s),[f,c]=u.useState(e.content||""),[g,k]=u.useState(""),[v,y]=u.useState(!1),h=u.useRef(null),x=u.useRef(null),w=r&&e.author.id===r.id;u.useEffect(()=>{s&&m&&x.current&&x.current.focus()},[s,m]);const b=()=>{f.trim()?(n({type:"EDIT_COMMENT",id:e.id,content:f.trim()}),p(!1)):s?(i&&i.commands.unsetComment(e.id),n({type:"DELETE_COMMENT",id:e.id})):p(!1)},I=()=>{if(!g.trim())return;const S=ti(r,g.trim(),e.id);n({type:"ADD_REPLY",parentId:e.id,reply:S}),k(""),y(!1)},P=()=>{n({type:"RESOLVE_COMMENT",id:e.id,author:r})},A=()=>{n({type:"REOPEN_COMMENT",id:e.id})},L=()=>{i&&i.commands.unsetComment(e.id),n({type:"DELETE_COMMENT",id:e.id})};if(e.resolved)return t.jsx("div",{ref:h,className:`comment-balloon resolved${o?" active":""}`,"data-comment-id":e.id,onClick:()=>a(e.id),children:t.jsxs("div",{className:"comment-resolved-header",children:[t.jsx(mt,{size:14,color:"#4CAF50"}),t.jsx(wo,{author:e.author,size:20}),t.jsx("span",{className:"comment-resolved-text",children:e.content}),o&&t.jsxs("button",{type:"button",className:"comment-reopen-btn",onClick:S=>{S.stopPropagation(),A()},children:[t.jsx(zo,{size:11})," 다시 열기"]})]})});const C=[...w?[{label:"메모 편집",icon:t.jsx(Pn,{size:12}),onClick:()=>{p(!0),c(e.content)}}]:[],{label:"스레드 해결",icon:t.jsx(mt,{size:12}),onClick:P},{divider:!0},...w?[{label:"메모 삭제",icon:t.jsx(Ve,{size:12}),onClick:L,danger:!0}]:[],{label:"스레드 삭제",icon:t.jsx(Ve,{size:12}),onClick:L,danger:!0}];return t.jsxs("div",{ref:h,className:`comment-balloon${o?" active":""}`,"data-comment-id":e.id,onClick:()=>a(e.id),style:{"--author-color":e.author.color},children:[t.jsx("div",{className:"comment-color-bar",style:{backgroundColor:o?e.author.color:"transparent"}}),t.jsxs("div",{className:"comment-balloon-header",children:[t.jsx(wo,{author:e.author,size:28}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsx("span",{className:"comment-author-name",children:e.author.name}),t.jsxs("div",{className:"comment-meta-row",children:[t.jsx("span",{className:"comment-timestamp",children:Tr(e.createdAt)}),e.modifiedAt!==e.createdAt&&t.jsx("span",{className:"comment-edited-badge",children:"(편집됨)"})]})]}),t.jsxs("div",{style:{position:"relative"},children:[t.jsx("button",{type:"button",className:"comment-more-btn",onClick:S=>{S.stopPropagation(),d(!l)},children:t.jsx(In,{size:16,color:"#888"})}),l&&t.jsx(ri,{items:C,onClose:()=>d(!1)})]})]}),m?t.jsxs("div",{className:"comment-edit-area",children:[t.jsx("textarea",{ref:x,value:f,onChange:S=>c(S.target.value),placeholder:s?"메모를 입력하세요...":"",className:"comment-edit-textarea",onKeyDown:S=>{S.key==="Escape"&&(s&&!f.trim()?(i&&i.commands.unsetComment(e.id),n({type:"DELETE_COMMENT",id:e.id})):p(!1)),S.key==="Enter"&&!S.shiftKey&&(S.preventDefault(),b())},autoFocus:!0}),t.jsxs("div",{className:"comment-edit-actions",children:[t.jsx("button",{className:"comment-action-btn primary",onClick:b,children:s?"게시":"저장"}),t.jsx("button",{className:"comment-action-btn",onClick:()=>{s&&!f.trim()?(i&&i.commands.unsetComment(e.id),n({type:"DELETE_COMMENT",id:e.id})):p(!1)},children:"취소"})]})]}):t.jsx("div",{className:"comment-content",children:e.content}),e.replies.length>0&&t.jsx("div",{className:"comment-replies",children:e.replies.map((S,R)=>t.jsx(js,{reply:S,index:R,isOwn:r&&S.author.id===r.id,onEdit:(j,M)=>n({type:"EDIT_REPLY",parentId:e.id,replyIndex:j,content:M}),onDelete:j=>n({type:"DELETE_REPLY",parentId:e.id,replyIndex:j})},S.id||R))}),o&&!m&&t.jsx("div",{className:"comment-actions-bar",children:v?t.jsxs("div",{className:"comment-reply-area",children:[t.jsx("textarea",{className:"comment-reply-input",value:g,onChange:S=>k(S.target.value),placeholder:"답글을 입력하세요...",onKeyDown:S=>{S.key==="Enter"&&!S.shiftKey&&(S.preventDefault(),I()),S.key==="Escape"&&(y(!1),k(""))},autoFocus:!0}),t.jsxs("div",{className:"comment-edit-actions",children:[t.jsx("button",{className:"comment-action-btn",onClick:()=>{y(!1),k("")},children:"취소"}),t.jsxs("button",{className:"comment-action-btn primary",onClick:I,disabled:!g.trim(),children:[t.jsx(Kt,{size:11})," 게시"]})]})]}):t.jsxs("div",{className:"comment-bottom-actions",children:[t.jsxs("button",{className:"comment-reply-trigger",onClick:()=>y(!0),children:[t.jsx(pr,{size:12})," 답글..."]}),t.jsxs("button",{className:"comment-resolve-btn",onClick:P,children:[t.jsx(mt,{size:12})," 해결"]})]})})]})}function qr({onSave:e,onCancel:o}){const[r,i]=u.useState(""),[n,a]=u.useState(""),s=u.useRef(null);u.useEffect(()=>{var d;(d=s.current)==null||d.focus()},[]);const l=()=>{r.trim()&&e(r.trim(),n.trim()||r.trim().charAt(0))};return t.jsx("div",{className:"word-dialog-overlay",onClick:o,children:t.jsxs("div",{className:"word-dialog",style:{minWidth:360,maxWidth:420},onClick:d=>d.stopPropagation(),children:[t.jsxs("div",{className:"word-dialog-title",children:[t.jsx("span",{children:"사용자 정보 설정"}),t.jsx("button",{type:"button",onClick:o,style:{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#888"},children:"✕"})]}),t.jsxs("div",{className:"word-dialog-body",style:{padding:"20px 24px"},children:[t.jsxs("div",{style:{marginBottom:16},children:[t.jsx("label",{className:"word-dialog-label",children:"이름(N):"}),t.jsx("input",{ref:s,className:"word-dialog-input",value:r,onChange:d=>i(d.target.value),onKeyDown:d=>{d.key==="Enter"&&l()},placeholder:"예: 조덕재"})]}),t.jsxs("div",{children:[t.jsx("label",{className:"word-dialog-label",children:"이니셜(I):"}),t.jsx("input",{className:"word-dialog-input",value:n,onChange:d=>a(d.target.value),onKeyDown:d=>{d.key==="Enter"&&l()},placeholder:"예: 윤",style:{width:100}})]})]}),t.jsxs("div",{className:"word-dialog-footer",children:[t.jsx("button",{className:"word-dialog-btn primary",onClick:l,children:"확인"}),t.jsx("button",{className:"word-dialog-btn",onClick:o,children:"취소"})]})]})})}function Cs(e,o){let r;return(...i)=>{clearTimeout(r),r=setTimeout(()=>e(...i),o)}}function ni({editor:e,commentStore:o,dispatch:r}){const[i,n]=u.useState([]),a=u.useCallback(()=>{var f;if(!e||e.isDestroyed)return;let s;try{s=(f=e.view)==null?void 0:f.dom}catch{return}if(!s)return;const l=ht(e),d=s.closest(".editor-page-area");if(!d)return;const m=d.getBoundingClientRect(),p=l.map(c=>{try{const g=o.comments[c.commentId];if(!g||g.resolved)return null;const k=e.view.coordsAtPos(c.from);return{commentId:c.commentId,top:k.top-m.top}}catch{return null}}).filter(Boolean);n(p)},[e,o.comments]);return u.useEffect(()=>{if(!e||e.isDestroyed)return;const s=Cs(a,100);e.on("update",s),e.on("selectionUpdate",s);let l=null;const m=setTimeout(()=>{var p;try{const f=(p=e.view)==null?void 0:p.dom;if(!f)return;l=f.closest(".editor-canvas-scroll"),l&&l.addEventListener("scroll",s)}catch{}a()},200);return()=>{clearTimeout(m),e.off("update",s),e.off("selectionUpdate",s),l&&l.removeEventListener("scroll",s)}},[e,a]),o.markupMode!=="simple"?null:t.jsx(t.Fragment,{children:i.map(s=>t.jsx("div",{className:"comment-margin-indicator",style:{top:s.top},onClick:()=>{r({type:"SET_MARKUP_MODE",mode:"all"}),r({type:"SET_ACTIVE",id:s.commentId}),r({type:"SET_PANEL_VISIBLE",visible:!0})},title:"메모 보기",children:t.jsx(Xt,{size:16,color:"#FB8C00"})},s.commentId))})}function Kr({mode:e,commentStore:o,dispatch:r,editor:i,onClose:n}){const a=u.useMemo(()=>oi(o),[o]),s=e==="vertical",l=d=>{if(r({type:"SET_ACTIVE",id:d}),i){const p=ht(i).find(f=>f.commentId===d);if(p){i.commands.setTextSelection({from:p.from,to:p.to});const f=i.view.coordsAtPos(p.from),c=i.view.dom.closest(".editor-canvas-scroll");if(c){const g=c.getBoundingClientRect();c.scrollTop+=f.top-g.top-g.height/3}}}};return t.jsxs("div",{className:`reviewing-pane ${s?"reviewing-pane-vertical":"reviewing-pane-horizontal"}`,children:[t.jsxs("div",{className:"reviewing-pane-header",children:[t.jsxs("div",{children:[t.jsx("span",{className:"reviewing-pane-title",children:"검토 창"}),t.jsxs("span",{className:"reviewing-pane-count",children:["메모: ",a.length,"개"]})]}),t.jsx("button",{type:"button",onClick:n,className:"reviewing-pane-close",children:t.jsx(et,{size:14})})]}),t.jsxs("div",{className:"reviewing-pane-list",children:[a.map(d=>t.jsxs("div",{className:`reviewing-pane-item${o.activeCommentId===d.id?" active":""}`,onClick:()=>l(d.id),children:[t.jsxs("div",{className:"reviewing-pane-item-header",children:[t.jsx(wo,{author:d.author,size:20}),t.jsx("span",{className:"reviewing-pane-item-name",children:d.author.name}),t.jsx("span",{className:"reviewing-pane-item-date",children:Tr(d.createdAt)}),d.resolved&&t.jsx(mt,{size:12,color:"#4CAF50"})]}),t.jsx("div",{className:"reviewing-pane-item-content",children:d.content}),d.replies.length>0&&t.jsxs("div",{className:"reviewing-pane-item-replies",children:[t.jsx(pr,{size:10})," 답글 ",d.replies.length,"개"]})]},d.id)),a.length===0&&t.jsxs("div",{className:"reviewing-pane-empty",children:[t.jsx(Xt,{size:24,color:"#ccc"}),t.jsx("span",{children:"메모가 없습니다."})]})]})]})}function Ts({editor:e,commentStore:o,dispatch:r,currentAuthor:i}){const n=u.useRef(null),[,a]=u.useState([]),s=u.useMemo(()=>oi(o),[o]),l=u.useCallback(()=>{if(!e||!n.current)return;const p=ht(e),f=[],c=n.current.getBoundingClientRect();p.forEach(g=>{try{const k=e.view.coordsAtPos(g.from),v=n.current.querySelector(`[data-comment-id="${g.commentId}"]`);if(!v)return;const y=v.getBoundingClientRect();f.push({commentId:g.commentId,highlightY:k.top-c.top+n.current.scrollTop+8,balloonY:y.top-c.top+n.current.scrollTop+14})}catch{}}),a(f)},[e]);u.useEffect(()=>{if(!e)return;let p;const f=(...g)=>{clearTimeout(p),p=setTimeout(()=>l(...g),80)};e.on("update",f),e.on("selectionUpdate",f);const c=e.view.dom.closest(".editor-canvas-scroll");return c&&c.addEventListener("scroll",f),window.addEventListener("resize",f),setTimeout(l,150),()=>{clearTimeout(p),e.off("update",f),e.off("selectionUpdate",f),c&&c.removeEventListener("scroll",f),window.removeEventListener("resize",f)}},[e,l]),u.useEffect(()=>{if(!e)return;const p=()=>{const{$from:f}=e.state.selection,g=f.marks().find(k=>k.type.name==="comment");g&&r({type:"SET_ACTIVE",id:g.attrs.commentId})};return e.on("selectionUpdate",p),()=>e.off("selectionUpdate",p)},[e,r]);const d=u.useCallback(p=>{if(r({type:"SET_ACTIVE",id:p}),e){const c=ht(e).find(g=>g.commentId===p);if(c){e.commands.setTextSelection({from:c.from,to:c.to});const g=e.view.coordsAtPos(c.from),k=e.view.dom.closest(".editor-canvas-scroll");if(k){const v=k.getBoundingClientRect();(g.top<v.top||g.top>v.bottom)&&(k.scrollTop+=g.top-v.top-v.height/3)}}}},[e,r]),m=u.useMemo(()=>o.markupMode==="none"||o.markupMode==="original"?[]:o.markupMode==="simple"?[]:s,[s,o.markupMode]);return!o.showCommentsPanel||m.length===0?null:t.jsxs("div",{ref:n,className:"comments-panel",children:[t.jsxs("div",{className:"comments-panel-header",children:[t.jsxs("span",{className:"comments-panel-title",children:[t.jsx(Xt,{size:13})," 메모 (",m.length,")"]}),t.jsx("button",{type:"button",className:"comments-panel-close",onClick:()=>r({type:"SET_PANEL_VISIBLE",visible:!1}),children:t.jsx(et,{size:14})})]}),t.jsx("div",{className:"comments-balloon-list",children:m.map(p=>t.jsx(Ss,{comment:p,isActive:o.activeCommentId===p.id,currentAuthor:i,editor:e,dispatch:r,onActivate:d},p.id))})]})}const Ms=`
/* ──── ProseMirror Core ──── */
.ProseMirror {
  outline: none;
  min-height: 200px;
  position: relative;
  font-family: '맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
  font-size: 11pt;
  line-height: 1.75;
  color: #1a1a1a;
  caret-color: #000;
}
.ProseMirror h1 { font-size: 24pt; font-weight: 700; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.ProseMirror h2 { font-size: 18pt; font-weight: 600; margin: 20px 0 10px; }
.ProseMirror h3 { font-size: 14pt; font-weight: 600; margin: 16px 0 8px; }
.ProseMirror h4 { font-size: 12pt; font-weight: 600; margin: 14px 0 6px; }
.ProseMirror p { margin: 6px 0; }
.ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 8px 0; }
.ProseMirror li { margin: 3px 0; }
.ProseMirror blockquote { border-left: 3px solid var(--editor-blue-500); margin: 12px 0; padding: 8px 16px; background: #fafaf6; color: #555; font-style: italic; }
.ProseMirror table { border-collapse: collapse; width: 100%; margin: 12px 0; }
.ProseMirror th, .ProseMirror td { border: 1px solid #ccc; padding: 6px 10px; font-size: 10pt; min-width: 80px; }
.ProseMirror th { background: var(--editor-blue-f1f5f9); font-weight: 600; }
.ProseMirror .selectedCell { background: rgba(59,130,246,0.1); }
.ProseMirror code { background: #f0f0ee; padding: 1px 4px; border-radius: 2px; font-size: 0.9em; font-family: 'Courier New', monospace; }
.ProseMirror pre { background: #2d2d2d; color: #ccc; padding: 12px 16px; border-radius: 4px; font-size: 10pt; overflow-x: auto; margin: 12px 0; }
.ProseMirror pre code { background: none; padding: 0; }
.ProseMirror hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
.ProseMirror a { color: var(--editor-blue-500); text-decoration: underline; }
.ProseMirror img { max-width: 100%; cursor: pointer; }
.ProseMirror img.ProseMirror-selectednode { outline: 2px solid var(--editor-blue-500); }
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #ccc;
  float: left;
  pointer-events: none;
  height: 0;
}
.ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.ProseMirror ul[data-type="taskList"] li { display: flex; align-items: baseline; gap: 6px; }
.ProseMirror ul[data-type="taskList"] li input[type="checkbox"] { margin: 0; cursor: pointer; }
.ProseMirror .tableWrapper { overflow-x: auto; margin: 12px 0; }
.ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: var(--editor-blue-500); cursor: col-resize; z-index: 20; }

/* ──── Selection Highlighting ──── */
.ProseMirror ::selection { background: var(--editor-accent-selection); }
.ProseMirror .ProseMirror-gapcursor { display: none; pointer-events: none; position: relative; }

/* ──── Image resize handles ──── */
.ProseMirror img { cursor: pointer; transition: outline 0.1s; border-radius: 2px; }
.ProseMirror img:hover { outline: 2px solid rgba(59,130,246,0.3); }
.ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid var(--editor-blue-500);
  box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
}

/* ──── ResizableImage NodeView ──── */
.ProseMirror figure.yj-image-nodeview {
  position: relative;
  display: block;
  margin: 12px 0;
  max-width: 100%;
}
.ProseMirror figure.yj-image-nodeview img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 2px;
  user-select: none;
}
.ProseMirror figure.yj-image-nodeview.is-selected {
  outline: 2px solid var(--editor-blue-500);
  outline-offset: 2px;
}
.ProseMirror figure.yj-image-nodeview.is-resizing {
  outline: 2px dashed var(--editor-blue-500);
  outline-offset: 2px;
  user-select: none;
}

/* 정렬 (편집 시 미리보기) */
.ProseMirror figure.yj-image-left { float: left; margin: 6px 16px 6px 0; max-width: 60%; }
.ProseMirror figure.yj-image-right { float: right; margin: 6px 0 6px 16px; max-width: 60%; }
.ProseMirror figure.yj-image-center { margin-left: auto; margin-right: auto; text-align: center; }
.ProseMirror figure.yj-image-full { width: 100% !important; }
.ProseMirror figure.yj-image-full img { width: 100%; }
.ProseMirror figure.yj-image-rounded img { border-radius: 14px; }
.ProseMirror figure.yj-image-bordered img { border: 2px solid #d6c8a4; padding: 4px; background: #fff; }

/* 코너 리사이즈 핸들 — 선택 상태에서만 보임 */
.ProseMirror figure.yj-image-nodeview .yj-image-handle {
  position: absolute;
  width: 12px; height: 12px;
  background: #fff;
  border: 2px solid var(--editor-blue-500);
  border-radius: 2px;
  z-index: 10;
  display: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.ProseMirror figure.yj-image-nodeview.is-selected .yj-image-handle,
.ProseMirror figure.yj-image-nodeview.is-resizing .yj-image-handle {
  display: block;
}
.ProseMirror figure.yj-image-nodeview .yj-image-handle-nw { top: -7px; left: -7px; cursor: nwse-resize; }
.ProseMirror figure.yj-image-nodeview .yj-image-handle-ne { top: -7px; right: -7px; cursor: nesw-resize; }
.ProseMirror figure.yj-image-nodeview .yj-image-handle-sw { bottom: -7px; left: -7px; cursor: nesw-resize; }
.ProseMirror figure.yj-image-nodeview .yj-image-handle-se { bottom: -7px; right: -7px; cursor: nwse-resize; }

/* 캡션 (편집 가능) */
.ProseMirror figure.yj-image-nodeview figcaption {
  margin-top: 8px;
  font-size: 0.88em;
  color: #6b7280;
  text-align: center;
  outline: none;
  min-height: 1em;
  padding: 2px 4px;
  border-radius: 2px;
}
.ProseMirror figure.yj-image-nodeview figcaption:empty::before {
  content: attr(data-placeholder);
  color: #c8c8c8;
  font-style: italic;
}
.ProseMirror figure.yj-image-nodeview.is-caption-editing figcaption {
  background: rgba(59,130,246,0.06);
  outline: 1px dashed var(--editor-blue-500);
}

/* float 해제 — 다음 블록이 이미지 옆으로 흘러내리지 않도록 */
.ProseMirror h1, .ProseMirror h2, .ProseMirror h3,
.ProseMirror blockquote, .ProseMirror hr,
.ProseMirror table { clear: both; }

/* ──── 향상된 테이블 스타일 ──── */
.ProseMirror table.resize-cursor {
  cursor: col-resize;
}
.ProseMirror .selectedCell::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(59, 130, 246, 0.08);
  pointer-events: none;
  z-index: 2;
}

/* ══════════════════════════════════════════════════
   Footnote / Endnote System (MS Word 스타일)
   ══════════════════════════════════════════════════ */

/* 본문 내 각주 참조 (위첨자) */
.ProseMirror .footnote-ref {
  color: var(--editor-link);
  cursor: pointer;
  font-size: 0.75em;
  vertical-align: super;
  font-weight: 600;
  padding: 0 1px;
  transition: background 0.15s, color 0.15s;
  border-radius: 2px;
  text-decoration: none;
}
.ProseMirror .footnote-ref:hover,
.ProseMirror .footnote-ref.footnote-ref-hover {
  background: var(--editor-link-bg-hover);
  color: var(--editor-link-hover);
}
@keyframes footnoteFlash {
  0%, 100% { background: transparent; }
  25%, 75% { background: #fef3c7; }
}
.ProseMirror .footnote-ref.footnote-ref-flash {
  animation: footnoteFlash 1.5s ease;
}

/* 각주 툴팁 */
.footnote-tooltip {
  position: fixed;
  z-index: 9999;
  background: #1f2937;
  color: #f3f4f6;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  max-width: 320px;
  line-height: 1.5;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}

/* 페이지 하단 각주 영역 */
.footnote-area {
  position: relative;
  margin-top: 20px;
  padding-top: 8px;
}
.paged-footnote-area {
  position: static;
  margin: 0;
  padding: 0;
}
.footnote-separator {
  width: 33%;
  height: 0;
  border-top: 1px solid #999;
  margin-bottom: 8px;
}
.footnote-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.footnote-area-label,
.footnote-page-label {
  font-size: 9px;
  color: #777;
  margin: 2px 0 3px;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}
.footnote-page-group + .footnote-page-group {
  margin-top: 8px;
}
.paged-footnote-area .footnote-page-group {
  background: inherit;
  z-index: 3;
}
.paged-footnote-area .footnote-page-group + .footnote-page-group {
  margin-top: 0;
}
.blog-editor-footnote-area {
  margin-top: 28px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}
.footnote-item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 2px 0;
  font-size: 9pt;
  line-height: 1.4;
  position: relative;
  transition: background 0.3s;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}
@keyframes footnoteItemFlash {
  0%, 100% { background: transparent; }
  20%, 80% { background: #fff3cd; }
}
.footnote-item.footnote-item-flash {
  animation: footnoteItemFlash 2s ease;
}
.footnote-item:hover {
  background: #f8fafc;
}
.footnote-item-editing {
  background: #fffef5 !important;
}
.footnote-item-number {
  color: var(--editor-link);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8em;
  vertical-align: super;
  min-width: 18px;
  flex-shrink: 0;
  user-select: none;
  text-align: right;
  padding-right: 2px;
  line-height: 1.2;
}
.footnote-item-number:hover {
  text-decoration: underline;
  color: var(--editor-link-hover);
}
.footnote-item-content {
  flex: 1;
  color: #333;
  min-height: 16px;
}
.footnote-item-text {
  cursor: text;
  display: inline-block;
  min-height: 14px;
  min-width: 40px;
  white-space: pre-wrap;
}
.footnote-item-text:hover {
  background: #f0f7ff;
  border-radius: 2px;
}
.footnote-edit-input {
  width: 100%;
  min-height: 42px;
  resize: vertical;
  border: none;
  border-bottom: 1.5px solid var(--editor-link);
  outline: none;
  font-size: 9pt;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
  padding: 1px 2px;
  background: transparent;
  color: #333;
  line-height: 1.4;
}
.footnote-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #ccc;
  font-size: 10px;
  padding: 0 3px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  line-height: 1;
  margin-top: 1px;
}
.footnote-item:hover .footnote-delete-btn {
  opacity: 0.5;
}
.footnote-delete-btn:hover {
  opacity: 1 !important;
  color: var(--editor-track-delete) !important;
}

/* 미주 영역 */
.endnote-area {
  margin-top: 32px;
  padding-top: 8px;
}
.endnote-separator {
  width: 100%;
  height: 0;
  border-top: 2px solid #999;
  margin-bottom: 8px;
}
.endnote-header {
  font-size: 11pt;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}
.endnote-number {
  color: var(--editor-endnote-purple);
}

/* ══════════════════════════════════════════════════
   변경 내용 추적 (Track Changes) — 인라인 텍스트
   ══════════════════════════════════════════════════ */

/* 삽입된 텍스트 */
.ProseMirror span.track-insert {
  color: var(--editor-track-insert);
  text-decoration: underline;
  text-decoration-color: var(--editor-track-insert);
  text-decoration-style: solid;
  background: rgba(22, 163, 74, 0.06);
  border-bottom: none;
  position: relative;
  cursor: pointer;
}
.ProseMirror span.track-insert:hover {
  background: rgba(22, 163, 74, 0.12);
}
.ProseMirror span.track-insert::after {
  content: attr(data-author);
  position: absolute;
  bottom: calc(100% + 2px);
  left: 0;
  background: var(--editor-track-insert);
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 9px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
  z-index: 50;
}
.ProseMirror span.track-insert:hover::after {
  opacity: 1;
}

/* 삭제된 텍스트 */
.ProseMirror span.track-delete {
  color: var(--editor-track-delete);
  text-decoration: line-through;
  text-decoration-color: var(--editor-track-delete);
  background: rgba(220, 38, 38, 0.06);
  opacity: 0.7;
  cursor: pointer;
}
.ProseMirror span.track-delete:hover {
  background: rgba(220, 38, 38, 0.12);
  opacity: 1;
}

/* 서식 변경 */
.ProseMirror span.track-format {
  text-decoration: underline;
  text-decoration-color: var(--editor-blue-600);
  text-decoration-style: double;
  cursor: pointer;
}
.ProseMirror span.track-format:hover {
  background: rgba(37, 99, 235, 0.08);
}

/* ══════════════════════════════════════════════════
   페이지 번호 / 날짜 필드 노드
   ══════════════════════════════════════════════════ */
.ProseMirror .page-number-field,
.ProseMirror .date-field {
  background: var(--editor-accent-row-bg);
  padding: 1px 4px;
  border-radius: 2px;
  font-size: inherit;
  color: #444;
  cursor: default;
  user-select: none;
  display: inline;
}
.ProseMirror .page-number-field:hover,
.ProseMirror .date-field:hover {
  background: var(--editor-accent-row-bg-hover);
}

/* 책갈피 표시 */
.ProseMirror span.bookmark-anchor {
  display: inline;
  width: 0;
  height: 0;
  position: relative;
}
.ProseMirror span.bookmark-anchor::before {
  content: "⚑";
  font-size: 10px;
  color: #888;
  position: relative;
  top: -2px;
}

/* ══════════════════════════════════════════════════
   Bookmark Anchor
   ══════════════════════════════════════════════════ */

.ProseMirror .bookmark-anchor {
  display: inline;
  position: relative;
  border-left: 2px solid var(--editor-bookmark);
  margin: 0 1px;
}
.ProseMirror .bookmark-anchor::before {
  content: "⚑";
  font-size: 8px;
  color: var(--editor-bookmark);
  position: absolute;
  top: -8px;
  left: -4px;
}

/* ══════════════════════════════════════════════════
   Drop Cap (첫 글자 장식)
   ══════════════════════════════════════════════════ */

.ProseMirror p[data-drop-cap="dropped"]::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  padding: 4px 8px 0 0;
  font-weight: 700;
  color: var(--editor-deep-navy);
}
.ProseMirror p[data-drop-cap="in-margin"]::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  padding: 4px 8px 0 0;
  margin-left: -40px;
  font-weight: 700;
  color: var(--editor-deep-navy);
}

/* ══════════════════════════════════════════════════
   Track Changes — 블록 레벨 스타일 + 말풍선
   ══════════════════════════════════════════════════ */

.ProseMirror .track-insert {
  background-color: rgba(34, 197, 94, 0.15);
  border-bottom: 2px solid var(--editor-track-insert-strong);
  text-decoration: none;
}
.ProseMirror .track-delete {
  background-color: rgba(239, 68, 68, 0.15);
  text-decoration: line-through;
  color: var(--editor-track-delete-strong);
}
.ProseMirror .track-format {
  background-color: rgba(59, 130, 246, 0.1);
  border-bottom: 2px dotted var(--editor-blue-500);
}
.track-change-balloon {
  position: absolute;
  right: -240px;
  width: 220px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 11px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.track-change-balloon.insert { border-left: 3px solid var(--editor-track-insert-strong); }
.track-change-balloon.delete { border-left: 3px solid var(--editor-track-delete-strong); }
.track-change-balloon.format { border-left: 3px solid var(--editor-blue-500); }

/* ══════════════════════════════════════════════════
   단락 테두리/음영 (Paragraph Borders / Shading)
   ══════════════════════════════════════════════════ */

.ProseMirror p[data-border], .ProseMirror p[data-shading] {
  padding: 8px 12px;
  margin: 6px 0;
  border-radius: 2px;
}

/* ══════════════════════════════════════════════════
   표 스타일 변형 (Table Style Variants)
   ══════════════════════════════════════════════════ */

.ProseMirror table.table-style-elegant th { background: var(--editor-deep-navy); color: #fff; }
.ProseMirror table.table-style-elegant tr:nth-child(even) td { background: #f8fafc; }
.ProseMirror table.table-style-grid-blue th { background: var(--editor-blue-600); color: #fff; }
.ProseMirror table.table-style-grid-blue td { border-color: var(--editor-blue-93c5fd); }
.ProseMirror table.table-style-grid-blue tr:nth-child(even) td { background: var(--editor-blue-eff6ff); }

/* ══════════════════════════════════════════════════
   Dark Mode — 타이포그래피
   ══════════════════════════════════════════════════ */
.word-editor-root.dark-mode .ProseMirror {
  color: #e0e0e0;
  caret-color: #fff;
}
.word-editor-root.dark-mode .ProseMirror h1,
.word-editor-root.dark-mode .ProseMirror h2,
.word-editor-root.dark-mode .ProseMirror h3,
.word-editor-root.dark-mode .ProseMirror h4 { color: #f0f0f0; }
.word-editor-root.dark-mode .ProseMirror a { color: var(--editor-dark-link); }
.word-editor-root.dark-mode .ProseMirror blockquote { background: #333; border-left-color: var(--editor-dark-accent); color: #ccc; }
.word-editor-root.dark-mode .ProseMirror th { background: #383838; }
.word-editor-root.dark-mode .ProseMirror td, .word-editor-root.dark-mode .ProseMirror th { border-color: #555; }
.word-editor-root.dark-mode .ProseMirror code { background: #383838; }
.word-editor-root.dark-mode .ProseMirror hr { border-top-color: #555; }
.word-editor-root.dark-mode .ProseMirror ::selection { background: #3a5280; }

/* 다크 모드 Track Changes — 인라인 */
.word-editor-root.dark-mode .ProseMirror span.track-insert {
  color: var(--editor-track-insert-dark);
  text-decoration-color: var(--editor-track-insert-dark);
  background: rgba(74, 222, 128, 0.08);
}
.word-editor-root.dark-mode .ProseMirror span.track-delete {
  color: var(--editor-track-delete-dark);
  text-decoration-color: var(--editor-track-delete-dark);
  background: rgba(248, 113, 113, 0.08);
}
.word-editor-root.dark-mode .ProseMirror span.track-format {
  text-decoration-color: var(--editor-track-format-dark);
}

/* 각주 다크 모드 */
.word-editor-root.dark-mode .footnote-area { border-color: #555; }
.word-editor-root.dark-mode .footnote-separator { border-color: #555; }
.word-editor-root.dark-mode .footnote-item { color: #ccc; }
.word-editor-root.dark-mode .footnote-item:hover { background: #333; }
.word-editor-root.dark-mode .footnote-item-content { color: #ccc; }
.word-editor-root.dark-mode .footnote-edit-input { color: #e0e0e0; border-bottom-color: var(--editor-dark-accent); }
.word-editor-root.dark-mode .endnote-header { color: #ddd; }
.word-editor-root.dark-mode .endnote-separator { border-color: #555; }

/* 북마크 다크모드 */
.word-editor-root.dark-mode .ProseMirror .bookmark-anchor {
  border-left-color: var(--editor-bookmark-dark);
}
.word-editor-root.dark-mode .ProseMirror .bookmark-anchor::before {
  color: var(--editor-bookmark-dark);
}

/* 드롭캡 다크모드 */
.word-editor-root.dark-mode .ProseMirror p[data-drop-cap="dropped"]::first-letter,
.word-editor-root.dark-mode .ProseMirror p[data-drop-cap="in-margin"]::first-letter {
  color: var(--editor-dark-link);
}

/* 다크 모드 Track Changes — 블록 */
.word-editor-root.dark-mode .ProseMirror .track-insert {
  background-color: rgba(34, 197, 94, 0.2);
  border-bottom-color: var(--editor-track-insert-dark);
}
.word-editor-root.dark-mode .ProseMirror .track-delete {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--editor-track-delete-dark);
}
.word-editor-root.dark-mode .ProseMirror .track-format {
  background-color: rgba(59, 130, 246, 0.15);
  border-bottom-color: var(--editor-track-format-dark);
}
.word-editor-root.dark-mode .track-change-balloon {
  background: #333;
  border-color: #555;
  color: #e0e0e0;
}

/* 표 스타일 다크모드 */
.word-editor-root.dark-mode .ProseMirror table.table-style-elegant th { background: var(--editor-deep-navy-dark); }
.word-editor-root.dark-mode .ProseMirror table.table-style-elegant tr:nth-child(even) td { background: #2a2a2a; }
.word-editor-root.dark-mode .ProseMirror table.table-style-grid-blue th { background: var(--editor-link-hover); }
.word-editor-root.dark-mode .ProseMirror table.table-style-grid-blue td { border-color: #3b5998; }
.word-editor-root.dark-mode .ProseMirror table.table-style-grid-blue tr:nth-child(even) td { background: #1e2a3a; }

/* 단락 테두리/음영 다크모드 */
.word-editor-root.dark-mode .ProseMirror p[data-border],
.word-editor-root.dark-mode .ProseMirror p[data-shading] {
  border-color: #555;
}
`,Es=`
/* ──── Backstage View (Word 365) ──── */
.backstage-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 3000;
  display: flex; animation: backstageFadeIn 0.15s ease-out;
}
@keyframes backstageFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
.backstage-sidebar {
  width: 280px; background: var(--editor-accent); color: #fff; display: flex; flex-direction: column;
  padding: 0; flex-shrink: 0;
}
.backstage-content {
  flex: 1; background: #f3f3f3; padding: 40px 60px; overflow-y: auto;
}
.backstage-menu-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 24px;
  border: none; background: transparent; color: rgba(255,255,255,0.9);
  font-size: 13px; cursor: pointer; width: 100%; text-align: left;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif; transition: background 0.1s;
}
.backstage-menu-item:hover { background: rgba(255,255,255,0.12); }
.backstage-menu-item.active { background: rgba(255,255,255,0.18); color: #fff; font-weight: 600; }

/* ──── Pagination (워드 스타일 페이지 전환) ──── */
.editor-page-area { position: relative; }
.editor-page-area .ProseMirror { min-height: auto !important; }
/* 페이지 전환 시 부드러운 margin 애니메이션 */
.editor-page-area .ProseMirror [data-page-gap] {
  box-sizing: border-box;
}
.editor-page-area .ProseMirror .page-break,
.editor-page-area .ProseMirror .section-break[data-section-type="next-page"] {
  display: none;
}
.editor-page-gap {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  user-select: none;
  pointer-events: auto;
  z-index: 2;
}
.editor-page-gap-surface {
  position: relative;
  flex-shrink: 0;
  background: var(--page-gap-page-bg);
}
.editor-page-gap-surface.footer {
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.04);
}
.editor-page-gap-surface.header {
  box-shadow: inset 0 1px 0 rgba(0,0,0,0.04);
}
.editor-page-gap-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--page-gap-canvas-bg);
  color: var(--page-gap-label);
  font-size: 9px;
  font-family: 'Segoe UI', sans-serif;
  letter-spacing: 0.2px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.05);
}
.editor-page-gap-running-text {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 9pt;
  color: #b3b3b3;
  font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.editor-page-gap-running-text.footer-text {
  bottom: 4px;
}
.editor-page-gap-running-text.header-text {
  top: 4px;
}
.editor-page-gap-guide {
  position: absolute;
  display: block;
  pointer-events: none;
}
.editor-page-gap-guide.top,
.editor-page-gap-guide.bottom {
  width: 12px;
  height: 1px;
  background: var(--page-gap-guide);
}
.editor-page-gap-guide.left::after,
.editor-page-gap-guide.right::after {
  content: "";
  position: absolute;
  width: 1px;
  height: 12px;
  background: var(--page-gap-guide);
}
.editor-page-gap-guide.top.left::after,
.editor-page-gap-guide.top.right::after {
  top: 0;
}
.editor-page-gap-guide.bottom.left::after,
.editor-page-gap-guide.bottom.right::after {
  bottom: 0;
}
.editor-page-gap-guide.left::after {
  left: 0;
}
.editor-page-gap-guide.right::after {
  right: 0;
}
/* 스크롤 컨테이너 부드러운 스크롤 */
.editor-canvas-scroll {
  scroll-behavior: auto;
}

/* ──── Drag & Drop ──── */
.ProseMirror.drag-over { outline: 2px dashed var(--editor-blue-500) !important; outline-offset: -4px; }

/* 이미지 드롭 오버레이 — 외부 파일 드래그 시 본문 위에 안내 표시 (.ProseMirror는 typography에서 position:relative) */
.ProseMirror .yj-image-drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(59, 130, 246, 0.08);
  border: 3px dashed var(--editor-blue-500);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
  animation: yjDropFade 0.15s ease-out;
}
.ProseMirror .yj-image-drop-overlay-inner {
  background: #fff;
  color: var(--editor-blue-500);
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  font-family: '맑은 고딕', 'Segoe UI', sans-serif;
}
@keyframes yjDropFade {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

/* 플로팅 툴바 — 이미지 모드 (가독성 + 그림자 강조) */
.floating-toolbar.floating-toolbar-image {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.14);
  padding: 4px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* ──── Dark Mode — 레이아웃 CSS 변수 ──── */
.word-editor-root.dark-mode {
  --ribbon-bg: #2d2d2d;
  --ribbon-fg: #e0e0e0;
  --ribbon-label: #888;
  --ribbon-sep: #444;
  --ribbon-active-bg: #3a3a5c;
  --ribbon-active-border: var(--editor-dark-accent);
  --ribbon-disabled: #555;
  --ribbon-input-bg: #383838;
  --ribbon-input-border: #555;
}

/* ──── Print styles ──── */
@media print {
  /* Hide all UI elements */
  .word-editor-root > *:not(.editor-canvas-scroll):not([class*="editor-page"]) { display: none !important; }
  .word-editor-root { display: block !important; height: auto !important; overflow: visible !important; }

  /* Hide sidebar, ribbon, tabs, status bar, nav pane, meta drawer */
  .word-tab-btn, .word-ribbon-btn, .ribbon-collapse-btn { display: none !important; }
  .floating-toolbar { display: none !important; }
  .page-header-area input, .page-footer-area input { border: none !important; }

  /* Page area */
  .editor-page-area {
    box-shadow: none !important;
    margin: 0 !important;
    width: 100% !important;
    min-height: auto !important;
    page-break-after: always;
  }
  .editor-canvas-scroll {
    background: none !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  /* Handle page breaks */
  .ProseMirror hr { page-break-after: always; border: none !important; }
  .ProseMirror { min-height: auto !important; }

  /* Avoid breaking inside certain elements */
  .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { page-break-after: avoid; }
  .ProseMirror table { page-break-inside: avoid; }
  .ProseMirror img { page-break-inside: avoid; }
  .ProseMirror blockquote { page-break-inside: avoid; }
}

/* ──── Splash / Loading screen (Word 365) ──── */
.editor-splash {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: var(--editor-accent);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 10000; color: #fff;
  animation: splashFadeIn 0.3s ease-out;
}
.editor-splash .logo { font-size: 42px; font-weight: 700; letter-spacing: -2px; margin-bottom: 8px; }
.editor-splash .subtitle { font-size: 14px; opacity: 0.85; letter-spacing: 1px; }
.editor-splash .loading-bar {
  width: 200px; height: 2px; background: rgba(255,255,255,0.2);
  margin-top: 24px; border-radius: 1px; overflow: hidden;
}
.editor-splash .loading-bar::after {
  content: ""; display: block; width: 40%; height: 100%;
  background: rgba(255,255,255,0.8); border-radius: 1px;
  animation: splashLoad 1.2s ease-in-out infinite;
}
@keyframes splashFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes splashLoad {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(150%); }
  100% { transform: translateX(350%); }
}

/* ══════════════════════════════════════════════════
   Page Break / Section Break / Column Break
   ══════════════════════════════════════════════════ */

/* 페이지 나누기 */
.ProseMirror .page-break {
  page-break-after: always;
  break-after: page;
  display: block;
  height: 0;
  border: none;
  border-top: 2px dashed #c0c0c0;
  margin: 24px 0;
  position: relative;
}
.ProseMirror .page-break::after {
  content: "페이지 나누기";
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 0 12px;
  font-size: 9px;
  color: #999;
  letter-spacing: 1px;
}

/* 구역 나누기 */
.ProseMirror .section-break {
  display: block;
  border: none;
  border-top: 2px dashed #a0a0a0;
  margin: 24px 0;
  position: relative;
}
.ProseMirror .section-break::after {
  content: "구역 나누기";
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 0 12px;
  font-size: 9px;
  color: #888;
  letter-spacing: 1px;
}

/* 단 나누기 */
.ProseMirror .column-break {
  break-after: column;
  display: block;
  border-top: 1px dashed #ccc;
  margin: 12px 0;
  position: relative;
}
.ProseMirror .column-break::after {
  content: "단 나누기";
  position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
  background: #fff; padding: 0 8px; font-size: 9px; color: #aaa;
}

/* ══════════════════════════════════════════════════
   그리기 캔버스 오버레이
   ══════════════════════════════════════════════════ */
.drawing-canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  cursor: crosshair;
}
.drawing-canvas-overlay svg {
  width: 100%;
  height: 100%;
}

/* ══════════════════════════════════════════════════
   커스텀 스크롤바 (Word 365 스타일)
   ══════════════════════════════════════════════════ */
.editor-canvas-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
.editor-canvas-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.editor-canvas-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
  border: 3px solid #f1f1f1;
}
.editor-canvas-scroll::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
.word-editor-root.dark-mode .editor-canvas-scroll::-webkit-scrollbar-track {
  background: #2d2d2d;
}
.word-editor-root.dark-mode .editor-canvas-scroll::-webkit-scrollbar-thumb {
  background: #555;
  border-color: #2d2d2d;
}

/* ══════════════════════════════════════════════════
   인쇄 미리보기 오버레이
   ══════════════════════════════════════════════════ */
.print-preview-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #f3f3f3;
  z-index: 5000;
  display: flex;
  flex-direction: column;
}
.print-preview-toolbar {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
}
.print-preview-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  padding: 24px;
  background: #e8e8e8;
}

/* ══════════════════════════════════════════════════
   Header / Footer Editing Area (머리글/바닥글)
   ══════════════════════════════════════════════════ */

.header-footer-edit-area {
  width: 100%;
  min-height: 40px;
  padding: 8px 16px;
  border: 1px dashed transparent;
  font-size: 9pt;
  color: #888;
  cursor: text;
  transition: border-color 0.2s;
}
.header-footer-edit-area:hover {
  border-color: #c0c0c0;
}
.header-footer-edit-area:focus-within {
  border-color: var(--editor-blue-500);
  outline: none;
}
.header-footer-edit-area.header {
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 8px;
}
.header-footer-edit-area.footer {
  border-top: 1px solid #e5e5e5;
  margin-top: 8px;
}
.header-footer-label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  color: #bbb;
  background: #fff;
  padding: 0 8px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ══════════════════════════════════════════════════
   Reading Mode (읽기 모드)
   ══════════════════════════════════════════════════ */

.editor-reading-mode .ProseMirror {
  max-width: 700px;
  margin: 0 auto;
  font-size: 12pt;
  line-height: 2;
}
.editor-reading-mode .editor-page-area {
  box-shadow: none;
  border: none;
}

/* ══════════════════════════════════════════════════
   Outline View (개요 보기)
   ══════════════════════════════════════════════════ */

.editor-outline-mode .ProseMirror p:not(h1):not(h2):not(h3):not(h4) {
  display: none;
}
.editor-outline-mode .ProseMirror h1,
.editor-outline-mode .ProseMirror h2,
.editor-outline-mode .ProseMirror h3,
.editor-outline-mode .ProseMirror h4 {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
}
.editor-outline-mode .ProseMirror h1:hover,
.editor-outline-mode .ProseMirror h2:hover,
.editor-outline-mode .ProseMirror h3:hover,
.editor-outline-mode .ProseMirror h4:hover {
  background: var(--editor-blue-eff6ff);
}

/* ══════════════════════════════════════════════════
   Dark Mode — 레이아웃 오버라이드
   ══════════════════════════════════════════════════ */

/* 페이지/구역/단 나누기 다크모드 */
.word-editor-root.dark-mode .ProseMirror .page-break {
  border-top-color: #555;
}
.word-editor-root.dark-mode .ProseMirror .page-break::after {
  background: #2d2d2d;
  color: #777;
}
.word-editor-root.dark-mode .ProseMirror .section-break {
  border-top-color: #555;
}
.word-editor-root.dark-mode .ProseMirror .section-break::after {
  background: #2d2d2d;
  color: #777;
}
.word-editor-root.dark-mode .ProseMirror .column-break {
  border-top-color: #444;
}
.word-editor-root.dark-mode .ProseMirror .column-break::after {
  background: #2d2d2d;
  color: #666;
}

/* 머리글/바닥글 다크모드 */
.word-editor-root.dark-mode .header-footer-edit-area {
  color: #999;
}
.word-editor-root.dark-mode .header-footer-edit-area:hover {
  border-color: #555;
}
.word-editor-root.dark-mode .header-footer-edit-area:focus-within {
  border-color: var(--editor-dark-accent);
}
.word-editor-root.dark-mode .header-footer-edit-area.header {
  border-bottom-color: #444;
}
.word-editor-root.dark-mode .header-footer-edit-area.footer {
  border-top-color: #444;
}
.word-editor-root.dark-mode .header-footer-label {
  background: #2d2d2d;
  color: #666;
}

/* 읽기 모드 다크모드 */
.word-editor-root.dark-mode .editor-reading-mode .editor-page-area {
  box-shadow: none;
  border: none;
}

/* 개요 보기 다크모드 */
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h1:hover,
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h2:hover,
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h3:hover,
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h4:hover {
  background: #2a2a3a;
}

/* ── Print: 새 요소 인쇄 처리 ── */
@media print {
  .ProseMirror .page-break { border-top: none !important; }
  .ProseMirror .page-break::after { display: none; }
  .ProseMirror .section-break { border-top: none !important; }
  .ProseMirror .section-break::after { display: none; }
  .ProseMirror .column-break { border-top: none !important; }
  .ProseMirror .column-break::after { display: none; }
  .ProseMirror .bookmark-anchor { border-left: none !important; }
  .ProseMirror .bookmark-anchor::before { display: none; }
  .track-change-balloon { display: none !important; }
  .editor-status-bar { display: none !important; }
  .header-footer-label { display: none !important; }
}
`,zs=`
/* ──── Word 365 ribbon buttons ──── */
.word-ribbon-btn { transition: background 0.08s, border-color 0.08s; }
.word-ribbon-btn:hover { background: var(--editor-accent-bg-light) !important; }
.word-ribbon-btn:active { background: var(--editor-accent-bg-active) !important; }
.word-ribbon-btn.active { background: var(--editor-accent-bg-active) !important; border: 1px solid var(--editor-accent-border-soft) !important; }
.word-tab-btn { transition: background 0.08s, color 0.08s; }
.word-tab-btn:hover { background: transparent !important; color: var(--editor-accent) !important; }
.word-tab-btn.active { color: var(--editor-accent) !important; border-bottom: 2px solid var(--editor-accent); font-weight: 600; }
.word-style-card { transition: border-color 0.1s, box-shadow 0.1s; }
.word-style-card:hover { border-color: var(--editor-accent) !important; box-shadow: 0 1px 4px rgba(24,90,189,0.15); }

/* ──── Tooltip (Word 365 스타일) ──── */
.word-tooltip {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: #fff; color: #333; padding: 6px 10px; border-radius: 4px;
  font-size: 11px; white-space: nowrap; pointer-events: none; z-index: 1000;
  opacity: 0; transition: opacity 0.15s;
  border: 1px solid #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
}
.word-tooltip::after {
  content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: #fff;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.08));
}
*:hover > .word-tooltip { opacity: 1; }

/* ──── Dropdown menu (Word 365) ──── */
.word-dropdown-menu {
  position: absolute; top: 100%; left: 0; z-index: 200;
  background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.14); min-width: 160px;
  padding: 4px 0; max-height: 360px; overflow-y: auto;
  animation: ribbonDropdownIn 0.12s ease-out;
}
@keyframes ribbonDropdownIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.word-dropdown-item {
  display: flex; align-items: center; width: 100%; padding: 6px 12px; border: none; background: transparent;
  font-size: 12px; text-align: left; cursor: pointer; font-family: 'Segoe UI', '맑은 고딕', sans-serif;
  transition: background 0.08s; white-space: nowrap; gap: 8px;
}
.word-dropdown-item:hover { background: var(--editor-accent-bg-light); }
.word-dropdown-item.active { background: var(--editor-accent-bg-active); font-weight: 600; }
.word-dropdown-sep { height: 1px; background: #e5e5e5; margin: 4px 0; }

/* ──── Dialog / Modal ──── */
.word-dialog-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
}
.word-dialog {
  background: #f3f3f3; border: 1px solid #b0b0b0; border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25); min-width: 420px; max-width: 640px;
  font-family: '맑은 고딕', 'Segoe UI', sans-serif; font-size: 12px;
}
.word-dialog-title {
  padding: 10px 16px; font-size: 12px; font-weight: 400; color: #333;
  border-bottom: 1px solid #d5d5d5; background: #f3f3f3;
  display: flex; justify-content: space-between; align-items: center;
  cursor: default; user-select: none;
}
.word-dialog-body {
  padding: 16px; background: #fff;
}
.word-dialog-footer {
  padding: 10px 16px; display: flex; justify-content: flex-end; gap: 6px;
  border-top: 1px solid #d5d5d5;
}
.word-dialog-btn {
  padding: 5px 20px; font-size: 12px; border: 1px solid #adadad;
  border-radius: 2px; cursor: pointer; font-family: '맑은 고딕', sans-serif;
  background: #e5e5e5; color: #333;
}
.word-dialog-btn:hover { background: #d5d5d5; }
.word-dialog-btn.primary {
  background: var(--editor-accent); color: #fff; border-color: var(--editor-accent-border);
}
.word-dialog-btn.primary:hover { background: var(--editor-accent-hover-strong); }
.word-dialog-label {
  display: block; font-size: 12px; color: #444; margin-bottom: 4px; font-weight: 400;
}
.word-dialog-input {
  width: 100%; padding: 4px 8px; border: 1px solid #adadad; border-radius: 2px;
  font-size: 12px; outline: none; box-sizing: border-box; font-family: '맑은 고딕', sans-serif;
}
.word-dialog-input:focus { border-color: var(--editor-accent); box-shadow: 0 0 0 1px var(--editor-accent); }
.word-dialog-tabs {
  display: flex; border-bottom: 1px solid #d5d5d5; padding: 0 16px; background: #f3f3f3;
}
.word-dialog-tab {
  padding: 8px 16px; font-size: 12px; border: none; background: transparent;
  cursor: pointer; border-bottom: 2px solid transparent; color: #555;
  font-family: '맑은 고딕', sans-serif;
}
.word-dialog-tab:hover { color: #333; }
.word-dialog-tab.active { color: var(--editor-accent); border-bottom-color: var(--editor-accent); font-weight: 600; }

/* ──── Floating Toolbar ──── */
.floating-toolbar {
  position: absolute; z-index: 100;
  background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 4px 6px;
  display: flex; align-items: center; gap: 1px;
  animation: floatIn 0.15s ease-out;
}
@keyframes floatIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ──── Table grid selector ──── */
.table-grid-cell {
  width: 18px; height: 18px; border: 1px solid #d1d5db; cursor: pointer;
  transition: background 0.05s, border-color 0.05s;
}
.table-grid-cell.active {
  background: var(--editor-link-bg-hover); border-color: var(--editor-blue-500);
}

/* ──── Comment / Annotation ──── */
.word-comment {
  position: absolute; right: -220px; width: 200px;
  background: #fff; border: 1px solid #d1d5db; border-left: 3px solid var(--editor-blue-500);
  border-radius: 4px; padding: 8px 10px; font-size: 11px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

/* ──── Context Menu ──── */
@keyframes ctxIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.ctx-menu-item:hover { background: var(--editor-blue-eff6ff) !important; }

/* ──── Ribbon collapse toggle ──── */
.ribbon-collapse-btn {
  position: absolute; right: 8px; top: 8px; z-index: 10;
  width: 20px; height: 20px; border: 1px solid #d5d5d5;
  background: var(--ribbon-bg, #f8f8f8); border-radius: 3px;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 10px; color: #888;
  transition: background 0.1s;
}
.ribbon-collapse-btn:hover { background: var(--editor-link-bg-hover); }

/* ══════════════════════════════════════════════════
   향상된 리본 그룹 라벨
   ══════════════════════════════════════════════════ */
.ribbon-group-label {
  font-size: 9px;
  color: var(--ribbon-label, #888);
  text-align: center;
  padding-top: 2px;
  user-select: none;
  white-space: nowrap;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
}

/* ══════════════════════════════════════════════════
   Comment / Memo System (MS Word 365 스타일)
   ══════════════════════════════════════════════════ */

/* 본문 내 메모 하이라이트 */
.ProseMirror span.comment-highlight {
  background-color: rgba(255, 213, 79, 0.25);
  border-bottom: 2px solid var(--editor-comment-yellow);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
  border-radius: 1px;
}
.ProseMirror span.comment-highlight:hover {
  background-color: rgba(255, 213, 79, 0.4);
}
.ProseMirror span.comment-highlight.comment-active {
  background-color: rgba(255, 224, 130, 0.5);
  border-bottom-color: var(--editor-comment-yellow-active);
}
.ProseMirror span.comment-highlight.comment-resolved {
  background-color: transparent;
  border-bottom: 1px dashed #CCC;
}

/* 마크업 모드별 하이라이트 숨김 */
.comment-markup-none .ProseMirror span.comment-highlight,
.comment-markup-original .ProseMirror span.comment-highlight,
.comment-markup-simple .ProseMirror span.comment-highlight {
  background-color: transparent !important;
  border-bottom: none !important;
}

/* 간단한 태그 모드 — 여백 아이콘 */
.comment-margin-indicator {
  position: absolute;
  right: -30px;
  width: 22px;
  height: 22px;
  cursor: pointer;
  opacity: 0.5;
  z-index: 10;
  transition: opacity 0.15s, transform 0.1s;
}
.comment-margin-indicator:hover {
  opacity: 1;
  transform: scale(1.15);
}

/* ── 메모 패널 (오른쪽) ── */
.comments-panel {
  width: 280px;
  min-width: 220px;
  max-width: 360px;
  background: #F8F9FA;
  border-left: 1px solid #E0E0E0;
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.comments-panel-header {
  padding: 10px 12px;
  border-bottom: 1px solid #E8E8E8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #fff;
}
.comments-panel-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
}
.comments-panel-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 2px;
  border-radius: 3px;
  display: flex;
  align-items: center;
}
.comments-panel-close:hover {
  background: #f0f0f0;
  color: #666;
}
.comments-balloon-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* ── 메모 말풍선 카드 ── */
.comment-balloon {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  padding: 0;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
  position: relative;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  overflow: hidden;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
}
.comment-balloon:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-color: #D0D0D0;
}
.comment-balloon.active {
  border-color: var(--author-color, var(--editor-blue-500));
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

/* 왼쪽 색상 바 (활성 시 표시) */
.comment-color-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 6px 0 0 6px;
  transition: background-color 0.2s;
}

.comment-balloon-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 6px;
}
.comment-meta-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.comment-author-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  display: block;
  line-height: 1.3;
}
.comment-timestamp {
  font-size: 11px;
  color: #999;
}
.comment-edited-badge {
  font-size: 10px;
  color: #aaa;
}
.comment-content {
  font-size: 13px;
  color: #444;
  padding: 0 12px 8px;
  white-space: pre-wrap;
  line-height: 1.6;
  word-break: break-word;
}

/* 더보기 메뉴 버튼 */
.comment-more-btn {
  opacity: 0;
  transition: opacity 0.15s;
  cursor: pointer;
  padding: 3px 5px;
  border-radius: 3px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
}
.comment-balloon:hover .comment-more-btn {
  opacity: 0.5;
}
.comment-more-btn:hover {
  opacity: 1 !important;
  background: #F0F0F0;
}

/* 더보기 드롭다운 메뉴 */
.comment-more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 300;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  min-width: 170px;
  padding: 4px 0;
  animation: ctxIn 0.12s ease;
}
.comment-more-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 3px 0;
}
.comment-more-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  color: #333;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
  transition: background 0.1s;
}
.comment-more-item:hover {
  background: var(--editor-blue-eff6ff);
}
.comment-more-item.danger {
  color: var(--editor-track-delete);
}
.comment-more-item.danger:hover {
  background: #fef2f2;
}
.comment-more-item.disabled {
  color: #bbb;
  cursor: default;
  opacity: 0.5;
}
.comment-more-icon {
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 답글 */
.comment-replies {
  border-top: 1px solid #F0F0F0;
}
.comment-reply-item {
  padding: 8px 12px 6px;
  border-top: 1px solid #F5F5F5;
}
.comment-reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

/* 편집 영역 */
.comment-edit-area {
  padding: 0 12px 8px;
}
.comment-edit-textarea {
  width: 100%;
  border: 1.5px solid var(--editor-comment-textarea-border);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 13px;
  resize: none;
  min-height: 50px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
  transition: border-color 0.2s;
}
.comment-edit-textarea:focus {
  border-color: var(--editor-blue-600);
  box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
}
.comment-edit-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  justify-content: flex-end;
}

/* 액션 버튼 */
.comment-action-btn {
  padding: 4px 14px;
  font-size: 11px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  color: #555;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.1s, border-color 0.1s;
}
.comment-action-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}
.comment-action-btn.primary {
  background: var(--editor-accent);
  color: #fff;
  border-color: var(--editor-accent);
}
.comment-action-btn.primary:hover {
  background: var(--editor-accent-hover);
}
.comment-action-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

/* 답글 입력 필드 */
.comment-reply-input {
  width: 100%;
  border: 1.5px solid #E0E0E0;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 12px;
  resize: none;
  min-height: 36px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.comment-reply-input:focus {
  border-color: var(--editor-comment-textarea-border);
  box-shadow: 0 0 0 2px rgba(74,134,200,0.1);
}

/* 하단 액션 바 */
.comment-actions-bar {
  padding: 6px 12px 10px;
  border-top: 1px solid #F0F0F0;
}
.comment-reply-area {
  display: flex;
  flex-direction: column;
}
.comment-bottom-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.comment-reply-trigger {
  flex: 1;
  text-align: left;
  border: 1px solid #E0E0E0;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  background: #fafafa;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.15s, background 0.15s;
}
.comment-reply-trigger:hover {
  border-color: #ccc;
  background: #f5f5f5;
}
.comment-resolve-btn {
  border: 1px solid var(--editor-resolve-green);
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 11px;
  color: var(--editor-resolve-green);
  cursor: pointer;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.comment-resolve-btn:hover {
  background: var(--editor-resolve-green);
  color: #fff;
}

/* 해결된 메모 */
.comment-balloon.resolved {
  opacity: 0.65;
  padding: 0;
}
.comment-resolved-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
}
.comment-resolved-text {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.comment-reopen-btn {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  padding: 3px 10px;
  font-size: 11px;
  color: #555;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.1s;
}
.comment-reopen-btn:hover {
  background: #f0f0f0;
}

/* ── 검토 창 (세로/가로) ── */
.reviewing-pane {
  background: #F8F9FA;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.reviewing-pane-vertical {
  width: 300px;
  border-right: 1px solid #E0E0E0;
  overflow-y: auto;
}
.reviewing-pane-horizontal {
  height: 200px;
  border-top: 1px solid #E0E0E0;
  overflow-y: auto;
}
.reviewing-pane-header {
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: #fff;
}
.reviewing-pane-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}
.reviewing-pane-count {
  font-size: 11px;
  color: #888;
  margin-left: 10px;
}
.reviewing-pane-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  padding: 2px;
  border-radius: 3px;
}
.reviewing-pane-close:hover {
  background: #f0f0f0;
}
.reviewing-pane-list {
  flex: 1;
  overflow-y: auto;
}
.reviewing-pane-item {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.1s;
}
.reviewing-pane-item:hover {
  background: #f5f5f5;
}
.reviewing-pane-item.active {
  background: var(--editor-accent-row-bg);
}
.reviewing-pane-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}
.reviewing-pane-item-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}
.reviewing-pane-item-date {
  font-size: 10px;
  color: #888;
}
.reviewing-pane-item-content {
  font-size: 12px;
  color: #555;
  margin-left: 26px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reviewing-pane-item-replies {
  font-size: 11px;
  color: #999;
  margin-left: 26px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.reviewing-pane-empty {
  padding: 30px 20px;
  text-align: center;
  color: #999;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* ══════════════════════════════════════════════════
   Status Bar (상태 표시줄)
   ══════════════════════════════════════════════════ */

.editor-status-bar {
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  background: var(--ribbon-bg, #f3f3f3);
  border-top: 1px solid var(--ribbon-sep, #d1d5db);
  font-size: 11px;
  color: var(--ribbon-fg, #666);
  gap: 16px;
  flex-shrink: 0;
  user-select: none;
}
.editor-status-bar .status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}
.editor-status-bar .status-item.clickable {
  cursor: pointer;
}
.editor-status-bar .status-item.clickable:hover {
  color: var(--editor-accent);
}
.editor-status-bar .status-sep {
  width: 1px;
  height: 14px;
  background: var(--ribbon-sep, #d1d5db);
}
.editor-status-bar .zoom-slider {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.editor-status-bar .zoom-slider input[type="range"] {
  width: 100px;
  height: 4px;
  accent-color: var(--editor-accent);
  cursor: pointer;
}

/* ══════════════════════════════════════════════════
   Dark Mode — 컴포넌트 오버라이드
   ══════════════════════════════════════════════════ */
.word-editor-root.dark-mode .word-ribbon-btn:hover { background: #3a3a50 !important; }
.word-editor-root.dark-mode .word-ribbon-btn.active { background: #3a3a50 !important; border: 1px solid var(--editor-dark-accent) !important; }
.word-editor-root.dark-mode .word-tab-btn:hover { background: transparent !important; color: var(--editor-dark-accent-soft) !important; }
.word-editor-root.dark-mode .word-tab-btn.active { color: var(--editor-dark-accent-soft) !important; border-bottom-color: var(--editor-dark-accent-soft); }
.word-editor-root.dark-mode .word-style-card:hover { border-color: var(--editor-dark-accent) !important; }
.word-editor-root.dark-mode .word-dropdown-menu { background: #2d2d2d; border-color: #444; }
.word-editor-root.dark-mode .word-dropdown-item { color: #e0e0e0; }
.word-editor-root.dark-mode .word-dropdown-item:hover { background: #3a3a5c; }
.word-editor-root.dark-mode .floating-toolbar { background: #2d2d2d; border-color: #444; }
.word-editor-root.dark-mode .word-tooltip { background: #333; color: #e0e0e0; border-color: #555; }
.word-editor-root.dark-mode .word-tooltip::after { border-top-color: #333; }

/* 댓글 다크모드 */
.word-editor-root.dark-mode .comment-balloon {
  background: #2d2d2d;
  border-color: #444;
}
.word-editor-root.dark-mode .comment-balloon.active {
  border-color: var(--author-color, var(--editor-dark-accent));
}
.word-editor-root.dark-mode .comment-balloon:hover {
  border-color: #555;
}
.word-editor-root.dark-mode .comment-author-name { color: #e0e0e0; }
.word-editor-root.dark-mode .comment-content { color: #ccc; }
.word-editor-root.dark-mode .comment-timestamp { color: #777; }
.word-editor-root.dark-mode .comments-panel { background: #1e1e1e; border-left-color: #444; }
.word-editor-root.dark-mode .comments-panel-header { background: #2a2a2a; border-bottom-color: #444; }
.word-editor-root.dark-mode .comments-panel-title { color: #bbb; }
.word-editor-root.dark-mode .reviewing-pane { background: #1e1e1e; }
.word-editor-root.dark-mode .reviewing-pane-header { background: #2a2a2a; border-bottom-color: #444; }
.word-editor-root.dark-mode .reviewing-pane-vertical { border-right-color: #444; }
.word-editor-root.dark-mode .reviewing-pane-horizontal { border-top-color: #444; }
.word-editor-root.dark-mode .reviewing-pane-item { border-bottom-color: #333; }
.word-editor-root.dark-mode .reviewing-pane-item:hover { background: #333; }
.word-editor-root.dark-mode .reviewing-pane-item.active { background: #2a3a5c; }
.word-editor-root.dark-mode .ProseMirror span.comment-highlight {
  background-color: rgba(255,243,196,0.2);
  border-bottom-color: rgba(255,213,79,0.4);
}
.word-editor-root.dark-mode .ProseMirror span.comment-highlight.comment-active {
  background-color: rgba(255,224,130,0.3);
}
.word-editor-root.dark-mode .comment-edit-textarea {
  background: #333;
  color: #e0e0e0;
  border-color: var(--editor-dark-accent);
}
.word-editor-root.dark-mode .comment-reply-input {
  background: #333;
  color: #e0e0e0;
  border-color: #555;
}
.word-editor-root.dark-mode .comment-reply-trigger {
  background: #333;
  border-color: #555;
  color: #888;
}
.word-editor-root.dark-mode .comment-more-menu {
  background: #2d2d2d;
  border-color: #555;
}
.word-editor-root.dark-mode .comment-more-item { color: #ddd; }
.word-editor-root.dark-mode .comment-more-item:hover { background: #3a3a3a; }

/* 상태 표시줄 다크모드 */
.word-editor-root.dark-mode .editor-status-bar .status-item.clickable:hover {
  color: var(--editor-dark-link);
}

/* ── 인쇄 시 숨김 ── */
@media print {
  .comments-panel { display: none !important; }
  .reviewing-pane, .reviewing-pane-vertical, .reviewing-pane-horizontal { display: none !important; }
  .comment-margin-indicator { display: none !important; }
  .ProseMirror span.comment-highlight { background-color: transparent !important; border-bottom: none !important; }
  .footnote-delete-btn { display: none !important; }
}
`,Is=`
/* ──── 모바일 보조 가시성 (기본은 숨김) ──── */
.editor-mobile-only { display: none; }

@media (max-width: 767.98px) {
  /* 모바일에서만 노출 / 숨김 */
  .editor-mobile-only { display: flex; }
  .editor-desktop-only { display: none !important; }

  /* iOS 입력 자동 확대 방지(16px 미만이면 확대됨) */
  .word-editor-root .ProseMirror,
  .word-editor-root input[type="text"],
  .word-editor-root textarea {
    font-size: 16px;
  }

  /* 캔버스 스크롤 영역 — 모바일에서는 흰 배경 + 좌우 패딩 0 */
  .word-editor-root .editor-canvas-scroll {
    padding: 0 !important;
    background: #fff !important;
    -webkit-overflow-scrolling: touch;
  }

  /* 본문 흐름 뷰 컨테이너 */
  .editor-mobile-flow {
    width: 100%;
    max-width: 100%;
    padding: 14px 16px 80px;
    box-sizing: border-box;
    background: #fff;
    min-height: 100%;
  }
  .editor-mobile-flow .ProseMirror {
    padding: 0;
    min-height: 60vh;
    line-height: 1.7;
    font-size: 16px;
    color: #1f2937;
    outline: none;
  }
  .editor-mobile-flow .ProseMirror:focus { outline: none; }
  .editor-mobile-flow .ProseMirror p { margin: 0 0 12px; }
  .editor-mobile-flow .ProseMirror h1 { font-size: 22px; margin: 16px 0 10px; }
  .editor-mobile-flow .ProseMirror h2 { font-size: 19px; margin: 14px 0 8px; }
  .editor-mobile-flow .ProseMirror h3 { font-size: 17px; margin: 12px 0 6px; }
  .editor-mobile-flow .doc-title-input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    padding: 4px 0 8px;
    background: transparent;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 14px;
    box-sizing: border-box;
  }

  /* 이미지/표 스크롤 보정 */
  .editor-mobile-flow .ProseMirror img { max-width: 100%; height: auto; }
  .editor-mobile-flow .ProseMirror table {
    display: block;
    overflow-x: auto;
    max-width: 100%;
  }

  /* ──── Mobile Top Bar ──── */
  .editor-mtopbar {
    height: 52px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    padding-top: env(safe-area-inset-top, 0);
    background: #1a2332;
    color: #fff;
    border-bottom: 1px solid #0f1923;
    z-index: 30;
  }
  .editor-mtopbar.dark { background: #0f1923; }
  .editor-mtopbar button {
    background: transparent;
    border: none;
    color: #fff;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .editor-mtopbar button:active { background: rgba(255,255,255,0.18); }
  .editor-mtopbar .mtopbar-title {
    flex: 1;
    min-width: 0;
    height: 36px;
    font-size: 15px;
    font-weight: 500;
    background: transparent;
    color: #fff;
    border: none;
    outline: none;
    padding: 0 6px;
  }
  .editor-mtopbar .mtopbar-title::placeholder { color: rgba(255,255,255,0.55); }
  .editor-mtopbar .mtopbar-status {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    margin: 0 4px;
  }

  /* ──── Mobile Format Bar (sticky bottom) ──── */
  .editor-mformatbar {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    height: 52px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    padding-bottom: calc(4px + env(safe-area-inset-bottom, 0));
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    overflow-x: auto;
    overflow-y: hidden;
    z-index: 25;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .editor-mformatbar::-webkit-scrollbar { display: none; }
  .editor-mformatbar.dark {
    background: #1e1e1e;
    border-top-color: #333;
  }
  .editor-mformatbar button {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #334155;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .editor-mformatbar button.active {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .editor-mformatbar.dark button { color: #e5e7eb; }
  .editor-mformatbar.dark button.active { background: #1e3a8a; color: #fff; }
  .editor-mformatbar button:active { background: #e2e8f0; }
  .editor-mformatbar .mformatbar-sep {
    width: 1px;
    height: 24px;
    background: #cbd5e1;
    margin: 0 4px;
    flex-shrink: 0;
  }

  /* ──── Mobile Sidebar Drawer ──── */
  .editor-msidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 90;
    animation: editor-mfade 0.18s ease-out;
  }
  .editor-msidebar-drawer {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(86vw, 340px);
    background: #eae6e1;
    z-index: 91;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 18px rgba(0,0,0,0.18);
    animation: editor-mslide-left 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    padding-top: env(safe-area-inset-top, 0);
  }
  .editor-msidebar-drawer > div { width: 100% !important; }

  /* 모바일에서는 사이드바를 항상 펼친 상태로 (collapsed prop 무시) */
  .editor-msidebar-drawer .editor-desktop-sidebar {
    width: 100% !important;
    flex-shrink: 0;
  }

  /* ──── Mobile Tool Sheet (bottom sheet) ──── */
  .editor-msheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 92;
    animation: editor-mfade 0.18s ease-out;
  }
  .editor-msheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 78vh;
    background: #fff;
    border-radius: 16px 16px 0 0;
    z-index: 93;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 -8px 30px rgba(0,0,0,0.22);
    animation: editor-mslide-up 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .editor-msheet.dark { background: #1e1e1e; color: #e5e7eb; }
  .editor-msheet-handle {
    width: 40px;
    height: 4px;
    background: #cbd5e1;
    border-radius: 2px;
    margin: 8px auto 4px;
    flex-shrink: 0;
  }
  .editor-msheet-header {
    padding: 8px 16px 12px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .editor-msheet.dark .editor-msheet-header { border-bottom-color: #333; }
  .editor-msheet-title { font-size: 15px; font-weight: 600; color: #0f172a; }
  .editor-msheet.dark .editor-msheet-title { color: #f1f5f9; }
  .editor-msheet-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 12px 16px;
    -webkit-overflow-scrolling: touch;
  }
  .editor-msheet-section { margin-bottom: 16px; }
  .editor-msheet-section-title {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 4px 6px 8px;
  }
  .editor-msheet.dark .editor-msheet-section-title { color: #94a3b8; }
  .editor-msheet-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .editor-msheet-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 6px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    color: #0f172a;
    cursor: pointer;
    text-align: center;
    font-size: 12px;
  }
  .editor-msheet-item:active { background: #f1f5f9; }
  .editor-msheet-item .editor-msheet-item-label {
    font-size: 11px;
    line-height: 1.25;
    word-break: keep-all;
  }
  .editor-msheet.dark .editor-msheet-item {
    background: #2a2a2a;
    border-color: #3a3a3a;
    color: #e5e7eb;
  }
  .editor-msheet.dark .editor-msheet-item:active { background: #333; }

  .editor-msheet-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    flex-wrap: wrap;
  }
  .editor-msheet-row > button.editor-msheet-chip,
  .editor-msheet-row > .editor-msheet-chip {
    flex: 0 0 auto;
    height: 36px;
    min-width: 44px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    color: #0f172a;
    font-size: 13px;
    cursor: pointer;
  }
  .editor-msheet-row > .editor-msheet-chip.active {
    background: #dbeafe;
    border-color: #93c5fd;
    color: #1d4ed8;
  }
  .editor-msheet.dark .editor-msheet-row > .editor-msheet-chip {
    background: #2a2a2a;
    border-color: #444;
    color: #e5e7eb;
  }

  @keyframes editor-mslide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes editor-mslide-left {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  @keyframes editor-mfade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}

/* iPad 가로 등 좁은 태블릿: 사이드바 드로어 + 바텀 바 사용, 리본은 유지 가능
   현재는 단순 모바일/데스크톱 분기만 적용 */

@media (max-width: 767.98px) {
  /* ──── Mobile Selection Bar ──── */
  .editor-mselection-bar {
    background: #1a2332;
    color: #fff;
    border-radius: 22px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.32);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    z-index: 60;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    animation: editor-mselect-pop 0.16s ease-out;
  }
  .editor-mselection-bar::-webkit-scrollbar { display: none; }
  .editor-mselection-bar button {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    color: #fff;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .editor-mselection-bar button:active { background: rgba(255,255,255,0.18); }
  .editor-mselection-bar button.active { background: rgba(59,130,246,0.55); }
  .editor-mselection-bar button.danger { color: #fca5a5; }
  .editor-mselection-bar .mselection-sep {
    width: 1px;
    height: 22px;
    background: rgba(255,255,255,0.2);
    margin: 0 2px;
    flex-shrink: 0;
  }
  @keyframes editor-mselect-pop {
    from { opacity: 0; transform: translateY(4px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ──── Mobile Slash Menu ──── */
  .editor-mslash {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    max-height: 60vh;
    background: #fff;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 30px rgba(0,0,0,0.22);
    z-index: 95;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-bottom: env(safe-area-inset-bottom, 0);
    animation: editor-mslide-up 0.18s ease-out;
  }
  .editor-mslash .mslash-handle {
    width: 36px; height: 4px;
    background: #cbd5e1; border-radius: 2px;
    margin: 8px auto 4px;
    flex-shrink: 0;
  }
  .editor-mslash .mslash-header {
    padding: 6px 16px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #6b7280;
    font-size: 13px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }
  .editor-mslash .mslash-header span { font-family: monospace; color: #1f2937; }
  .editor-mslash .mslash-header button {
    width: 28px; height: 28px;
    background: transparent; border: none;
    font-size: 22px; color: #6b7280; cursor: pointer;
  }
  .editor-mslash .mslash-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 8px 16px;
    -webkit-overflow-scrolling: touch;
  }
  .editor-mslash .mslash-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-radius: 10px;
  }
  .editor-mslash .mslash-item:active { background: #eff6ff; }
  .editor-mslash .mslash-item.active { background: #eff6ff; }
  .editor-mslash .mslash-icon {
    width: 36px; height: 36px;
    flex-shrink: 0;
    background: #f1f5f9;
    border-radius: 8px;
    display: inline-flex; align-items: center; justify-content: center;
    color: #1d4ed8;
  }
  .editor-mslash .mslash-text { display: flex; flex-direction: column; min-width: 0; }
  .editor-mslash .mslash-label { font-size: 14px; font-weight: 500; color: #0f172a; }
  .editor-mslash .mslash-desc { font-size: 11px; color: #94a3b8; margin-top: 1px; }

  /* ──── Mobile Voice Input ──── */
  .editor-mvoice-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 98;
  }
  .editor-mvoice {
    position: fixed; inset: auto 16px 16px 16px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0));
    background: #0f172a;
    color: #f1f5f9;
    border-radius: 18px;
    padding: 14px 16px 18px;
    z-index: 99;
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    animation: editor-mslide-up 0.2s ease-out;
  }
  .editor-mvoice .mvoice-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px;
  }
  .editor-mvoice .mvoice-title { font-size: 14px; font-weight: 600; }
  .editor-mvoice .mvoice-header button {
    width: 32px; height: 32px;
    background: transparent; border: none; color: #cbd5e1;
    border-radius: 50%; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mvoice .mvoice-orb {
    width: 88px; height: 88px;
    margin: 6px auto 4px;
    position: relative;
    display: flex; align-items: center; justify-content: center;
  }
  .editor-mvoice .mvoice-orb span {
    position: absolute; inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 50%, #3b82f6 0%, rgba(59,130,246,0) 70%);
    opacity: 0.5;
    transform: scale(0.6);
  }
  .editor-mvoice .mvoice-orb.listening span:nth-child(1) { animation: editor-mpulse 1.2s ease-out infinite; }
  .editor-mvoice .mvoice-orb.listening span:nth-child(2) { animation: editor-mpulse 1.2s 0.4s ease-out infinite; }
  .editor-mvoice .mvoice-orb.listening span:nth-child(3) { animation: editor-mpulse 1.2s 0.8s ease-out infinite; }
  @keyframes editor-mpulse {
    0%   { transform: scale(0.6); opacity: 0.7; }
    100% { transform: scale(1.2); opacity: 0; }
  }
  .editor-mvoice .mvoice-status {
    text-align: center; font-size: 12px; color: #94a3b8; margin-top: 2px;
  }
  .editor-mvoice .mvoice-transcript {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 10px 12px;
    border-radius: 10px;
    margin-top: 12px;
    min-height: 64px;
    max-height: 28vh;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.55;
  }
  .editor-mvoice .mvoice-transcript .interim { color: #94a3b8; }
  .editor-mvoice .mvoice-actions {
    display: flex; gap: 8px;
    margin-top: 12px;
  }
  .editor-mvoice .mvoice-actions button {
    flex: 1;
    height: 44px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .editor-mvoice .mvoice-toggle {
    background: rgba(255,255,255,0.08);
    color: #f1f5f9;
  }
  .editor-mvoice .mvoice-toggle.on { background: #ef4444; color: #fff; }
  .editor-mvoice .mvoice-done { background: #2563eb; color: #fff; }
  .editor-mvoice .mvoice-tip {
    margin-top: 8px;
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
  }

  /* ──── Mobile Image Quick Add ──── */
  .editor-mimage {
    position: fixed; inset: auto 16px 16px 16px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0));
    background: #fff;
    border-radius: 18px;
    z-index: 99;
    padding: 14px 16px 18px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.32);
    animation: editor-mslide-up 0.2s ease-out;
  }
  .editor-mimage .mvoice-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .editor-mimage .mvoice-title { font-size: 14px; font-weight: 600; color: #0f172a; }
  .editor-mimage .mvoice-header button {
    width: 32px; height: 32px;
    background: transparent; border: none; color: #6b7280;
    border-radius: 50%; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mimage .mimage-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    margin-top: 6px;
  }
  .editor-mimage .mimage-card {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 14px;
    padding: 18px 10px 14px;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    cursor: pointer;
    color: #0f172a;
  }
  .editor-mimage .mimage-card:active { background: #eff6ff; }
  .editor-mimage .mimage-card span { font-size: 13px; font-weight: 500; }
  .editor-mimage .mimage-card small { font-size: 11px; color: #6b7280; }
  .editor-mimage .mimage-progress {
    margin-top: 10px;
    text-align: center;
    font-size: 12px;
    color: #475569;
  }
  .editor-mimage .mimage-progress .failed { color: #dc2626; }

  /* ──── Mobile Outline ──── */
  .editor-moutline {
    position: fixed;
    top: 0; bottom: 0; right: 0;
    width: min(86vw, 320px);
    background: #fff;
    z-index: 96;
    box-shadow: -2px 0 18px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    animation: editor-mslide-right 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    padding-top: env(safe-area-inset-top, 0);
  }
  .editor-moutline .moutline-header {
    height: 48px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 14px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 14px; font-weight: 600; color: #0f172a;
  }
  .editor-moutline .moutline-header button {
    width: 36px; height: 36px;
    background: transparent; border: none; color: #6b7280;
    border-radius: 50%; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-moutline .moutline-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 8px 16px;
    -webkit-overflow-scrolling: touch;
  }
  .editor-moutline .moutline-empty {
    padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 13px;
  }
  .editor-moutline .moutline-item {
    width: 100%;
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border: none; background: transparent;
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    color: #0f172a;
  }
  .editor-moutline .moutline-item:active { background: #eff6ff; }
  .editor-moutline .moutline-item.lvl-2 { padding-left: 20px; }
  .editor-moutline .moutline-item.lvl-3 { padding-left: 32px; font-size: 13px; color: #334155; }
  .editor-moutline .moutline-bullet {
    width: 26px; height: 22px;
    flex-shrink: 0;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 4px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600;
  }
  .editor-moutline .moutline-bullet[data-level="2"] { background: #f1f5f9; color: #475569; }
  .editor-moutline .moutline-bullet[data-level="3"] { background: #f8fafc; color: #94a3b8; }
  .editor-moutline .moutline-text {
    flex: 1; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  @keyframes editor-mslide-right {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }

  /* ──── Mobile Meta Sheet ──── */
  .editor-mmeta .mmeta-section {
    margin-bottom: 16px;
    padding: 0 4px;
  }
  .editor-mmeta .mmeta-section label {
    display: block;
    font-size: 12px; font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .editor-mmeta .mmeta-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    font-size: 16px;
    color: #0f172a;
    box-sizing: border-box;
    font-family: inherit;
    line-height: 1.5;
  }
  .editor-mmeta .mmeta-input:focus { outline: 2px solid #93c5fd; outline-offset: -1px; }
  .editor-mmeta .mmeta-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .editor-mmeta .mmeta-chip {
    height: 36px;
    padding: 0 14px;
    border-radius: 18px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
    font-size: 13px;
    cursor: pointer;
  }
  .editor-mmeta .mmeta-chip.active {
    background: #1d4ed8; color: #fff; border-color: #1d4ed8;
  }
  .editor-mmeta .mmeta-thumb { position: relative; }
  .editor-mmeta .mmeta-thumb img {
    width: 100%; max-height: 200px; object-fit: cover;
    border-radius: 12px; border: 1px solid #e2e8f0;
  }
  .editor-mmeta .mmeta-thumb-clear {
    position: absolute; top: 8px; right: 8px;
    background: rgba(0,0,0,0.6); color: #fff;
    border: none; padding: 6px 10px; border-radius: 6px;
    font-size: 11px; cursor: pointer;
  }
  .editor-mmeta .mmeta-thumb-upload {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 16px;
    border: 1px dashed #94a3b8;
    border-radius: 12px;
    background: #f8fafc;
    color: #475569;
    cursor: pointer;
    font-size: 14px;
  }
  .editor-mmeta .mmeta-thumb-upload.uploading { opacity: 0.6; }
  .editor-mmeta .mmeta-actions {
    display: flex; gap: 8px;
    padding: 8px 4px 12px;
    position: sticky; bottom: 0;
    background: linear-gradient(to top, #fff 70%, rgba(255,255,255,0));
  }
  .editor-mmeta .mmeta-actions button {
    flex: 1; height: 48px;
    border-radius: 12px;
    border: none;
    font-size: 15px; font-weight: 600;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .editor-mmeta .mmeta-secondary {
    background: #f1f5f9; color: #1f2937;
  }
  .editor-mmeta .mmeta-primary {
    background: #2563eb; color: #fff;
  }
  .editor-mmeta .mmeta-primary:disabled { background: #93c5fd; }

  /* ──── Mobile Writing HUD ──── */
  .editor-mhud {
    position: fixed;
    bottom: calc(60px + env(safe-area-inset-bottom, 0));
    right: 14px;
    border: none;
    background: rgba(15, 23, 42, 0.85);
    color: #f8fafc;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    z-index: 22;
    box-shadow: 0 4px 14px rgba(0,0,0,0.18);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.2s;
  }
  .editor-mhud.expanded {
    border-radius: 14px;
    padding: 10px 14px;
    bottom: calc(110px + env(safe-area-inset-bottom, 0));
  }
  .editor-mhud .mhud-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    text-align: center;
  }
  .editor-mhud .mhud-grid > div {
    display: flex; flex-direction: column; gap: 2px;
    min-width: 38px;
  }
  .editor-mhud .mhud-grid strong { font-size: 13px; font-weight: 700; }
  .editor-mhud .mhud-grid span { font-size: 9px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em; }
  .editor-mhud .mhud-compact { white-space: nowrap; }

  /* ──── Mobile Speed Dial (FAB) ──── */
  .editor-mfab {
    position: fixed;
    bottom: calc(64px + env(safe-area-inset-bottom, 0));
    right: 14px;
    z-index: 24;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 10px;
  }
  .editor-mfab .mfab-trigger {
    width: 56px; height: 56px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(29, 78, 216, 0.45);
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mfab .mfab-actions {
    display: flex; flex-direction: column-reverse; gap: 8px;
    align-items: flex-end;
  }
  .editor-mfab .mfab-action {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 12px 8px 8px;
    background: var(--mfab-color, #1d4ed8);
    color: #fff;
    border: none;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(0,0,0,0.18);
    animation: editor-mfab-in 0.18s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
    animation-delay: calc(var(--mfab-i, 0) * 28ms);
  }
  .editor-mfab .mfab-icon {
    width: 32px; height: 32px;
    background: rgba(255,255,255,0.15);
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
  }
  @keyframes editor-mfab-in {
    from { opacity: 0; transform: translateY(10px) scale(0.85); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ──── Top bar 활성 버튼 강조 ──── */
  .editor-mtopbar button.active {
    background: rgba(59,130,246,0.55);
  }

  /* ──── Focus mode ──── */
  .word-editor-root.mobile-focus-mode .editor-mformatbar,
  .word-editor-root.mobile-focus-mode .editor-mhud,
  .word-editor-root.mobile-focus-mode .editor-mfab {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s;
  }
  .word-editor-root.mobile-focus-mode .editor-mtopbar {
    background: transparent;
    border-bottom-color: transparent;
  }
  .word-editor-root.mobile-focus-mode .editor-mtopbar > button:not(:last-child),
  .word-editor-root.mobile-focus-mode .editor-mtopbar > .mtopbar-status {
    opacity: 0.25;
    transition: opacity 0.25s;
  }
  .word-editor-root.mobile-focus-mode .editor-mobile-flow {
    padding: 28px 22px 100px;
    max-width: 720px;
    margin: 0 auto;
  }
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror {
    font-size: 17px;
    line-height: 1.85;
  }
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror p:not(.is-editor-empty) {
    color: #94a3b8;
    transition: color 0.25s;
  }
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror p.has-focus,
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror p:focus-within,
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror h1.has-focus,
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror h2.has-focus,
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror h3.has-focus {
    color: #0f172a !important;
  }
  /* 키보드 위 정확 위치 (visual viewport bottom) */
  .word-editor-root[data-keyboard-open="true"] .editor-mformatbar {
    bottom: var(--editor-keyboard-h, 0px);
    transition: bottom 0.15s ease-out;
  }
  .word-editor-root[data-keyboard-open="true"] .editor-mhud,
  .word-editor-root[data-keyboard-open="true"] .editor-mfab {
    bottom: calc(var(--editor-keyboard-h, 0px) + 60px);
  }

  /* ──── Performance hints ──── */
  .editor-mobile-flow .ProseMirror > * { content-visibility: auto; contain-intrinsic-size: 1px 80px; }
  .editor-mselection-bar, .editor-mformatbar, .editor-mfab, .editor-mhud { will-change: transform, opacity; }

  /* ──── Command Palette ──── */
  .editor-mpalette {
    position: fixed; left: 0; right: 0; bottom: 0;
    max-height: 86vh;
    background: #fff;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -10px 32px rgba(0,0,0,0.25);
    z-index: 96;
    display: flex; flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom, 0);
    animation: editor-mslide-up 0.18s ease-out;
  }
  .mpalette-header {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 14px;
    border-bottom: 1px solid #e5e7eb;
    color: #475569;
    flex-shrink: 0;
  }
  .mpalette-input {
    flex: 1;
    border: none; outline: none;
    font-size: 16px; padding: 6px 4px;
    color: #0f172a;
    background: transparent;
  }
  .mpalette-header > button {
    width: 36px; height: 36px;
    background: transparent; border: none;
    color: #64748b; cursor: pointer;
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .mpalette-tabs {
    display: flex; gap: 4px;
    padding: 8px 10px 4px;
    overflow-x: auto;
    flex-shrink: 0;
    scrollbar-width: none;
  }
  .mpalette-tabs::-webkit-scrollbar { display: none; }
  .mpalette-tab {
    flex-shrink: 0;
    height: 32px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #475569;
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 4px;
  }
  .mpalette-tab.active {
    background: #1d4ed8; color: #fff; border-color: #1d4ed8;
  }
  .mpalette-body {
    flex: 1; overflow-y: auto;
    padding: 8px 8px 16px;
    -webkit-overflow-scrolling: touch;
  }
  .mpalette-section { margin-bottom: 12px; }
  .mpalette-section-title {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 8px 6px;
    font-size: 11px; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .mpalette-add-snip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px;
    border: 1px solid #cbd5e1; background: #fff;
    color: #1d4ed8; border-radius: 999px;
    font-size: 11px; cursor: pointer;
  }
  .mpalette-list { display: flex; flex-direction: column; }
  .mpalette-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border: none; background: transparent;
    text-align: left; cursor: pointer;
    border-radius: 10px;
    width: 100%;
  }
  .mpalette-row:active { background: #eff6ff; }
  .mpalette-icon {
    width: 36px; height: 36px;
    flex-shrink: 0;
    background: #f1f5f9;
    border-radius: 8px;
    display: inline-flex; align-items: center; justify-content: center;
    color: #1d4ed8;
  }
  .mpalette-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .mpalette-text > span { font-size: 14px; color: #0f172a; font-weight: 500; }
  .mpalette-text > small { font-size: 11px; color: #94a3b8; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mpalette-emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 4px;
    padding: 4px 8px;
  }
  .mpalette-emoji {
    height: 40px;
    border: none; background: #f8fafc;
    border-radius: 8px;
    font-size: 20px;
    cursor: pointer;
  }
  .mpalette-emoji:active { background: #dbeafe; }
  .mpalette-empty {
    padding: 24px 12px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
  }
  .mpalette-snip-edit {
    padding: 8px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .mpalette-snip-actions { display: flex; gap: 8px; }
  .mpalette-snip-actions button { flex: 1; height: 44px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; }

  /* ──── AI Assistant ──── */
  .editor-mai {
    position: fixed; left: 0; right: 0; bottom: 0;
    max-height: 80vh;
    background: linear-gradient(180deg, #0f172a 0%, #111c30 100%);
    color: #f8fafc;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -10px 32px rgba(0,0,0,0.32);
    z-index: 97;
    display: flex; flex-direction: column;
    padding: 6px 14px 18px;
    padding-bottom: calc(18px + env(safe-area-inset-bottom, 0));
    animation: editor-mslide-up 0.2s ease-out;
  }
  .editor-mai .mai-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 4px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .editor-mai .mai-title { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
  .editor-mai .mai-header > button {
    width: 36px; height: 36px;
    background: transparent; border: none;
    color: #cbd5e1; cursor: pointer;
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mai .mai-grid {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px; padding: 12px 0;
  }
  .editor-mai .mai-action {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 12px 4px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: #f1f5f9;
    border-radius: 10px;
    cursor: pointer;
    font-size: 11px;
  }
  .editor-mai .mai-action:disabled { opacity: 0.5; cursor: not-allowed; }
  .editor-mai .mai-action.loading { background: rgba(59,130,246,0.25); }
  .editor-mai .mai-loading {
    display: flex; align-items: center; gap: 8px;
    color: #93c5fd; font-size: 13px;
    padding: 4px 0;
  }
  .editor-mai .mai-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #93c5fd;
    border-radius: 50%;
    animation: editor-spin 0.8s linear infinite;
  }
  @keyframes editor-spin { to { transform: rotate(360deg); } }
  .editor-mai .mai-result {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 12px;
    overflow-y: auto;
    max-height: 38vh;
  }
  .editor-mai .mai-result-label {
    font-size: 11px; color: #93c5fd;
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .editor-mai .mai-result p { margin: 0; line-height: 1.6; font-size: 14px; color: #f1f5f9; }
  .editor-mai .mai-result ol { padding-left: 18px; margin: 0; }
  .editor-mai .mai-result ol li { margin: 4px 0; }
  .editor-mai .mai-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .editor-mai .mai-tags span {
    padding: 4px 10px;
    background: rgba(59,130,246,0.2);
    color: #bfdbfe;
    border-radius: 999px;
    font-size: 12px;
  }
  .editor-mai .mai-result-actions {
    display: flex; gap: 8px; margin-top: 10px;
  }
  .editor-mai .mai-result-actions button {
    flex: 1; height: 40px; border: none; cursor: pointer;
    border-radius: 8px; font-size: 13px; font-weight: 600;
  }
  .editor-mai .mai-result-actions .mmeta-secondary {
    background: rgba(255,255,255,0.08); color: #f1f5f9;
  }
  .editor-mai .mai-result-actions .mmeta-primary {
    background: #2563eb; color: #fff;
  }
  .editor-mai .mai-tip {
    margin-top: 10px;
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
  }
  .editor-mai .mai-tip code {
    background: rgba(255,255,255,0.08);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11px;
  }

  /* ──── Publish Sheet ──── */
  .editor-mpublish .mpublish-summary {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px;
    margin-bottom: 12px;
    background: #f8fafc;
    border-radius: 10px;
  }
  .editor-mpublish .mpublish-score {
    width: 56px; height: 56px;
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    color: #fff;
  }
  .editor-mpublish .mpublish-score[data-status="ok"] { background: #16a34a; }
  .editor-mpublish .mpublish-score[data-status="warn"] { background: #f59e0b; }
  .editor-mpublish .mpublish-score[data-status="error"] { background: #dc2626; }
  .editor-mpublish .mpublish-counts {
    display: flex; flex-direction: column; gap: 4px;
    text-align: right; font-size: 13px;
  }
  .editor-mpublish .mpublish-counts span { display: inline-flex; align-items: center; gap: 4px; justify-content: flex-end; }
  .editor-mpublish .mpublish-counts .ok { color: #16a34a; }
  .editor-mpublish .mpublish-counts .warn { color: #f59e0b; }
  .editor-mpublish .mpublish-counts .error { color: #dc2626; }
  .editor-mpublish .mpublish-checks {
    list-style: none;
    padding: 0; margin: 0 0 16px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .editor-mpublish .mpublish-check {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    font-size: 13px;
    color: #334155;
  }
  .editor-mpublish .mpublish-check.ok { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
  .editor-mpublish .mpublish-check.warn { border-color: #fde68a; background: #fffbeb; color: #92400e; }
  .editor-mpublish .mpublish-check.error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
  .editor-mpublish .mpublish-mode {
    display: flex; gap: 8px;
    margin: 0 0 12px;
  }
  .editor-mpublish .mpublish-mode button {
    flex: 1; height: 44px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
    border-radius: 10px;
    cursor: pointer;
    font-size: 13px; font-weight: 500;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .editor-mpublish .mpublish-mode button.active {
    background: #1d4ed8; color: #fff; border-color: #1d4ed8;
  }
  .editor-mpublish .mpublish-schedule label {
    display: block; font-size: 12px; color: #475569; margin-bottom: 6px; font-weight: 600;
  }
  .editor-mpublish .mpublish-tip {
    font-size: 12px; color: #6b7280; margin-top: 6px;
  }
  .editor-mpublish .mpublish-actions {
    display: flex; gap: 8px;
    margin-top: 16px;
    position: sticky; bottom: 0;
    padding: 8px 0;
    background: linear-gradient(to top, #fff 70%, rgba(255,255,255,0));
  }
  .editor-mpublish .mpublish-actions button { flex: 1; height: 48px; border-radius: 12px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; }

  /* ──── Find / Replace ──── */
  .editor-mfind {
    position: fixed;
    left: 8px; right: 8px;
    bottom: calc(8px + var(--editor-keyboard-h, 0px));
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 10px 32px rgba(0,0,0,0.18);
    z-index: 28;
    padding: 8px 8px 4px;
    transition: bottom 0.15s;
  }
  .editor-mfind .mfind-row {
    display: flex; align-items: center; gap: 4px;
    margin-bottom: 4px;
  }
  .editor-mfind .mfind-input {
    flex: 1;
    height: 38px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 15px;
    padding: 0 10px;
    outline: none;
  }
  .editor-mfind .mfind-input:focus { border-color: #93c5fd; }
  .editor-mfind .mfind-count {
    font-size: 11px; color: #475569; padding: 0 4px;
    min-width: 44px; text-align: center;
  }
  .editor-mfind button {
    width: 38px; height: 38px;
    border: none; background: transparent; cursor: pointer;
    border-radius: 8px;
    color: #475569;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mfind button:active { background: #f1f5f9; }
  .editor-mfind button.active { background: #dbeafe; color: #1d4ed8; }
  .editor-mfind .mfind-options {
    display: flex; align-items: center; gap: 8px;
    padding: 0 4px 4px;
    font-size: 12px; color: #64748b;
  }
  .editor-mfind .mfind-options label {
    display: inline-flex; align-items: center; gap: 4px;
  }

  /* ──── Version History ──── */
  .editor-mversion .mversion-empty {
    padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 13px;
  }
  .editor-mversion .mversion-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid #eef2f7;
  }
  .editor-mversion .mversion-info { flex: 1; min-width: 0; }
  .editor-mversion .mversion-time {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 12px; color: #475569;
  }
  .editor-mversion .mversion-label { font-size: 13px; font-weight: 500; color: #0f172a; margin-top: 2px; }
  .editor-mversion .mversion-preview {
    font-size: 11px; color: #94a3b8;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    margin-top: 2px;
  }
  .editor-mversion .mversion-restore {
    display: inline-flex; align-items: center; gap: 4px;
    height: 36px; padding: 0 12px;
    border: 1px solid #cbd5e1; background: #fff;
    border-radius: 8px; cursor: pointer; font-size: 12px; color: #1d4ed8;
  }
  .editor-mversion .mversion-clear {
    display: inline-flex; align-items: center; gap: 4px;
    margin-top: 12px;
    padding: 8px 12px;
    border: none; background: transparent;
    color: #dc2626; cursor: pointer; font-size: 12px;
  }

  /* ──── Goal Bar ──── */
  .editor-mgoal {
    position: fixed;
    left: 14px; right: 14px;
    top: calc(54px + env(safe-area-inset-top, 0));
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(10px);
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 4px 8px 4px 12px;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.08);
    z-index: 23;
    font-size: 11px;
  }
  .editor-mgoal .mgoal-toggle {
    display: inline-flex; align-items: center; gap: 4px;
    background: transparent; border: none; cursor: pointer;
    color: #334155;
    flex-shrink: 0;
  }
  .editor-mgoal .mgoal-track {
    flex: 1;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  }
  .editor-mgoal .mgoal-fill {
    height: 100%;
    background: #94a3b8;
    transition: width 0.25s ease-out;
  }
  .editor-mgoal .mgoal-track[data-state="go"] .mgoal-fill { background: #94a3b8; }
  .editor-mgoal .mgoal-track[data-state="near"] .mgoal-fill { background: #f59e0b; }
  .editor-mgoal .mgoal-track[data-state="done"] .mgoal-fill { background: #16a34a; }
  .editor-mgoal .mgoal-popover {
    position: absolute;
    top: 38px; left: 0; right: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
  .editor-mgoal .mgoal-presets {
    display: flex; flex-wrap: wrap; gap: 6px;
    align-items: center;
  }
  .editor-mgoal .mgoal-presets button {
    height: 32px; padding: 0 12px;
    border: 1px solid #cbd5e1; background: #fff;
    color: #334155;
    border-radius: 999px;
    font-size: 12px; cursor: pointer;
  }
  .editor-mgoal .mgoal-presets button.active {
    background: #1d4ed8; color: #fff; border-color: #1d4ed8;
  }
}
`,Xr=Ms+Es+zs+Is;function Mr(e=""){return e.replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim()}function co(e="",o=150){const r=String(e).replace(/\s+/g," ").trim();if(r.length<=o)return r;const i=r.slice(0,o+1),n=Math.max(i.lastIndexOf("."),i.lastIndexOf("다."),i.lastIndexOf("?"),i.lastIndexOf("!"));return n>=40?i.slice(0,n+1).trim():`${r.slice(0,o).trim()}...`}function Ps(e=""){return String(e).trim().toLowerCase().replace(/[^\w가-힣\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)}function Er(e){if(!e)return!1;const o=new Date(e);return!Number.isNaN(o.getTime())&&o.getTime()>Date.now()}function As(e={},o="",r=6){var m;const i=Eo(e.tags);if(i.length>=r)return i.slice(0,r);const n=`${e.title||""} ${Mr(o)}`,a=new Set(["그리고","그러나","대한","관련","경우","사항","위해","통해","에서","으로","있습니다","합니다","법률","블로그","게시글","하이로","법률사무소"]),s=((m=n.match(/[가-힣A-Za-z0-9]{2,20}/g))==null?void 0:m.map(p=>p.trim()).filter(p=>!a.has(p)&&!/^\d+$/.test(p)))||[],l=new Map;s.forEach(p=>l.set(p,(l.get(p)||0)+1));const d=[...l.entries()].sort((p,f)=>f[1]-p[1]||f[0].length-p[0].length).map(([p])=>p);return[...new Set([...i,...d])].slice(0,r)}function zr(e={},o=""){var d,m,p,f,c,g,k,v;const r=Mr(o),i=co(r,140),n=co(r,155),a=As(e,o),s=e.title||"",l=s&&i?JSON.stringify([{question:`${s}에서 가장 중요한 쟁점은 무엇인가요?`,answer:i},{question:"이 글은 어떤 상황의 독자에게 도움이 되나요?",answer:co(r,220)}]):"";return{summary:(d=e.summary)!=null&&d.trim()?e.summary:i,seoDescription:(m=e.seoDescription)!=null&&m.trim()?e.seoDescription:n,seoTitle:(p=e.seoTitle)!=null&&p.trim()?e.seoTitle:s,slug:(f=e.slug)!=null&&f.trim()?e.slug:Ps(s),tags:Eo(e.tags).length?e.tags:a.join(", "),ogImageUrl:(c=e.ogImageUrl)!=null&&c.trim()?e.ogImageUrl:e.thumbnailUrl||"",geoSummary:(g=e.geoSummary)!=null&&g.trim()?e.geoSummary:co(r,220),geoFaq:(k=e.geoFaq)!=null&&k.trim()?e.geoFaq:l,geoKeywords:(v=e.geoKeywords)!=null&&v.trim()?e.geoKeywords:a.join(", ")}}function Ls(e={},o=""){const r=Mr(o),i=!!(e.summary||e.excerpt||"").trim(),n=!!(e.thumbnailUrl||e.ogImageUrl||"").trim(),a=!!(e.seoDescription||"").trim(),s=Eo(e.tags).length>0,l=e.status==="scheduled",d=[{id:"title",label:"제목",required:!0,done:!!(e.title||"").trim()},{id:"body",label:"본문",required:!0,done:r.length>0},{id:"category",label:"카테고리",required:!0,done:!!(e.blogCategory||e.category)},{id:"summary",label:"발췌/요약",required:!1,done:i},{id:"thumbnail",label:"대표 이미지",required:!1,done:n},{id:"seoDescription",label:"SEO 설명",required:!1,done:a},{id:"tags",label:"태그",required:!1,done:s}];return l&&d.splice(3,0,{id:"scheduledPublishAt",label:"미래 예약 일시",required:!0,done:Er(e.scheduledPublishAt)}),d}function ii(e={},o=""){const r=Ls(e,o),i=r.filter(l=>l.required),n=r.filter(l=>!l.required),a=i.filter(l=>l.done).length,s=n.filter(l=>l.done).length;return{checks:r,requiredDone:a,requiredTotal:i.length,recommendedDone:s,recommendedTotal:n.length,ready:a===i.length}}const Ds=xt.reduce((e,o)=>(e[o.value]=o.label,e),{});function ai({status:e,darkMode:o=!1}){const r=e.ready;return t.jsxs("span",{title:r?"필수 게시 준비 항목 완료":"필수 게시 준비 항목 미완료",style:{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 7px",border:`1px solid ${r?"#bbf7d0":"#fed7aa"}`,borderRadius:3,background:r?o?"rgba(22,101,52,0.22)":"#dcfce7":o?"rgba(194,65,12,0.2)":"#ffedd5",color:r?o?"#bbf7d0":"#166534":o?"#fed7aa":"#9a3412",fontSize:10,lineHeight:"14px",whiteSpace:"nowrap"},children:[r?t.jsx(Ln,{size:12}):t.jsx(Dn,{size:12}),"게시 준비 ",e.requiredDone,"/",e.requiredTotal]})}function _s({status:e,compact:o=!1}){return t.jsx("div",{style:{display:"grid",gap:o?6:8},children:e.checks.map(r=>t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,fontSize:o?11:12,color:"#374151"},children:[t.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:7},children:[r.done?t.jsx(Ln,{size:14,color:"#16a34a"}):t.jsx(Dn,{size:14,color:r.required?"#dc2626":"#d97706"}),r.label]}),t.jsx("span",{style:{color:r.required?"#6b7280":"#9ca3af",fontSize:10},children:r.required?"필수":"권장"})]},r.id))})}function Rs({onClick:e}){return t.jsxs("button",{type:"button",onClick:e,title:"실제 블로그 발행 화면 미리보기",style:{height:28,padding:"0 10px",border:"1px solid #cbd5e1",borderRadius:3,background:"#fff",color:"#1f2937",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,fontSize:11,fontFamily:"'Segoe UI', '맑은 고딕', sans-serif"},children:[t.jsx(Io,{size:13}),"발행 미리보기"]})}function Ns({doc:e,html:o,status:r,onClose:i,onPublish:n,publishing:a=!1}){const[s,l]=u.useState("desktop"),d=Xi(e.thumbnailUrl||e.ogImageUrl||""),m=d.replace(/["\\\n\r\f]/g,""),p=oa(o||"<p></p>"),f=Ds[e.blogCategory||e.category]||e.blogCategory||e.category||"블로그",c=e.summary||e.excerpt||"",g=e.author||"법무법인 하이로",k=(e.publishedDate||new Date().toISOString()).slice(0,10).replace(/-/g,"."),v=Eo(e.tags),y=e._blogSlug?`/blog/${e._blogSlug}`:"",h=r.ready&&!a;return t.jsx("div",{role:"dialog","aria-modal":"true","aria-label":"블로그 미리보기",style:{position:"fixed",inset:0,zIndex:1300,background:"rgba(10,22,40,0.48)",display:"flex",alignItems:"stretch",justifyContent:"center",padding:28},onClick:i,children:t.jsxs("div",{style:{width:"min(1080px, 100%)",background:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,0.28)",display:"flex",flexDirection:"column",overflow:"hidden",borderRadius:6},onClick:x=>x.stopPropagation(),children:[t.jsxs("div",{style:{height:44,flexShrink:0,display:"flex",alignItems:"center",gap:12,padding:"0 14px 0 18px",borderBottom:"1px solid #e5e7eb",background:"#f8fafc"},children:[t.jsx("strong",{style:{fontSize:13,color:"#1f2937",fontWeight:600},children:"블로그 미리보기"}),t.jsx(ai,{status:r}),t.jsx("span",{style:{fontSize:11,color:"#64748b"},children:"실제 공개 페이지에 가까운 발행 전 미리보기입니다."}),t.jsx("div",{style:{flex:1}}),t.jsx("div",{style:{display:"inline-flex",border:"1px solid #cbd5e1",borderRadius:3,overflow:"hidden"},children:[["desktop",t.jsx(ra,{size:13}),"데스크톱"],["mobile",t.jsx(na,{size:13}),"모바일"]].map(([x,w,b])=>t.jsxs("button",{type:"button",onClick:()=>l(x),title:`${b} 미리보기`,style:{height:28,padding:"0 9px",border:"none",borderRight:x==="desktop"?"1px solid #cbd5e1":"none",background:s===x?"#e0f2fe":"#fff",color:s===x?"#075985":"#475569",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,fontSize:11},children:[w,b]},x))}),y&&t.jsxs("button",{type:"button",onClick:()=>window.open(y,"_blank","noopener,noreferrer"),title:"공개 글 새 탭에서 보기",style:{height:28,padding:"0 10px",border:"1px solid #cbd5e1",borderRadius:3,background:"#fff",color:"#334155",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,fontSize:11},children:[t.jsx(An,{size:13}),"공개 글"]}),t.jsxs("button",{type:"button",onClick:n,disabled:!h,title:r.ready?"이 내용으로 블로그 게시글 발행":"필수 항목을 먼저 입력해 주세요",style:{height:28,padding:"0 10px",border:"1px solid #60a5fa",borderRadius:3,background:h?"#2563eb":"#dbeafe",color:h?"#fff":"#64748b",cursor:h?"pointer":"default",display:"inline-flex",alignItems:"center",gap:6,fontSize:11},children:[a?t.jsx(mt,{size:13}):t.jsx(Kt,{size:13}),a?"처리 중":"발행"]}),t.jsx("button",{type:"button",onClick:i,title:"닫기",style:{border:"none",background:"transparent",cursor:"pointer",color:"#64748b",padding:6},children:t.jsx(et,{size:18})})]}),t.jsx("div",{style:{overflow:"auto",background:s==="mobile"?"#e5e7eb":"#fff",display:"flex",justifyContent:"center"},children:t.jsxs("div",{style:{width:s==="mobile"?390:"100%",maxWidth:"100%",background:"#fff",minHeight:"100%"},children:[t.jsx("section",{style:{minHeight:s==="mobile"?280:320,padding:s==="mobile"?"56px 20px 46px":"82px 24px 68px",display:"flex",alignItems:"center",justifyContent:"center",background:d?`linear-gradient(rgba(10,22,40,0.78), rgba(10,22,40,0.92)), url("${m}") center/cover`:"linear-gradient(135deg, #0a1628 0%, #0f1d32 50%, #0a1628 100%)"},children:t.jsxs("div",{style:{maxWidth:800,textAlign:"center"},children:[t.jsx("div",{style:{marginBottom:24},children:t.jsx("span",{style:{display:"inline-block",padding:"5px 18px",fontSize:11,background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.3)",borderRadius:2,letterSpacing:"0.12em",fontWeight:500},children:f})}),t.jsx("h1",{style:{fontFamily:"'Noto Serif KR', 'Nanum Myeongjo', serif",fontSize:"clamp(1.6rem, 3.6vw, 2.6rem)",fontWeight:500,color:"#fff",lineHeight:1.5,margin:"0 0 28px",wordBreak:"keep-all"},children:e.title||"제목 없음"}),c&&t.jsx("p",{style:{fontSize:15,color:"rgba(255,255,255,0.72)",lineHeight:1.9,fontWeight:300,maxWidth:640,margin:"0 auto 30px",wordBreak:"keep-all"},children:c}),t.jsxs("div",{style:{display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap",fontSize:13,color:"rgba(255,255,255,0.55)"},children:[t.jsx("span",{children:g}),t.jsx("span",{children:k}),t.jsx("span",{children:"조회 0"})]}),v.length>0&&t.jsx("div",{style:{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",marginTop:18},children:v.map(x=>t.jsxs("span",{style:{fontSize:12,color:"rgba(255,255,255,0.64)",border:"1px solid rgba(255,255,255,0.22)",padding:"4px 9px",borderRadius:999},children:["#",x]},x))})]})}),t.jsx("section",{style:{padding:s==="mobile"?"24px 18px 56px":"32px 24px 80px"},children:t.jsx("article",{className:"editor-blog-preview-prose",style:{maxWidth:720,margin:"0 auto",fontSize:17,lineHeight:1.9,color:"#2a2a2a",wordBreak:"keep-all"},dangerouslySetInnerHTML:{__html:p}})})]})}),t.jsx("style",{children:`
          .editor-blog-preview-prose p { margin: 0 0 1.25em; }
          .editor-blog-preview-prose h1,
          .editor-blog-preview-prose h2,
          .editor-blog-preview-prose h3 {
            font-family: 'Noto Serif KR', 'Nanum Myeongjo', serif;
            color: #111827;
            line-height: 1.45;
            font-weight: 600;
            margin: 2.1em 0 0.8em;
          }
          .editor-blog-preview-prose h1 { font-size: 1.75em; }
          .editor-blog-preview-prose h2 { font-size: 1.45em; }
          .editor-blog-preview-prose h3 { font-size: 1.18em; }
          .editor-blog-preview-prose ul,
          .editor-blog-preview-prose ol { margin: 0 0 1.4em 1.4em; padding: 0; }
          .editor-blog-preview-prose li { margin: 0.35em 0; }
          .editor-blog-preview-prose blockquote {
            margin: 1.8em 0;
            padding: 0.9em 1.2em;
            border-left: 3px solid #b08d57;
            background: #faf9f7;
            color: #4b5563;
          }
          .editor-blog-preview-prose img { max-width: 100%; height: auto; display: block; margin: 1.8em auto; }
          .editor-blog-preview-prose table { width: 100%; border-collapse: collapse; margin: 1.8em 0; font-size: 0.92em; }
          .editor-blog-preview-prose th,
          .editor-blog-preview-prose td { border: 1px solid #e5e7eb; padding: 10px 12px; vertical-align: top; }
          .editor-blog-preview-prose th { background: #f8fafc; font-weight: 600; }
          .editor-blog-preview-prose a { color: #9a6b27; text-decoration: underline; text-underline-offset: 3px; }
        `})]})})}function Fs({doc:e,setDoc:o,open:r,onClose:i,editorHtml:n=""}){if(!r)return null;const a=e.documentType==="blog",s=a?ii(e,n):null,l={width:"100%",padding:"6px 8px",border:"1px solid #d5d0ca",borderRadius:3,fontSize:13,boxSizing:"border-box",background:"#fff",color:"#333"},d={padding:"0 0 16px",marginBottom:16,borderBottom:"1px solid #e5e1dc"},m={fontSize:12,fontWeight:600,color:"#374151",marginBottom:12},p=(c,g,k)=>t.jsxs("div",{style:{marginBottom:12},children:[t.jsx("label",{style:{display:"block",fontSize:11,color:"#888",marginBottom:4},children:c}),k==="textarea"?t.jsx("textarea",{value:e[g]||"",onChange:v=>o(y=>({...y,[g]:v.target.value})),rows:3,style:{...l,resize:"vertical",fontFamily:"inherit"}}):t.jsx("input",{type:k||"text",value:e[g]||"",onChange:v=>o(y=>({...y,[g]:v.target.value})),style:l})]}),f=(c,g,k,v)=>t.jsxs("div",{style:{marginBottom:12},children:[t.jsx("label",{style:{display:"block",fontSize:11,color:"#888",marginBottom:4},children:c}),t.jsx("select",{value:g,onChange:k,style:l,children:v})]});return t.jsxs("div",{style:{position:"fixed",top:0,right:0,width:340,height:"100vh",background:"#f8f6f3",borderLeft:"1px solid #d5d0ca",zIndex:1e3,overflowY:"auto",padding:"20px 16px",boxShadow:"-4px 0 16px rgba(0,0,0,0.08)",boxSizing:"border-box"},children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20},children:[t.jsx("span",{style:{fontSize:15,fontWeight:600},children:"문서 속성"}),t.jsx("button",{type:"button",onClick:i,style:{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#999"},children:"✕"})]}),t.jsxs("div",{style:d,children:[t.jsx("div",{style:m,children:"문서 정보"}),f("문서 유형",e.documentType||"article",c=>o(g=>({...g,documentType:c.target.value})),ur.map(c=>t.jsx("option",{value:c.value,children:c.label},c.value))),p("부제","subtitle"),p("저자","author"),p("출처","source"),p("요약","summary","textarea")]}),a&&t.jsxs("div",{style:d,children:[t.jsxs("div",{style:{...m,display:"flex",justifyContent:"space-between",alignItems:"center"},children:[t.jsx("span",{children:"게시 준비"}),t.jsxs("span",{style:{fontSize:10,color:s.ready?"#166534":"#9a3412",background:s.ready?"#dcfce7":"#ffedd5",border:`1px solid ${s.ready?"#bbf7d0":"#fed7aa"}`,padding:"2px 6px",borderRadius:3},children:["필수 ",s.requiredDone,"/",s.requiredTotal]})]}),t.jsx(_s,{status:s})]}),a&&t.jsxs("div",{style:d,children:[t.jsxs("div",{style:{...m,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10},children:[t.jsx("span",{children:"블로그 SEO/GEO"}),t.jsx("button",{type:"button",onClick:()=>o(c=>({...c,...zr(c,n)})),style:{border:"1px solid #bfdbfe",background:"#eff6ff",color:"#1d4ed8",borderRadius:3,padding:"4px 7px",fontSize:11,cursor:"pointer"},children:"자동 채우기"})]}),p("URL 슬러그","slug"),p("태그","tags"),p("SEO 제목","seoTitle"),p("SEO 설명","seoDescription","textarea"),p("Canonical URL","canonicalUrl"),p("대표 이미지 URL","thumbnailUrl"),p("OG 이미지 URL","ogImageUrl"),p("GEO 핵심 요약","geoSummary","textarea"),p("GEO FAQ JSON","geoFaq","textarea"),p("GEO 키워드","geoKeywords")]}),t.jsxs("div",{style:{...d,borderBottom:"none",marginBottom:0},children:[t.jsx("div",{style:m,children:"발행 설정"}),f("상태",e.status||"draft",c=>o(g=>({...g,status:c.target.value})),t.jsxs(t.Fragment,{children:[t.jsx("option",{value:"draft",children:"초안"}),t.jsx("option",{value:"published",children:"발행"}),t.jsx("option",{value:"scheduled",children:"예약"}),t.jsx("option",{value:"archived",children:"보관"})]})),p("발행일","publishedDate","date"),a&&p("예약 발행 일시","scheduledPublishAt","datetime-local"),a&&f("블로그 카테고리",e.blogCategory||"construction_realestate",c=>o(g=>({...g,blogCategory:c.target.value})),xt.map(c=>t.jsx("option",{value:c.value,children:c.label},c.value))),t.jsxs("div",{style:{marginBottom:12},children:[t.jsx("label",{style:{display:"block",fontSize:11,color:"#888",marginBottom:4},children:"중요도 (1~5)"}),t.jsx("input",{type:"number",min:1,max:5,value:e.importance||3,onChange:c=>o(g=>({...g,importance:parseInt(c.target.value)||3})),style:{...l,width:60}})]})]})]})}const Yo=ur.reduce((e,o)=>(e[o.value]=o.label,e),{}),Os=xt.reduce((e,o)=>(e[o.value]=o.label,e),{});function Yr({label:e,meta:o}){return t.jsx("span",{style:{flexShrink:0,maxWidth:48,padding:"1px 4px",border:`1px solid ${o.border}`,borderRadius:3,background:o.background,color:o.color,fontSize:9,lineHeight:"13px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},title:e,children:e})}function Bs({documents:e,onSelect:o,currentId:r,onNew:i,onNewBlog:n,onDelete:a,search:s,setSearch:l,collapsed:d,setCollapsed:m}){const[p,f]=u.useState({}),[c,g]=u.useState("all"),k=w=>f(b=>({...b,[w]:!b[w]})),v=u.useMemo(()=>{const w=c==="blog"?e.filter(b=>b._source==="blog"||b.documentType==="blog"):c==="document"?e.filter(b=>!(b._source==="blog"||b.documentType==="blog")):e;return s?w.filter(b=>(b.title||"").toLowerCase().includes(s.toLowerCase())):w},[e,c,s]),y=u.useMemo(()=>{const w=[],b=v.filter(L=>L._source==="blog"||L.documentType==="blog");if(b.length>0){const L=xt.map(S=>{const R=b.filter(j=>(j.blogCategory||j._blogCategory||"construction_realestate")===S.value).sort((j,M)=>(j.title||"").localeCompare(M.title||""));return{key:`blog_${S.value}`,label:S.label,count:R.length,docs:R}}).filter(S=>S.docs.length>0),C=b.filter(S=>!Os[S.blogCategory||S._blogCategory]).sort((S,R)=>(S.title||"").localeCompare(R.title||""));C.length>0&&L.push({key:"blog_uncategorized",label:"기타",count:C.length,docs:C}),w.push({key:"blog",label:`${Or.blog}_${Yo.blog||"블로그"}`,count:b.length,children:L})}const I={};for(const L of v){if(L._source==="blog"||L.documentType==="blog")continue;const C=L.documentType||"article";I[C]||(I[C]=[]),I[C].push(L)}const P=["news","statute","case_law","paper","textbook","book"],A=[...P,...ur.map(L=>L.value).filter(L=>!P.includes(L))];for(const L of A){const C=I[L];if(!C||C.length===0)continue;const S=Or[L]||"900",R=Yo[L]||L,M=[...C].sort((N,E)=>(N.title||"").localeCompare(E.title||"")).map((N,E)=>({...N,_num:`${S}.${String(E+1).padStart(3,"0")}`}));w.push({key:L,label:`${S}_${R}`,docs:M,count:C.length})}return w},[v]),h=w=>{const b=w._source==="blog"||w.documentType==="blog"?"blog":"document",I=Hr[b]||Hr.document,P=Br[w.status||"draft"]||Br.draft,A=Yo[w.documentType]||w.documentType||"문서",L=b==="blog"?I.label:A;return t.jsxs("div",{onClick:C=>{C.stopPropagation(),o(w.id)},style:{display:"flex",alignItems:"center",gap:5,padding:"3px 8px 3px 14px",cursor:"pointer",background:w.id===r?"rgba(59,130,246,0.08)":"transparent"},onMouseEnter:C=>{w.id!==r&&(C.currentTarget.style.background="rgba(0,0,0,0.03)")},onMouseLeave:C=>{w.id!==r&&(C.currentTarget.style.background=w.id===r?"rgba(59,130,246,0.08)":"transparent")},children:[t.jsx("span",{style:{fontSize:11,opacity:.4,flexShrink:0},children:"▪"}),t.jsx("span",{style:{flex:1,minWidth:0,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:w.id===r?"#1e293b":"#4b5563",fontWeight:w.id===r?500:400},children:(w.title||"(제목 없음)").replace("[세계사] ","")}),t.jsx(Yr,{label:L,meta:I}),t.jsx(Yr,{label:P.label,meta:P}),b==="blog"&&t.jsx("button",{type:"button",title:"게시글 삭제",onClick:C=>{C.stopPropagation();const S=w.title||"제목 없음";window.confirm(`블로그 게시글 "${S}"을 삭제할까요? 삭제 후 복구할 수 없습니다.`)&&(a==null||a(w))},style:{width:22,height:22,border:"1px solid transparent",borderRadius:3,background:"transparent",color:"#94a3b8",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0},onMouseEnter:C=>{C.currentTarget.style.color="#dc2626",C.currentTarget.style.background="#fee2e2"},onMouseLeave:C=>{C.currentTarget.style.color="#94a3b8",C.currentTarget.style.background="transparent"},children:t.jsx(Ve,{size:13})})]},w.id)},x=(w,b,I,P,A)=>{const L=p[b]!==void 0?p[b]:P<2;return t.jsxs("div",{children:[t.jsxs("div",{onClick:()=>k(b),style:{display:"flex",alignItems:"center",gap:4,padding:`3px 8px 3px ${8+P*14}px`,cursor:"pointer",userSelect:"none"},onMouseEnter:C=>C.currentTarget.style.background="rgba(0,0,0,0.04)",onMouseLeave:C=>C.currentTarget.style.background="transparent",children:[t.jsx("span",{style:{fontSize:9,color:"#9ca3af",width:10,flexShrink:0,transition:"transform 0.12s",transform:L?"rotate(90deg)":"rotate(0)"},children:"▶"}),t.jsx("span",{style:{flex:1,fontSize:12,color:"#374151",fontWeight:P===0?500:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:w})]}),L&&t.jsx("div",{children:A})]},b)};return d?t.jsx("div",{style:{width:36,flexShrink:0,background:"#eae6e1",borderRight:"1px solid #d5d0ca",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:10},children:t.jsx("button",{onClick:()=>m(!1),title:"탐색기 열기",style:{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#888",padding:4},children:"▶"})}):t.jsxs("div",{style:{width:270,flexShrink:0,background:"#eae6e1",borderRight:"1px solid #d5d0ca",display:"flex",flexDirection:"column",overflow:"hidden"},children:[t.jsxs("div",{style:{padding:"6px 8px",borderBottom:"1px solid #d5d0ca",flexShrink:0,display:"flex",alignItems:"center",gap:6},children:[t.jsxs("button",{onClick:i,title:"새 문서 만들기",style:{height:28,padding:"0 10px",border:"1px solid #b8b0a7",borderRadius:3,background:"#f8f6f3",cursor:"pointer",fontSize:12,color:"#374151",display:"inline-flex",alignItems:"center",gap:5,fontWeight:600},children:[t.jsx("span",{style:{fontSize:14,lineHeight:1},children:"+"}),"새 문서"]}),t.jsx("button",{onClick:n,title:"블로그 글쓰기",style:{height:28,padding:"0 9px",border:"1px solid #93c5fd",borderRadius:3,background:"#dbeafe",cursor:"pointer",fontSize:12,color:"#1d4ed8",display:"inline-flex",alignItems:"center",gap:5,fontWeight:600},children:"블로그"}),t.jsx("div",{style:{flex:1}}),t.jsx("button",{onClick:()=>m(!0),title:"접기",style:{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#666",padding:"0 2px"},children:"◀"})]}),t.jsx("div",{style:{padding:"6px 8px 4px",borderBottom:"1px solid #d5d0ca",flexShrink:0,display:"flex",gap:4},children:[["all","전체"],["blog","블로그"],["document","문서"]].map(([w,b])=>t.jsx("button",{type:"button",onClick:()=>g(w),style:{height:24,flex:1,border:`1px solid ${c===w?"#93c5fd":"#c5c0ba"}`,borderRadius:3,background:c===w?"#dbeafe":"#f5f2ee",color:c===w?"#1d4ed8":"#475569",cursor:"pointer",fontSize:11,fontWeight:c===w?600:400},children:b},w))}),t.jsx("div",{style:{padding:"4px 8px 6px",borderBottom:"1px solid #d5d0ca",flexShrink:0},children:t.jsx("input",{type:"text",placeholder:"검색...",value:s,onChange:w=>l(w.target.value),style:{width:"100%",padding:"4px 6px",fontSize:11,border:"1px solid #c5c0ba",borderRadius:3,outline:"none",background:"#f5f2ee",color:"#333",boxSizing:"border-box"}})}),t.jsxs("div",{style:{flex:1,overflowY:"auto",padding:"2px 0"},children:[v.length===0&&t.jsx("p",{style:{color:"#999",fontSize:11,padding:"12px 10px"},children:"문서가 없습니다."}),y.map(w=>x(w.label,w.key,w.count,0,t.jsxs(t.Fragment,{children:[w.children&&w.children.map(b=>x(b.label,`${w.key}_${b.label}`,b.count,1,t.jsxs(t.Fragment,{children:[b.docs&&b.docs.map(h),b.children&&b.children.map(I=>x(I.label,`${w.key}_${b.label}_${I.label}`,I.count,2,t.jsx(t.Fragment,{children:I.docs.map(h)})))]}))),w.docs&&w.docs.map(h)]})))]}),t.jsxs("div",{style:{padding:"5px 10px",borderTop:"1px solid #d5d0ca",fontSize:10,color:"#999",flexShrink:0},children:[v.length,"개 문서"]})]})}const Ae="'Segoe UI', '맑은 고딕', sans-serif",se={hover:"#E5F1FB",active:"#CCE4F7",pressed:"#B3D7F2",activeBorder:"#98C6EA"};function X({children:e,active:o,onClick:r,title:i,"aria-label":n,style:a,small:s,disabled:l,className:d,onKeyDown:m,...p}){const[f,c]=u.useState(!1),[g,k]=u.useState(!1),v=()=>o?se.active:g?se.pressed:f&&!l?se.hover:"transparent",y=()=>o?`1px solid ${se.activeBorder}`:g?`1px solid ${se.activeBorder}`:"1px solid transparent";return t.jsx("button",{type:"button",className:`word-ribbon-btn${o?" active":""}${d?" "+d:""}`,onMouseDown:h=>{h.preventDefault(),l||(k(!0),r==null||r())},onKeyDown:h=>{m==null||m(h),!h.defaultPrevented&&(h.key==="Enter"||h.key===" ")&&(h.preventDefault(),l||r==null||r(h))},onMouseUp:()=>k(!1),onMouseEnter:()=>c(!0),onMouseLeave:()=>{c(!1),k(!1)},title:i||"","aria-label":n||i,disabled:l,...p,style:{height:s?28:32,minWidth:s?28:32,padding:s?"0 6px":"0 8px",background:v(),color:l?"#aaa":"var(--ribbon-fg, #333)",border:y(),borderRadius:4,fontSize:s?13:14,cursor:l?"default":"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:3,fontFamily:Ae,lineHeight:1,position:"relative",opacity:l?.45:1,transition:"background 0.06s, border-color 0.06s",outline:"none",...a},children:e})}function Hs({icon:e,label:o,onClick:r,title:i,"aria-label":n,active:a,split:s,onDropdown:l,disabled:d}){const[m,p]=u.useState(!1),[f,c]=u.useState(!1),[g,k]=u.useState(!1),v=!!s,y=()=>a?se.active:v&&m||!v&&g?se.hover:"transparent",h=()=>a?se.active:f?se.hover:"transparent",x=()=>a?`1px solid ${se.activeBorder}`:v&&(m||f)?`1px solid ${se.activeBorder}`:!v&&g?`1px solid ${se.activeBorder}`:"1px solid transparent",w=()=>m||f||a?`1px solid ${se.activeBorder}`:"1px solid transparent";return v?t.jsxs("div",{style:{display:"flex",flexDirection:"column",border:x(),borderRadius:2,overflow:"hidden",transition:"border-color 0.06s"},children:[t.jsxs("button",{type:"button",className:"word-ribbon-btn",onMouseDown:b=>{b.preventDefault(),d||r==null||r()},onKeyDown:b=>{(b.key==="Enter"||b.key===" ")&&(b.preventDefault(),d||r==null||r(b))},onMouseEnter:()=>p(!0),onMouseLeave:()=>p(!1),title:i||o,"aria-label":n||i||o,disabled:d,style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:54,minWidth:60,padding:"6px 8px 4px",background:y(),border:"none",borderBottom:w(),cursor:d?"default":"pointer",color:d?"#aaa":"var(--ribbon-fg, #333)",opacity:d?.45:1,fontFamily:Ae,outline:"none",transition:"background 0.06s"},children:[t.jsx("span",{style:{display:"flex",alignItems:"center",justifyContent:"center",width:24,height:24,flexShrink:0},children:e}),t.jsx("span",{style:{fontSize:12,marginTop:4,lineHeight:1.2,whiteSpace:"nowrap",textAlign:"center",fontWeight:500},children:o})]}),t.jsx("button",{type:"button",className:"word-ribbon-btn",onMouseDown:b=>{b.preventDefault(),d||l==null||l()},onKeyDown:b=>{(b.key==="Enter"||b.key===" ")&&(b.preventDefault(),d||l==null||l(b))},onMouseEnter:()=>c(!0),onMouseLeave:()=>c(!1),title:`${o} 옵션`,"aria-label":`${o} 옵션`,disabled:d,style:{height:24,minWidth:60,border:"none",background:h(),cursor:d?"default":"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ribbon-fg, #555)",outline:"none",transition:"background 0.06s",padding:0},children:t.jsx(_n,{size:12,strokeWidth:2})})]}):t.jsxs("button",{type:"button",className:"word-ribbon-btn",onMouseDown:b=>{b.preventDefault(),d||r==null||r()},onKeyDown:b=>{(b.key==="Enter"||b.key===" ")&&(b.preventDefault(),d||r==null||r(b))},onMouseEnter:()=>k(!0),onMouseLeave:()=>k(!1),title:i||o,"aria-label":n||i||o,disabled:d,style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:78,minWidth:60,padding:"6px 8px 4px",background:y(),border:x(),borderRadius:2,cursor:d?"default":"pointer",color:d?"#aaa":"var(--ribbon-fg, #333)",opacity:d?.45:1,fontFamily:Ae,outline:"none",transition:"background 0.06s, border-color 0.06s"},children:[t.jsx("span",{style:{display:"flex",alignItems:"center",justifyContent:"center",width:26,height:26,flexShrink:0},children:e}),t.jsx("span",{style:{fontSize:12,marginTop:5,lineHeight:1.2,whiteSpace:"nowrap",textAlign:"center",fontWeight:500},children:o})]})}function Nt(){return t.jsx("div",{style:{width:1,alignSelf:"stretch",background:"var(--ribbon-sep, #d1d5db)",margin:"2px 4px",flexShrink:0}})}function bt({label:e,children:o,dialogLauncher:r}){const[i,n]=u.useState(!1);return t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",position:"relative",padding:"3px 6px 0"},children:[t.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",gap:2,alignItems:"flex-start",justifyContent:"flex-start"},children:o}),t.jsxs("div",{style:{fontSize:12,color:"var(--ribbon-label, #555)",marginTop:4,paddingBottom:4,fontFamily:Ae,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4,lineHeight:1,fontWeight:500},children:[e,r&&t.jsx("button",{type:"button",onClick:r,title:`${e} 대화 상자`,"aria-label":`${e} 대화 상자 열기`,onMouseEnter:()=>n(!0),onMouseLeave:()=>n(!1),style:{width:11,height:11,border:"1px solid transparent",background:i?se.hover:"transparent",borderColor:i?se.activeBorder:"transparent",cursor:"pointer",fontSize:7,color:"var(--ribbon-label, #777)",padding:0,display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:1,transition:"background 0.06s, border-color 0.06s",outline:"none",lineHeight:1},children:"↘"})]})]})}function Le({trigger:e,children:o,align:r="left",width:i}){const[n,a]=u.useState(!1),s=u.useRef(null),l=m=>{var p;(p=m==null?void 0:m.preventDefault)==null||p.call(m),a(f=>!f)};u.useEffect(()=>{if(!n)return;const m=f=>{s.current&&!s.current.contains(f.target)&&a(!1)},p=f=>{f.key==="Escape"&&a(!1)};return document.addEventListener("mousedown",m),document.addEventListener("keydown",p),()=>{document.removeEventListener("mousedown",m),document.removeEventListener("keydown",p)}},[n]);const d=u.isValidElement(e)?u.cloneElement(e,{...e.type==="div"?{role:"button",tabIndex:e.props.tabIndex??0}:{},onClick:m=>{var p,f;(f=(p=e.props).onClick)==null||f.call(p,m),m!=null&&m.defaultPrevented||l(m)},onKeyDown:m=>{var p,f,c,g;(f=(p=e.props).onKeyDown)==null||f.call(p,m),!m.defaultPrevented&&((m.key==="Enter"||m.key===" ")&&((g=(c=e.props).onClick)==null||g.call(c,m),m.defaultPrevented||l(m)),m.key==="Escape"&&a(!1))},"aria-haspopup":"menu","aria-expanded":n,"aria-label":e.props["aria-label"]||e.props.title||"옵션 메뉴"}):e;return t.jsxs("div",{ref:s,style:{position:"relative",display:"inline-flex"},children:[t.jsx("div",{style:{display:"inline-flex",cursor:"pointer"},children:d}),n&&t.jsx("div",{className:"word-dropdown-menu",role:"menu",style:{position:"absolute",top:"100%",[r==="right"?"right":"left"]:0,zIndex:200,marginTop:2,opacity:1,transform:"translateY(0)",animation:"ribbonDropdownIn 0.1s ease-out",...i?{width:i,minWidth:i}:{}},onClick:m=>{m.target.closest(".word-dropdown-item")&&a(!1)},onKeyDown:m=>{if(m.key==="Escape"){m.preventDefault(),a(!1);return}if(m.key!=="Enter"&&m.key!==" ")return;const p=m.target.closest(".word-dropdown-item");p&&(m.preventDefault(),p.dispatchEvent(new MouseEvent("mousedown",{bubbles:!0,cancelable:!0})),p.click(),a(!1))},children:o})]})}const $s=["#FFFFFF","#000000","#E7E6E6","#44546A","#4472C4","#ED7D31","#A5A5A5","#FFC000","#5B9BD5","#70AD47"],Us=[["#F2F2F2","#7F7F7F","#D0CECE","#D6DCE4","#D9E2F3","#FBE5D6","#EDEDED","#FFF2CC","#DEEBF7","#E2EFDA"],["#D9D9D9","#595959","#AEAAAA","#ADB9CA","#B4C7E7","#F8CBAD","#DBDBDB","#FFE599","#BDD7EE","#C5E0B4"],["#BFBFBF","#3F3F3F","#757171","#8497B0","#8FAADC","#F4B183","#C0C0C0","#FFD966","#9CC3E5","#A9D18E"],["#A6A6A6","#262626","#3A3838","#333F50","#2F5597","#C55A11","#7B7B7B","#BF9000","#2E75B6","#548235"],["#808080","#0D0D0D","#171616","#222B35","#1F3864","#833C0B","#525252","#7F6000","#1F4E79","#375623"]];function de(e){const o=document.createElement("div");o.textContent=e,o.style.cssText="position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 24px;border-radius:6px;z-index:99999;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.2);transition:opacity 0.3s;",document.body.appendChild(o),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>o.remove(),$a)},Ua)}function ar({colors:e,value:o,onChange:r,columns:i=10,recentColors:n=[],showNoColor:a,showMoreColors:s,noColorLabel:l="색 없음",moreColorsLabel:d="다른 색..."}){const[m,p]=u.useState(null),f=(k,v)=>{const y=(o==null?void 0:o.toLowerCase())===k.toLowerCase(),h=m===v;return t.jsx("button",{type:"button",onClick:()=>r(k),title:k,onMouseEnter:()=>p(v),onMouseLeave:()=>p(null),style:{width:17,height:17,background:k,border:y?"2px solid #333":h?"2px solid #666":"1px solid #d0d0d0",borderRadius:1,cursor:"pointer",padding:0,transform:h?"scale(1.3)":"scale(1)",transition:"transform 0.06s ease, border 0.06s",zIndex:h?2:1,position:"relative",boxShadow:y?"0 0 0 1px #fff inset":"none",outline:"none"}},v)},c=()=>a?t.jsxs("button",{type:"button",onClick:()=>r(null),style:{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"5px 8px",border:"none",background:"transparent",cursor:"pointer",fontSize:11,fontFamily:Ae,color:"#333",borderBottom:"1px solid #e8e8e8",marginBottom:4,transition:"background 0.06s"},onMouseEnter:k=>{k.currentTarget.style.background=se.hover},onMouseLeave:k=>{k.currentTarget.style.background="transparent"},children:[t.jsx("span",{style:{width:14,height:14,border:"1px solid #ccc",background:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#cc0000",borderRadius:1},children:"✕"}),l]}):null,g=()=>s?t.jsxs("button",{type:"button",onClick:()=>{const k=window.prompt("색상 코드 입력 (예: #FF5500):");k&&/^#[0-9A-Fa-f]{3,8}$/.test(k.trim())?r(k.trim()):k&&de("유효하지 않은 색상 코드입니다. (예: #FF5500)")},style:{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"5px 8px",border:"none",background:"transparent",cursor:"pointer",fontSize:11,fontFamily:Ae,color:"#333",borderTop:"1px solid #e8e8e8",marginTop:4,transition:"background 0.06s"},onMouseEnter:k=>{k.currentTarget.style.background=se.hover},onMouseLeave:k=>{k.currentTarget.style.background="transparent"},children:[t.jsx("span",{style:{width:14,height:14,borderRadius:7,background:"conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",display:"inline-block"}}),d]}):null;return t.jsxs("div",{style:{padding:4},children:[c(),t.jsxs("div",{style:{marginBottom:2},children:[t.jsx("div",{style:{fontSize:10,color:"#666",marginBottom:3,fontFamily:Ae},children:"테마 색"}),t.jsx("div",{style:{display:"grid",gridTemplateColumns:`repeat(${i}, 17px)`,gap:2},children:$s.slice(0,i).map((k,v)=>f(k,`theme-${v}`))})]}),t.jsx("div",{style:{marginBottom:4},children:Us.map((k,v)=>t.jsx("div",{style:{display:"grid",gridTemplateColumns:`repeat(${i}, 17px)`,gap:2,marginTop:v===0?2:0},children:k.slice(0,i).map((y,h)=>f(y,`tint-${v}-${h}`))},`tint-row-${v}`))}),t.jsxs("div",{style:{marginBottom:2},children:[t.jsx("div",{style:{fontSize:10,color:"#666",marginBottom:3,marginTop:4,fontFamily:Ae},children:"표준 색"}),t.jsx("div",{style:{display:"grid",gridTemplateColumns:`repeat(${i}, 17px)`,gap:2},children:e.slice(0,i).map((k,v)=>f(k,`std-${v}`))})]}),e.length>i&&t.jsx("div",{style:{display:"grid",gridTemplateColumns:`repeat(${i}, 17px)`,gap:2,marginTop:2},children:e.slice(i).map((k,v)=>f(k,`pal-${v}`))}),n.length>0&&t.jsxs("div",{style:{marginTop:6},children:[t.jsx("div",{style:{fontSize:10,color:"#666",marginBottom:3,fontFamily:Ae},children:"최근에 사용한 색"}),t.jsx("div",{style:{display:"grid",gridTemplateColumns:`repeat(${i}, 17px)`,gap:2},children:n.slice(0,i).map((k,v)=>f(k,`recent-${v}`))})]}),g()]})}const Ws=["p","br","span","div","strong","b","em","i","u","s","h1","h2","h3","h4","h5","h6","ul","ol","li","blockquote","code","pre","table","thead","tbody","tr","td","th","a","img","sup","sub","hr"],Gs=["href","title","src","alt","colspan","rowspan"],Vs=/^(?:(?:https?|mailto|tel):|data:image\/(?:png|gif|jpe?g|webp);base64,|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;function qs(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function si(e){return qs(e).replace(/\r\n?/g,`
`).replace(/\n/g,"<br>")}function li(e){const o=fr.sanitize(e||"",{ALLOWED_TAGS:Ws,ALLOWED_ATTR:Gs,FORBID_ATTR:["style","class","id","on*"],ALLOW_DATA_ATTR:!1,ALLOW_UNKNOWN_PROTOCOLS:!1,ALLOWED_URI_REGEXP:Vs,KEEP_CONTENT:!0});return Ks(o)}function Ks(e){if(!e||typeof document>"u")return e||"";const o=document.createElement("template");return o.innerHTML=e,o.content.querySelectorAll("span").forEach(r=>{r.attributes.length>0||r.replaceWith(...r.childNodes)}),o.content.querySelectorAll("a").forEach(r=>{const i=r.getAttribute("href");if(!i){r.replaceWith(...r.childNodes);return}/^https?:/i.test(i)&&(r.setAttribute("target","_blank"),r.setAttribute("rel","noopener noreferrer"))}),o.innerHTML.trim()}const uo=11,Xs=["bold","italic","underline","strike","subscript","superscript"];function Ys(e){const o={};Xs.forEach(i=>{e.isActive(i)&&(o[i]=!0)}),e.isActive("highlight")&&(o.highlight=e.getAttributes("highlight").color||"#fef3b5");const r=e.getAttributes("textStyle");return r.color&&(o.color=r.color),r.fontSize&&(o.fontSize=r.fontSize),r.fontFamily&&(o.fontFamily=r.fontFamily),o}function Js(e,o){let r=e.chain().focus().unsetAllMarks();o.bold&&(r=r.setBold()),o.italic&&(r=r.setItalic()),o.underline&&(r=r.setUnderline()),o.strike&&(r=r.setStrike()),o.subscript&&(r=r.setSubscript()),o.superscript&&(r=r.setSuperscript()),o.highlight&&(r=r.setHighlight({color:o.highlight})),o.color&&(r=r.setColor(o.color)),o.fontSize&&(r=r.setFontSize(o.fontSize)),o.fontFamily&&(r=r.setFontFamily(o.fontFamily)),r.run()}function Zs({editor:e}){const[o,r]=u.useState(!1),i=u.useRef(null),n=()=>{if(e){if(o){r(!1),i.current=null;return}i.current=Ys(e),r(!0)}};u.useEffect(()=>{if(!e||!o)return;const m=()=>{const f=i.current;!f||e.state.selection.empty||(Js(e,f),r(!1),i.current=null)},p=e.view.dom;return p.addEventListener("mouseup",m),()=>p.removeEventListener("mouseup",m)},[e,o]);const a=()=>{const m=e.state.selection;if(m.empty)return;const p=e.state.doc.textBetween(m.from,m.to,`
`);navigator.clipboard.writeText(p).then(()=>{e.chain().focus().deleteSelection().run()}).catch(()=>document.execCommand("cut"))},s=()=>{const m=e.state.selection;if(m.empty)return;const p=e.state.doc.textBetween(m.from,m.to,`
`);navigator.clipboard.writeText(p).catch(()=>document.execCommand("copy"))},l=()=>{navigator.clipboard.readText().then(m=>e.chain().focus().insertContent(si(m)).run()).catch(()=>{})},d=()=>{if(!e)return;const m=li(e.getHTML());e.commands.setContent(m||"<p></p>")};return t.jsx(bt,{label:"클립보드",children:t.jsxs("div",{style:{display:"flex",gap:2,alignItems:"flex-start"},children:[t.jsx(Hs,{icon:t.jsx(yo,{size:18}),label:"붙여넣기",onClick:l,title:"붙여넣기 (Ctrl+V)",split:!0,onDropdown:l}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[t.jsxs(X,{onClick:a,title:"잘라내기 (Ctrl+X)",small:!0,children:[t.jsx(gr,{size:uo})," ",t.jsx("span",{style:{fontSize:10},children:"잘라내기"})]}),t.jsxs(X,{onClick:s,title:"복사 (Ctrl+C)",small:!0,children:[t.jsx(mr,{size:uo})," ",t.jsx("span",{style:{fontSize:10},children:"복사"})]}),t.jsxs(X,{active:o,onClick:n,title:"서식 복사 (더블클릭: 연속)",small:!0,children:[t.jsx(Rn,{size:uo})," ",t.jsx("span",{style:{fontSize:10},children:"서식복사"})]}),t.jsxs(X,{onClick:d,title:"문서 붙여넣기 서식 정리",small:!0,children:[t.jsx(Nn,{size:uo})," ",t.jsx("span",{style:{fontSize:10},children:"서식정리"})]})]})]})})}const Jr=13,pt=11,Qs=[{mark:"bold",Icon:yt,title:"굵게 (Ctrl+B)",cmd:"toggleBold",iconProps:{strokeWidth:3}},{mark:"italic",Icon:vt,title:"기울임 (Ctrl+I)",cmd:"toggleItalic"},{mark:"underline",Icon:kt,title:"밑줄 (Ctrl+U)",cmd:"toggleUnderline"},{mark:"strike",Icon:hr,title:"취소선",cmd:"toggleStrike"},{mark:"subscript",Icon:Fn,title:"아래 첨자",cmd:"toggleSubscript",useSmallIcon:!0},{mark:"superscript",Icon:On,title:"위 첨자",cmd:"toggleSuperscript",useSmallIcon:!0}];function Zr(e,...o){try{return e.isActive(...o)}catch{return!1}}function Qr(e,o){try{return e.getAttributes(o)}catch{return{}}}function en({label:e,icon:o,lastColor:r,colors:i,recentColors:n,columns:a,width:s,onApplyLast:l,onSelectColor:d,onClear:m,clearLabel:p,active:f}){return t.jsx(Le,{trigger:t.jsxs("div",{style:{display:"flex",alignItems:"center"},children:[t.jsx(X,{active:f,onClick:l,title:e,small:!0,children:t.jsxs("span",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:0},children:[o,t.jsx("span",{style:{width:14,height:3,background:r,borderRadius:1,marginTop:o.type===xr?-2:0}})]})}),t.jsx("span",{style:{fontSize:7,cursor:"pointer",color:"var(--ribbon-fg, #666)"},children:"▼"})]}),children:t.jsxs("div",{style:{padding:8,width:s},children:[t.jsx("div",{style:{fontSize:11,color:"#555",marginBottom:6},children:e}),t.jsx(ar,{colors:i,value:r,recentColors:n,onChange:d,columns:a}),t.jsx("button",{className:"word-dropdown-item",style:{marginTop:6,width:"100%"},onMouseDown:c=>{c.preventDefault(),m()},children:p})]})})}function el({editor:e,onOpenFontDialog:o}){const[r,i]=u.useState("#fef3b5"),[n,a]=u.useState("#c00"),[s,l]=u.useState([]),[d,m]=u.useState([]),p=()=>{const x=Qr(e,"textStyle").fontFamily;if(!x)return"malgun";const w=gt.find(b=>x.includes(b.label)||x.includes(b.family.split(",")[0].replace(/'/g,"")));return(w==null?void 0:w.value)||"malgun"},f=()=>{const x=Qr(e,"textStyle").fontSize;return x?x.replace("pt","").replace("px",""):"11"},c=x=>{const w=gt.find(b=>b.value===x);w&&e.chain().focus().setFontFamily(w.family).run()},g=x=>e.chain().focus().setFontSize(x+"pt").run(),k=x=>{const w=parseFloat(f())||11,b=x>0?Ze.find(I=>I>w)||Ze[Ze.length-1]:[...Ze].reverse().find(I=>I<w)||Ze[0];g(String(b))},v=()=>{const{from:x,to:w}=e.state.selection;if(x===w)return;const b=e.state.doc.textBetween(x,w),I=b===b.toLowerCase()?b.toUpperCase():b===b.toUpperCase()?b.replace(/\b\w/g,P=>P.toUpperCase()).replace(/\B\w/g,P=>P.toLowerCase()):b.toLowerCase();e.chain().focus().insertContentAt({from:x,to:w},I).run()},y=(x,w,b)=>{b(I=>[x,...I.filter(P=>P!==x)].slice(0,10)),w(x)},h={height:24,padding:"0 4px",background:"var(--ribbon-input-bg, #fff)",border:"1px solid var(--ribbon-input-border, #c0c0c0)",borderRadius:2,fontSize:12,cursor:"pointer",color:"var(--ribbon-fg, #333)"};return t.jsxs(bt,{label:"글꼴",dialogLauncher:o,children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:3},children:[t.jsx("select",{value:p(),onChange:x=>c(x.target.value),title:"글꼴",style:{...h,width:130},children:gt.map(x=>t.jsx("option",{value:x.value,style:{fontFamily:x.family,fontSize:13},children:x.label},x.value))}),t.jsx("select",{value:f(),onChange:x=>g(x.target.value),title:"글꼴 크기",style:{...h,width:46},children:Ze.map(x=>t.jsx("option",{value:String(x),children:x},x))}),t.jsx(X,{onClick:()=>k(1),title:"글꼴 크기 증가 (Ctrl+Shift+>)",small:!0,children:t.jsx(ia,{size:pt})}),t.jsx(X,{onClick:()=>k(-1),title:"글꼴 크기 감소 (Ctrl+Shift+<)",small:!0,children:t.jsx(aa,{size:pt})}),t.jsx(X,{onClick:v,title:"대/소문자 변경",small:!0,children:t.jsx(sa,{size:pt})}),t.jsx(X,{onClick:()=>e.chain().focus().clearNodes().unsetAllMarks().run(),title:"서식 지우기",small:!0,children:t.jsx(Nn,{size:pt})})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:1},children:[Qs.map(({mark:x,Icon:w,title:b,cmd:I,iconProps:P,useSmallIcon:A})=>t.jsx(X,{active:Zr(e,x),onClick:()=>e.chain().focus()[I]().run(),title:b,small:!0,children:t.jsx(w,{size:A?pt:Jr,...P})},x)),t.jsx("span",{style:{display:"inline-block",width:6}}),t.jsx(en,{label:"텍스트 강조",active:Zr(e,"highlight"),icon:t.jsx(br,{size:pt}),lastColor:r,colors:En,recentColors:s,columns:5,width:180,onApplyLast:()=>e.chain().focus().toggleHighlight({color:r}).run(),onSelectColor:x=>{y(x,i,l),e.chain().focus().toggleHighlight({color:x}).run()},onClear:()=>e.chain().focus().unsetHighlight().run(),clearLabel:"강조 없음"}),t.jsx(en,{label:"글꼴 색",icon:t.jsx(xr,{size:Jr,color:n,strokeWidth:2.5}),lastColor:n,colors:zn,recentColors:d,columns:10,width:200,onApplyLast:()=>e.chain().focus().setColor(n).run(),onSelectColor:x=>{y(x,a,m),e.chain().focus().setColor(x).run()},onClear:()=>e.chain().focus().unsetColor().run(),clearLabel:"자동 (검정)"})]})]})}const Be=11,tl=[{align:"left",Icon:wt,title:"왼쪽 맞춤"},{align:"center",Icon:Jt,title:"가운데 맞춤"},{align:"right",Icon:Zt,title:"오른쪽 맞춤"},{align:"justify",Icon:kr,title:"양쪽 맞춤"}],ol=[{label:"바깥쪽 테두리",sides:{top:!0,bottom:!0,left:!0,right:!0}},{label:"위쪽 테두리만",sides:{top:!0,bottom:!1,left:!1,right:!1}},{label:"아래쪽 테두리만",sides:{top:!1,bottom:!0,left:!1,right:!1}},{label:"테두리 없음",sides:null}];function Ft(e,...o){try{return e.isActive(...o)}catch{return!1}}function rl({editor:e,onOpenParagraphDialog:o,onOpenBorderDialog:r}){const i=n=>{if(!n){e.chain().focus().unsetParagraphBorder().run();return}const a="1px solid #333";e.chain().focus().setParagraphBorder({borderTop:n.top?a:"none",borderBottom:n.bottom?a:"none",borderLeft:n.left?a:"none",borderRight:n.right?a:"none"}).run()};return t.jsxs(bt,{label:"단락",dialogLauncher:o,children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:1},children:[t.jsxs(Le,{trigger:t.jsx(X,{active:Ft(e,"bulletList"),onClick:()=>e.chain().focus().toggleBulletList().run(),title:"글머리 기호",small:!0,children:t.jsx(Yt,{size:Be})}),children:[t.jsx("button",{className:"word-dropdown-item",onMouseDown:n=>{n.preventDefault(),e.chain().focus().toggleBulletList().run()},children:"● 원형"}),t.jsx("button",{className:"word-dropdown-item",onMouseDown:n=>{n.preventDefault(),e.chain().focus().toggleBulletList().run()},children:"■ 사각형"})]}),t.jsx(Le,{trigger:t.jsx(X,{active:Ft(e,"orderedList"),onClick:()=>e.chain().focus().toggleOrderedList().run(),title:"번호 매기기",small:!0,children:t.jsx(Po,{size:Be})}),children:t.jsx("button",{className:"word-dropdown-item",onMouseDown:n=>{n.preventDefault(),e.chain().focus().toggleOrderedList().run()},children:"1. 2. 3."})}),t.jsx(X,{active:Ft(e,"taskList"),onClick:()=>e.chain().focus().toggleTaskList().run(),title:"체크리스트",small:!0,children:t.jsx(la,{size:Be})}),t.jsx("span",{style:{display:"inline-block",width:3}}),t.jsx(X,{onClick:()=>e.chain().focus().decreaseIndent().run(),title:"내어쓰기 (Shift+Tab)",small:!0,children:t.jsx(yr,{size:Be})}),t.jsx(X,{onClick:()=>e.chain().focus().increaseIndent().run(),title:"들여쓰기 (Tab)",small:!0,children:t.jsx(vr,{size:Be})})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:1},children:[tl.map(({align:n,Icon:a,title:s})=>t.jsx(X,{active:Ft(e,{textAlign:n}),onClick:()=>e.chain().focus().setTextAlign(n).run(),title:s,small:!0,children:t.jsx(a,{size:Be})},n)),t.jsx("span",{style:{display:"inline-block",width:3}}),t.jsx(Le,{trigger:t.jsx(X,{title:"줄 간격",small:!0,children:t.jsx(da,{size:Be})}),children:t.jsxs("div",{style:{padding:4},children:[t.jsx("div",{style:{fontSize:10,color:"#888",padding:"4px 8px"},children:"줄 간격"}),Zi.map(n=>t.jsx("button",{className:"word-dropdown-item",onMouseDown:a=>{a.preventDefault(),e.chain().focus().setLineSpacing(n.value).run()},children:n.label},n.value)),t.jsx("div",{style:{borderTop:"1px solid #eee",margin:"4px 0"}}),t.jsx("button",{className:"word-dropdown-item",onMouseDown:n=>{n.preventDefault(),e.chain().focus().setSpacingBefore("12pt").run()},children:"단락 앞 간격 추가"}),t.jsx("button",{className:"word-dropdown-item",onMouseDown:n=>{n.preventDefault(),e.chain().focus().setSpacingAfter("12pt").run()},children:"단락 뒤 간격 추가"})]})}),t.jsx(X,{onClick:()=>e.chain().focus().toggleBlockquote().run(),active:Ft(e,"blockquote"),title:"인용",small:!0,children:t.jsx(wr,{size:Be})}),t.jsx(Le,{trigger:t.jsx(X,{title:"테두리 및 음영",small:!0,children:t.jsx("span",{style:{fontSize:10},children:"▦"})}),children:t.jsxs("div",{style:{padding:4,minWidth:180},children:[t.jsx("div",{style:{fontSize:10,color:"#888",padding:"4px 8px",fontWeight:600},children:"테두리"}),ol.map(n=>t.jsx("button",{className:"word-dropdown-item",onMouseDown:a=>{a.preventDefault(),i(n.sides)},children:n.label},n.label)),t.jsx("div",{style:{borderTop:"1px solid #eee",margin:"4px 0"}}),t.jsx("div",{style:{fontSize:10,color:"#888",padding:"4px 8px",fontWeight:600},children:"음영"}),t.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(5, 24px)",gap:2,padding:"2px 8px"},children:Qi.slice(0,10).map(n=>t.jsx("button",{type:"button",style:{width:24,height:18,background:n,border:"1px solid #ddd",borderRadius:2,cursor:"pointer"},onMouseDown:a=>{a.preventDefault(),e.chain().focus().setParagraphShading(n).run()}},n))}),t.jsx("div",{style:{borderTop:"1px solid #eee",margin:"4px 0"}}),t.jsx("button",{className:"word-dropdown-item",onMouseDown:n=>{n.preventDefault(),r==null||r()},children:"테두리 및 음영..."})]})}),t.jsx(Le,{trigger:t.jsx(X,{title:"텍스트 효과",small:!0,children:t.jsx("span",{style:{fontSize:10},children:"✦"})}),children:t.jsxs("div",{style:{padding:6,minWidth:180},children:[t.jsx("div",{style:{fontSize:10,color:"#888",padding:"2px 8px 6px",fontWeight:600},children:"텍스트 효과"}),ea.map(n=>t.jsxs("button",{className:"word-dropdown-item",onMouseDown:a=>{a.preventDefault(),n.id==="none"?e.chain().focus().unsetTextShadow().run():n.style.textShadow&&e.chain().focus().setTextShadow(n.style.textShadow).run()},style:{...n.style,fontSize:12},children:[n.label," 가나다 Aa"]},n.id))]})})]})]})}function di(e,...o){try{return e.isActive(...o)}catch{return!1}}function nl(e){for(let o=1;o<=4;o++)if(di(e,"heading",{level:o}))return String(o);return"0"}function il(e,o,r){if(e.id==="normal"&&o==="0"||e.id==="quote"&&di(r,"blockquote"))return!0;const i=e.id.match(/^heading(\d)$/);return!!(i&&o===i[1])}function al(e,o){o.tag==="blockquote"?e.chain().focus().toggleBlockquote().run():o.tag.startsWith("h")?e.chain().focus().toggleHeading({level:parseInt(o.tag[1])}).run():e.chain().focus().setParagraph().run()}const tn={border:"1px solid var(--ribbon-sep, #d5d5d5)",background:"var(--ribbon-bg, #f8f8f8)",borderRadius:2,cursor:"pointer",padding:"6px 2px",color:"var(--ribbon-fg, #888)",flexShrink:0,display:"flex"};function sl({editor:e}){const o=u.useRef(null),r=nl(e),i=n=>{var a;(a=o.current)==null||a.scrollBy({left:n*200,behavior:"smooth"})};return t.jsx(bt,{label:"스타일",children:t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:2,maxWidth:360},children:[t.jsx("button",{type:"button",onClick:()=>i(-1),style:tn,children:t.jsx(ca,{size:10})}),t.jsx("div",{ref:o,style:{display:"flex",gap:3,overflow:"hidden",flex:1},children:ta.map(n=>{const a=il(n,r,e);return t.jsxs("button",{type:"button",className:"word-style-card",onClick:()=>al(e,n),style:{width:64,height:54,flexShrink:0,border:a?"2px solid #3b82f6":"1px solid var(--ribbon-sep, #c0c0c0)",borderRadius:3,background:"var(--ribbon-bg, #fff)",cursor:"pointer",padding:"3px 4px 2px",display:"flex",flexDirection:"column",justifyContent:"space-between",overflow:"hidden"},children:[t.jsx("span",{style:{fontSize:parseInt(n.fontSize)>14?12:10,color:n.color,fontWeight:n.fontWeight,fontStyle:n.fontStyle||"normal",lineHeight:1.2,fontFamily:n.fontFamily,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:"가나다Aa"}),t.jsx("span",{style:{fontSize:8,color:"var(--ribbon-label, #888)"},children:n.label})]},n.id)})}),t.jsx("button",{type:"button",onClick:()=>i(1),style:tn,children:t.jsx(Bn,{size:10})})]})})}const Xe=11,ll=u.memo(function({editor:o,onNew:r,onNewBlog:i,onPublishBlog:n,isPublishing:a,onOpenBlogPreview:s,onShowFind:l,onShowReplace:d,onOpenFontDialog:m,onOpenParagraphDialog:p,onOpenBorderDialog:f}){return o?t.jsxs("div",{style:{display:"flex",alignItems:"stretch",background:"var(--ribbon-bg, #fff)",borderBottom:"1px solid var(--ribbon-sep, #d1d5db)",flexShrink:0,minHeight:84,padding:"0 2px",overflowX:"auto"},children:[t.jsx(bt,{label:"문서",children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[t.jsxs(X,{onClick:()=>r==null?void 0:r(),title:"새 문서 만들기",small:!0,children:[t.jsx(Hn,{size:Xe})," ",t.jsx("span",{style:{fontSize:10},children:"새 문서"})]}),t.jsxs(X,{onClick:()=>i==null?void 0:i(),title:"블로그 작성 전용 문서 만들기",small:!0,children:[t.jsx(vo,{size:Xe})," ",t.jsx("span",{style:{fontSize:10},children:"블로그 글쓰기"})]}),t.jsxs(X,{onClick:()=>n==null?void 0:n(),disabled:a,title:"현재 문서를 블로그 게시글로 발행",small:!0,children:[t.jsx(vo,{size:Xe})," ",t.jsx("span",{style:{fontSize:10},children:a?"처리 중":"게시글 발행"})]}),t.jsxs(X,{onClick:()=>s==null?void 0:s(),title:"실제 블로그 발행 화면 미리보기",small:!0,children:[t.jsx(Io,{size:Xe})," ",t.jsx("span",{style:{fontSize:10},children:"미리보기"})]})]})}),t.jsx(Nt,{}),t.jsx(Zs,{editor:o}),t.jsx(Nt,{}),t.jsx(el,{editor:o,onOpenFontDialog:m}),t.jsx(Nt,{}),t.jsx(rl,{editor:o,onOpenParagraphDialog:p,onOpenBorderDialog:f}),t.jsx(Nt,{}),t.jsx(sl,{editor:o}),t.jsx(Nt,{}),t.jsx(bt,{label:"편집",children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[t.jsxs(X,{onClick:()=>l==null?void 0:l(),title:"찾기 (Ctrl+F)",small:!0,children:[t.jsx(ua,{size:Xe})," ",t.jsx("span",{style:{fontSize:10},children:"찾기"})]}),t.jsxs(X,{onClick:()=>d==null?void 0:d(),title:"바꾸기 (Ctrl+H)",small:!0,children:[t.jsx(pa,{size:Xe})," ",t.jsx("span",{style:{fontSize:10},children:"바꾸기"})]}),t.jsx(Le,{trigger:t.jsxs(X,{title:"선택",small:!0,children:[t.jsx(fa,{size:Xe})," ",t.jsx("span",{style:{fontSize:10},children:"선택"})]}),children:t.jsx("button",{className:"word-dropdown-item",onMouseDown:c=>{c.preventDefault(),o.commands.focus(),o.commands.selectAll()},children:"모두 선택 (Ctrl+A)"})})]})})]}):null}),dl=u.lazy(()=>Q(()=>import("./InsertTab-CkiJ0UVA.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9])).then(e=>({default:e.InsertTab}))),cl=u.lazy(()=>Q(()=>import("./DrawTab-DPlwKcC2.js"),__vite__mapDeps([10,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.DrawTab}))),ul=u.lazy(()=>Q(()=>import("./DesignTab-DNU9_YAC.js"),__vite__mapDeps([11,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.DesignTab}))),pl=u.lazy(()=>Q(()=>import("./LayoutTab-D9BkcLDr.js"),__vite__mapDeps([12,1,2,3,4,5,6,7,8,9])).then(e=>({default:e.LayoutTab}))),fl=u.lazy(()=>Q(()=>import("./ReferencesTab-C6f3GM5V.js"),__vite__mapDeps([13,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.ReferencesTab}))),gl=u.lazy(()=>Q(()=>import("./ReviewTab-4zqW7dX1.js"),__vite__mapDeps([14,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.ReviewTab}))),ml=u.lazy(()=>Q(()=>import("./ViewTab-QwMPaVLF.js"),__vite__mapDeps([15,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.ViewTab}))),hl=u.lazy(()=>Q(()=>import("./FindReplaceBar-Bc9oVuGQ.js"),__vite__mapDeps([16,1,9,4,5,6,2,7,3,8])).then(e=>({default:e.FindReplaceBar}))),on=[{id:"file",label:"파일",isFile:!0},{id:"home",label:"홈"},{id:"insert",label:"삽입"},{id:"draw",label:"그리기"},{id:"design",label:"디자인"},{id:"layout",label:"레이아웃"},{id:"references",label:"참조"},{id:"review",label:"검토"},{id:"view",label:"보기"}],bl=()=>t.jsx("div",{style:{height:100,display:"flex",alignItems:"center",justifyContent:"center"}}),xl=u.memo(function({editor:o,doc:r,activeTab:i,setActiveTab:n,ribbonCollapsed:a,setRibbonCollapsed:s,darkMode:l,viewMode:d,setShowBackstage:m,findBarMode:p,setFindBarMode:f,setDialogOpen:c,onNew:g,onNewBlog:k,onPublishBlog:v,isPublishing:y,layoutProps:h,designProps:x,referencesProps:w,reviewProps:b,viewProps:I,drawProps:P,blogPublishStatus:A,onOpenBlogPreview:L,onOpenMeta:C,onSwitchToSimpleBlog:S}){const R=(r==null?void 0:r.documentType)==="blog",j=u.useMemo(()=>R?on.filter(M=>["file","home","insert","view"].includes(M.id)):on,[R]);return u.useEffect(()=>{j.some(M=>M.id===i)||(n("home"),s(!1))},[i,n,s,j]),t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{height:44,background:l?"#2d2d2d":"#f3f3f3",borderBottom:"none",display:"flex",alignItems:"stretch",padding:"0 4px 0 0",flexShrink:0},children:[j.map(M=>t.jsx("button",{className:"word-tab-btn",onClick:()=>{if(M.id==="file")return m(!0);if(i===M.id)return s(!a);n(M.id),s(!1)},style:{padding:"0 18px",border:"none",borderBottom:"none",background:M.isFile?l?"#0078D4":"#1a2332":i===M.id&&!a?l?"#3a3a3a":"#ffffff":"transparent",color:M.isFile?"#fff":i===M.id&&!a?l?"#fff":"#1a2332":l?"#ccc":"#444",fontSize:14,fontWeight:i===M.id?600:500,cursor:"pointer",fontFamily:"'Segoe UI', '맑은 고딕', sans-serif",display:"flex",alignItems:"center",borderTop:i===M.id&&!a&&!M.isFile?`2px solid ${l?"#0078D4":"#1a2332"}`:"2px solid transparent",marginTop:2,borderRadius:0,letterSpacing:.3,transition:"color 0.1s, background 0.1s"},children:M.label},M.id)),R&&t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginLeft:6},children:[t.jsx("span",{title:"블로그 작성 모드",style:{padding:"2px 6px",border:"1px solid #bfdbfe",borderRadius:3,background:l?"rgba(37,99,235,0.18)":"#dbeafe",color:l?"#bfdbfe":"#1d4ed8",fontSize:10,lineHeight:"14px",whiteSpace:"nowrap"},children:"Blog"}),A&&t.jsx(ai,{status:A,darkMode:l}),t.jsx(Rs,{onClick:L}),t.jsx("button",{type:"button",onClick:C,title:"블로그 메타데이터 및 SEO",style:{height:28,width:30,border:"1px solid #cbd5e1",borderRadius:3,background:l?"#3a3a3a":"#fff",color:l?"#e5e7eb":"#1f2937",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},children:t.jsx(ga,{size:14})}),S&&t.jsx("button",{type:"button",onClick:S,title:"네이버 블로그 스타일 단순 에디터로 전환",style:{height:28,padding:"0 10px",border:"1px solid #1a3a6b",borderRadius:3,background:l?"rgba(26,58,107,0.18)":"#eef2ff",color:l?"#bfdbfe":"#1a3a6b",cursor:"pointer",fontSize:11,fontWeight:500,display:"inline-flex",alignItems:"center"},children:"단순 모드"})]}),t.jsx("div",{style:{flex:1}}),t.jsx("button",{type:"button",onClick:()=>s(!a),title:a?"리본 표시 (Ctrl+F1)":"리본 최소화 (Ctrl+F1)",style:{padding:"0 8px",border:"none",background:"transparent",color:l?"#888":"#666",cursor:"pointer",display:"flex",alignItems:"center",fontSize:10},onMouseEnter:M=>{M.currentTarget.style.background=l?"#3a3a3a":"#e5f1fb"},onMouseLeave:M=>{M.currentTarget.style.background="transparent"},children:a?t.jsx(_n,{size:14}):t.jsx(ma,{size:14})})]}),t.jsxs(u.Suspense,{fallback:t.jsx(bl,{}),children:[!a&&d==="edit"&&i==="home"&&t.jsx(ll,{editor:o,onNew:g,onNewBlog:k,onPublishBlog:v,isPublishing:y,onOpenBlogPreview:L,onShowFind:()=>f("find"),onShowReplace:()=>f("replace"),onOpenFontDialog:()=>c("font"),onOpenParagraphDialog:()=>c("paragraph"),onOpenBorderDialog:()=>c("border")}),!a&&d==="edit"&&i==="insert"&&t.jsx(dl,{editor:o,onOpenHyperlinkDialog:()=>c("hyperlink"),onOpenImageDialog:()=>c("image"),onOpenBookmarkDialog:()=>c("bookmark"),onOpenCrossRefDialog:()=>c("crossref")}),!a&&d==="edit"&&i==="draw"&&t.jsx(cl,{editor:o,...P}),!a&&d==="edit"&&i==="design"&&t.jsx(ul,{...x,onOpenPageBorderDialog:()=>c("pageborder"),onOpenWatermarkDialog:()=>c("watermark")}),!a&&d==="edit"&&i==="layout"&&t.jsx(pl,{...h,onOpenPageSetupDialog:()=>c("pagesetup"),editor:o}),!a&&d==="edit"&&i==="references"&&t.jsx(fl,{editor:o,...w,onOpenFootnoteDialog:()=>c("footnoteendnote")}),!a&&d==="edit"&&i==="review"&&t.jsx(gl,{editor:o,...b}),!a&&i==="view"&&t.jsx(ml,{...I}),p&&t.jsx(hl,{editor:o,showReplace:p==="replace",onClose:()=>f(null)})]})]})}),Ot=13,ci=u.memo(function({editor:o,onInsertComment:r,onOpenImageEdit:i}){const[n,a]=u.useState(!1),[s,l]=u.useState({top:0,left:0}),[d,m]=u.useState(null),p=u.useRef(null),f=u.useRef(null),c=u.useCallback(()=>{var b,I;if(!o)return;const{selection:h}=o.state,x=h==null?void 0:h.node,w=((b=x==null?void 0:x.type)==null?void 0:b.name)==="image";if(!w&&(h.empty||!o.isFocused)){a(!1),m(null);return}try{const{from:P}=h,A=o.view.coordsAtPos(P);let L=o.view.dom.parentElement;for(;L&&!L.classList.contains("editor-canvas-scroll");)L=L.parentElement;if(L||(L=(I=o.view.dom.closest("[class*='editor']"))==null?void 0:I.parentElement),!L){a(!1);return}const C=L.getBoundingClientRect(),S=A.top-C.top-48,R=Math.max(10,Math.min(A.left-C.left,C.width-380));if(S<0||S>C.height){a(!1);return}l({top:S,left:R}),m(w?x:null),a(!0)}catch{a(!1),m(null)}},[o]);if(u.useEffect(()=>{if(!o)return;const h=()=>{clearTimeout(f.current),f.current=setTimeout(c,150)},x=()=>{f.current=setTimeout(()=>{var w;(w=p.current)!=null&&w.contains(document.activeElement)||a(!1)},300)};return o.on("selectionUpdate",h),o.on("blur",x),()=>{o.off("selectionUpdate",h),o.off("blur",x),clearTimeout(f.current)}},[o,c]),!n||!o)return null;if(d)return t.jsx(yl,{editor:o,position:s,imageNode:d,onOpenImageEdit:i});const g=(...h)=>{try{return o.isActive(...h)}catch{return!1}},k=h=>{try{return o.getAttributes(h)}catch{return{}}},v=k("textStyle").color||"#333",y=g("heading",{level:1})?"1":g("heading",{level:2})?"2":g("heading",{level:3})?"3":"0";return t.jsxs("div",{ref:p,className:"floating-toolbar",style:{top:s.top,left:s.left},onMouseDown:h=>h.preventDefault(),children:[t.jsx("select",{value:(()=>{const h=k("textStyle").fontFamily;if(!h)return"malgun";const x=gt.find(w=>h.includes(w.label)||h.includes(w.family.split(",")[0].replace(/'/g,"")));return(x==null?void 0:x.value)||"malgun"})(),onChange:h=>{const x=gt.find(w=>w.value===h.target.value);x&&o.chain().focus().setFontFamily(x.family).run()},style:{height:22,fontSize:10,border:"1px solid #d5d5d5",borderRadius:3,padding:"0 2px",cursor:"pointer",background:"#fff",maxWidth:80},children:gt.slice(0,12).map(h=>t.jsx("option",{value:h.value,children:h.label},h.value))}),t.jsx("select",{value:(()=>{const h=k("textStyle").fontSize;return h?h.replace("pt","").replace("px",""):"11"})(),onChange:h=>o.chain().focus().setFontSize(h.target.value+"pt").run(),style:{height:22,fontSize:10,border:"1px solid #d5d5d5",borderRadius:3,padding:"0 2px",cursor:"pointer",background:"#fff",width:36},children:Ze.map(h=>t.jsx("option",{value:String(h),children:h},h))}),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),t.jsx(X,{active:g("bold"),onClick:()=>o.chain().focus().toggleBold().run(),title:"굵게",small:!0,children:t.jsx(yt,{size:Ot,strokeWidth:3})}),t.jsx(X,{active:g("italic"),onClick:()=>o.chain().focus().toggleItalic().run(),title:"기울임",small:!0,children:t.jsx(vt,{size:Ot})}),t.jsx(X,{active:g("underline"),onClick:()=>o.chain().focus().toggleUnderline().run(),title:"밑줄",small:!0,children:t.jsx(kt,{size:Ot})}),t.jsx(X,{active:g("strike"),onClick:()=>o.chain().focus().toggleStrike().run(),title:"취소선",small:!0,children:t.jsx(hr,{size:Ot})}),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),t.jsx(Le,{trigger:t.jsx(X,{active:g("highlight"),onClick:()=>o.chain().focus().toggleHighlight({color:"#fef3b5"}).run(),title:"강조",small:!0,children:t.jsx(br,{size:12})}),children:t.jsx("div",{style:{padding:6},children:t.jsx(ar,{colors:En,onChange:h=>o.chain().focus().toggleHighlight({color:h}).run(),columns:5})})}),t.jsx(Le,{trigger:t.jsx(X,{title:"글꼴 색",small:!0,children:t.jsx(xr,{size:Ot,color:v,strokeWidth:2.5})}),children:t.jsx("div",{style:{padding:6},children:t.jsx(ar,{colors:zn.slice(0,40),onChange:h=>o.chain().focus().setColor(h).run(),columns:10})})}),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),t.jsxs("select",{value:y,onChange:h=>{const x=parseInt(h.target.value);x===0?o.chain().focus().setParagraph().run():o.chain().focus().toggleHeading({level:x}).run()},style:{height:22,fontSize:10,border:"1px solid #d5d5d5",borderRadius:3,padding:"0 3px",cursor:"pointer",background:"#fff"},children:[t.jsx("option",{value:"0",children:"본문"}),t.jsx("option",{value:"1",children:"제목 1"}),t.jsx("option",{value:"2",children:"제목 2"}),t.jsx("option",{value:"3",children:"제목 3"})]}),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),t.jsx(X,{active:g({textAlign:"left"}),onClick:()=>o.chain().focus().setTextAlign("left").run(),title:"왼쪽",small:!0,children:t.jsx(wt,{size:11})}),t.jsx(X,{active:g({textAlign:"center"}),onClick:()=>o.chain().focus().setTextAlign("center").run(),title:"가운데",small:!0,children:t.jsx(Jt,{size:11})}),t.jsx(X,{active:g({textAlign:"right"}),onClick:()=>o.chain().focus().setTextAlign("right").run(),title:"오른쪽",small:!0,children:t.jsx(Zt,{size:11})}),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),t.jsx(X,{active:g("link"),onClick:()=>{const h=k("link").href||"",x=window.prompt("URL:",h);if(x!==null)if(!x)o.chain().focus().unsetLink().run();else{try{const w=new URL(x,window.location.origin);if(!["http:","https:"].includes(w.protocol)){de("유효하지 않은 URL입니다.");return}}catch{de("유효하지 않은 URL입니다.");return}o.chain().focus().extendMarkRange("link").setLink({href:x}).run()}},title:"링크",small:!0,children:t.jsx(jt,{size:12})}),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),t.jsx(X,{onClick:()=>r==null?void 0:r(),title:"새 메모 (Ctrl+Alt+M)",small:!0,children:t.jsx(Xt,{size:12})})]})}),yl=function({editor:o,position:r,imageNode:i,onOpenImageEdit:n}){var c,g,k;const a=((c=i==null?void 0:i.attrs)==null?void 0:c.align)||"none",s=v=>a===v,l=v=>o.chain().focus().setImageAlign(v).run(),d=()=>{var h;const v=((h=i==null?void 0:i.attrs)==null?void 0:h.caption)||"",y=window.prompt("캡션을 입력하세요 (비우면 제거):",v);y!==null&&o.chain().focus().setImageCaption(y.trim()).run()},m=()=>{var h;const v=((h=i==null?void 0:i.attrs)==null?void 0:h.alt)||"",y=window.prompt("대체 텍스트(alt)를 입력하세요:",v);y!==null&&o.chain().focus().updateImage({alt:y.trim()}).run()},p=()=>{window.confirm("이미지를 삭제할까요?")&&o.chain().focus().deleteSelection().run()},f=(v,y,h,x,w)=>t.jsxs("button",{type:"button",onClick:y,title:h,style:{display:"inline-flex",alignItems:"center",gap:4,height:26,padding:"0 8px",background:v?"var(--editor-accent-bg-active, #dbeafe)":"transparent",border:v?"1px solid var(--editor-accent-border-soft, #93c5fd)":"1px solid transparent",borderRadius:3,fontSize:11,color:"#333",cursor:"pointer",fontFamily:"'Segoe UI', '맑은 고딕', sans-serif"},onMouseEnter:b=>{v||(b.currentTarget.style.background="rgba(59,130,246,0.08)")},onMouseLeave:b=>{v||(b.currentTarget.style.background="transparent")},children:[x,w&&t.jsx("span",{children:w})]});return t.jsxs("div",{className:"floating-toolbar floating-toolbar-image",style:{top:r.top,left:r.left},onMouseDown:v=>v.preventDefault(),children:[f(s("left"),()=>l("left"),"왼쪽 정렬",t.jsx(wt,{size:12})),f(s("center"),()=>l("center"),"가운데 정렬",t.jsx(Jt,{size:12})),f(s("right"),()=>l("right"),"오른쪽 정렬",t.jsx(Zt,{size:12})),f(s("full"),()=>l("full"),"전체 너비",t.jsx(ha,{size:12})),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),f(!1,d,"캡션 추가/편집",t.jsx(Ao,{size:12}),"캡션"),f(!1,m,"대체 텍스트",t.jsx("span",{style:{fontSize:10,fontWeight:700},children:"ALT"})),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),f(!1,()=>o.chain().focus().rotateImage(90).run(),"90° 회전",t.jsx($n,{size:12})),f(!!((g=i==null?void 0:i.attrs)!=null&&g.bordered),()=>o.chain().focus().toggleImageBordered().run(),"테두리 토글",t.jsx(ba,{size:12})),f(!!((k=i==null?void 0:i.attrs)!=null&&k.rounded),()=>o.chain().focus().toggleImageRounded().run(),"둥근 모서리 토글",t.jsx("span",{style:{fontSize:10,fontWeight:700},children:"◖"})),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),f(!1,()=>n==null?void 0:n(),"사진 편집(자르기/밝기 등)",t.jsx(xa,{size:12}),"편집"),t.jsx("span",{style:{width:1,height:16,background:"#ddd",margin:"0 3px"}}),f(!1,p,"이미지 삭제",t.jsx(Ve,{size:12,color:"#b91c1c"}))]})},rn=80;function vl(){const[e,o]=u.useState(()=>{if(typeof window>"u")return{height:0,offsetTop:0,keyboardHeight:0,keyboardOpen:!1};const r=window.visualViewport;return r?{height:r.height,offsetTop:r.offsetTop||0,keyboardHeight:Math.max(0,window.innerHeight-r.height),keyboardOpen:window.innerHeight-r.height>rn}:{height:window.innerHeight,offsetTop:0,keyboardHeight:0,keyboardOpen:!1}});return u.useEffect(()=>{if(typeof window>"u"||!window.visualViewport)return;const r=window.visualViewport,i=()=>{const n=Math.max(0,window.innerHeight-r.height);o({height:r.height,offsetTop:r.offsetTop||0,keyboardHeight:n,keyboardOpen:n>rn})};return i(),r.addEventListener("resize",i),r.addEventListener("scroll",i),()=>{r.removeEventListener("resize",i),r.removeEventListener("scroll",i)}},[]),e}function ui(){return u.useCallback((e=10)=>{if(!(typeof navigator>"u")&&typeof navigator.vibrate=="function")try{navigator.vibrate(e)}catch{}},[])}function kl(e){const[o,r]=u.useState(null);return u.useEffect(()=>{if(!e)return;const i=()=>{try{const{selection:n}=e.state;if(!n||n.empty){r(null);return}const{from:a,to:s}=n,l=e.view.coordsAtPos(a),d=e.view.coordsAtPos(s),m=Math.min(l.top,d.top),p=Math.max(l.bottom,d.bottom),f=Math.min(l.left,d.left),c=Math.max(l.right,d.right);r({top:m,bottom:p,left:f,right:c,width:c-f,height:p-m})}catch{r(null)}};return e.on("selectionUpdate",i),e.on("blur",()=>r(null)),()=>{e.off("selectionUpdate",i)}},[e]),{rect:o,hasSelection:o!==null}}const Se=18,wl=u.memo(function({editor:o,onInsertComment:r,onOpenLink:i,onOpenAi:n}){const{rect:a}=kl(o),s=ui(),l=u.useMemo(()=>{var A,L;if(!a||!((A=o==null?void 0:o.view)!=null&&A.dom))return null;let P=o.view.dom.parentElement;for(;P&&!((L=P.classList)!=null&&L.contains("editor-canvas-scroll"));)P=P.parentElement;return P},[o,a]);if(!a||!l)return null;const d=l.getBoundingClientRect(),m=48,p=360,f=8;let c=a.top-d.top+l.scrollTop-m-f,g=!1;c<l.scrollTop+8&&(c=a.bottom-d.top+l.scrollTop+f,g=!0);let v=(a.left+a.right)/2-d.left-p/2;v=Math.max(8,Math.min(v,d.width-p-8));const y=P=>()=>{s(8),P(o.chain().focus()).run()},h=async()=>{var P;try{const L=o.state.doc.cut(o.state.selection.from,o.state.selection.to).textContent;L&&await((P=navigator.clipboard)==null?void 0:P.writeText(L)),s(10)}catch{}},x=async()=>{await h(),o.chain().focus().deleteSelection().run()},w=async()=>{var P;try{const A=await((P=navigator.clipboard)==null?void 0:P.readText());A&&o.chain().focus().insertContent(A).run()}catch{}},b=()=>{s(15),o.chain().focus().deleteSelection().run()},I=P=>{try{return o.isActive(P)}catch{return!1}};return t.jsxs("div",{className:"editor-mselection-bar",style:{position:"absolute",top:c,left:v,width:p,height:m},role:"toolbar","aria-label":"선택 액션","data-place":g?"below":"above",onMouseDown:P=>P.preventDefault(),children:[t.jsx("button",{type:"button",onClick:x,title:"잘라내기",children:t.jsx(gr,{size:Se})}),t.jsx("button",{type:"button",onClick:h,title:"복사",children:t.jsx(mr,{size:Se})}),t.jsx("button",{type:"button",onClick:w,title:"붙여넣기",children:t.jsx(yo,{size:Se})}),t.jsx("span",{className:"mselection-sep"}),t.jsx("button",{type:"button",className:I("bold")?"active":"",onClick:y(P=>P.toggleBold()),title:"굵게",children:t.jsx(yt,{size:Se})}),t.jsx("button",{type:"button",className:I("italic")?"active":"",onClick:y(P=>P.toggleItalic()),title:"기울임",children:t.jsx(vt,{size:Se})}),t.jsx("button",{type:"button",className:I("underline")?"active":"",onClick:y(P=>P.toggleUnderline()),title:"밑줄",children:t.jsx(kt,{size:Se})}),t.jsx("button",{type:"button",className:I("highlight")?"active":"",onClick:y(P=>P.toggleHighlight()),title:"형광펜",children:t.jsx(br,{size:Se})}),t.jsx("span",{className:"mselection-sep"}),t.jsx("button",{type:"button",className:I("link")?"active":"",onClick:()=>i==null?void 0:i(),title:"링크",children:t.jsx(jt,{size:Se})}),t.jsx("button",{type:"button",onClick:()=>r==null?void 0:r(),title:"댓글",children:t.jsx(ya,{size:Se})}),n&&t.jsx("button",{type:"button",onClick:()=>n==null?void 0:n(),title:"AI 도우미",children:t.jsx(Ce,{size:Se})}),t.jsx("button",{type:"button",className:"danger",onClick:b,title:"삭제",children:t.jsx(Ve,{size:Se})})]})});function jl({editor:e,onClose:o}){const[r,i]=u.useState("headings"),[n,a]=u.useState([]),[s,l]=u.useState(""),[d,m]=u.useState([]);u.useEffect(()=>{if(!e)return;const y=()=>{const h=[];e.state.doc.descendants((x,w)=>{x.type.name==="heading"&&h.push({level:x.attrs.level,text:x.textContent,pos:w})}),a(h)};return y(),e.on("update",y),()=>e.off("update",y)},[e]);const p=u.useMemo(()=>s?n.filter(y=>y.text.toLowerCase().includes(s.toLowerCase())):n,[n,s]),f=u.useCallback(y=>{if(l(y),!y||!e){m([]);return}const h=[],x=y.toLowerCase();e.state.doc.descendants((w,b)=>{if(!w.isText)return;const I=w.text,P=I.toLowerCase();let A=P.indexOf(x);for(;A!==-1;){const L=Math.max(0,A-20),C=Math.min(I.length,A+y.length+20),S=I.substring(L,A),R=I.substring(A,A+y.length),j=I.substring(A+y.length,C);h.push({from:b+A,to:b+A+y.length,before:(L>0?"...":"")+S,match:R,after:j+(C<I.length?"...":"")}),A=P.indexOf(x,A+1)}}),m(h),h.length>0&&y.length>=2&&i("results")},[e]),c=y=>{if(!e)return;e.chain().focus().setTextSelection(y).run();const h=e.view.domAtPos(y);if(h!=null&&h.node){const x=h.node.nodeType===Node.TEXT_NODE?h.node.parentElement:h.node;x==null||x.scrollIntoView({behavior:"smooth",block:"center"})}},g=(y,h)=>{e&&(e.chain().focus().setTextSelection({from:y,to:h}).run(),e.commands.scrollIntoView())},k=u.useMemo(()=>{if(!e)return[];const y=[];let h="",x=0;return e.state.doc.descendants((w,b)=>{if(w.type.name==="paragraph"||w.type.name==="heading"){x++;const I=w.textContent;h.length<200&&(h+=I+" "),x%30===0&&(y.push({preview:h.trim().substring(0,120),startPos:b,blockCount:x}),h="")}}),h.trim()&&y.push({preview:h.trim().substring(0,120),startPos:0,blockCount:x}),y.length>0?y:[{preview:"(빈 문서)",startPos:0,blockCount:0}]},[e,n]),v=y=>({flex:1,padding:"6px 0",fontSize:10,border:"none",borderBottom:y?"2px solid #0078d4":"2px solid transparent",background:"transparent",color:y?"#0078d4":"#888",cursor:"pointer",fontWeight:y?600:400});return t.jsxs("div",{style:{width:220,flexShrink:0,background:"#f8f9fa",borderRight:"1px solid #e0e0e0",display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"'맑은 고딕', sans-serif"},children:[t.jsxs("div",{style:{padding:"8px 10px",borderBottom:"1px solid #e0e0e0",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[t.jsx("span",{style:{fontSize:12,fontWeight:600,color:"#333"},children:"탐색"}),t.jsx("button",{onClick:o,style:{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#999",padding:"0 2px"},children:"✕"})]}),t.jsxs("div",{style:{padding:"6px 10px",borderBottom:"1px solid #e0e0e0"},children:[t.jsx("input",{type:"text",placeholder:"문서 검색...",value:s,onChange:y=>f(y.target.value),onKeyDown:y=>{y.key==="Enter"&&d.length>0&&g(d[0].from,d[0].to)},style:{width:"100%",padding:"4px 8px",fontSize:11,border:"1px solid #d5d5d5",borderRadius:3,outline:"none",boxSizing:"border-box"}}),s&&t.jsxs("div",{style:{fontSize:9,color:"#888",marginTop:2},children:[d.length,"개 결과"]})]}),t.jsxs("div",{style:{display:"flex",borderBottom:"1px solid #e0e0e0",background:"#fff"},children:[t.jsx("button",{onClick:()=>i("headings"),style:v(r==="headings"),children:"제목"}),t.jsx("button",{onClick:()=>i("pages"),style:v(r==="pages"),children:"페이지"}),d.length>0&&t.jsx("button",{onClick:()=>i("results"),style:v(r==="results"),children:"결과"})]}),t.jsxs("div",{style:{flex:1,overflowY:"auto",padding:"4px 0"},children:[r==="headings"&&t.jsxs(t.Fragment,{children:[p.length===0&&t.jsx("div",{style:{padding:"16px 12px",fontSize:11,color:"#999",textAlign:"center"},children:s?"검색 결과 없음":`문서에 제목이 없습니다.
제목 스타일을 적용하세요.`}),p.map((y,h)=>t.jsx("button",{type:"button",onClick:()=>c(y.pos),style:{display:"block",width:"100%",textAlign:"left",padding:`4px 10px 4px ${10+(y.level-1)*14}px`,border:"none",background:"transparent",fontSize:y.level===1?12:y.level===2?11:10,fontWeight:y.level<=2?600:400,color:y.level===1?"#1e3a5f":y.level===2?"#333":"#555",cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'맑은 고딕', sans-serif"},onMouseEnter:x=>x.currentTarget.style.background="#eff6ff",onMouseLeave:x=>x.currentTarget.style.background="transparent",children:y.text||"(빈 제목)"},h))]}),r==="pages"&&t.jsx("div",{style:{padding:"4px 0"},children:k.map((y,h)=>t.jsx("button",{type:"button",onClick:()=>c(y.startPos),style:{display:"block",width:"100%",textAlign:"left",padding:"8px 10px",border:"none",background:"transparent",cursor:"pointer",borderBottom:"1px solid #f0f0f0"},onMouseEnter:x=>x.currentTarget.style.background="#eff6ff",onMouseLeave:x=>x.currentTarget.style.background="transparent",children:t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[t.jsx("div",{style:{width:32,height:42,border:"1px solid #ccc",borderRadius:2,background:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.08)"},children:t.jsx("span",{style:{fontSize:10,fontWeight:600,color:"#185ABD"},children:h+1})}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsxs("div",{style:{fontSize:11,fontWeight:600,color:"#333"},children:["페이지 ",h+1]}),t.jsx("div",{style:{fontSize:9,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130},children:y.preview||"(빈 페이지)"})]})]})},h))}),r==="results"&&t.jsxs("div",{style:{padding:"4px 0"},children:[d.length===0&&t.jsx("div",{style:{padding:"16px 12px",fontSize:11,color:"#999",textAlign:"center"},children:"검색 결과 없음"}),d.map((y,h)=>t.jsxs("button",{type:"button",onClick:()=>g(y.from,y.to),style:{display:"block",width:"100%",textAlign:"left",padding:"6px 10px",border:"none",background:"transparent",cursor:"pointer",borderBottom:"1px solid #f0f0f0",fontSize:11,color:"#333"},onMouseEnter:x=>x.currentTarget.style.background="#eff6ff",onMouseLeave:x=>x.currentTarget.style.background="transparent",children:[t.jsx("span",{style:{color:"#888"},children:y.before}),t.jsx("span",{style:{background:"#fff3cd",fontWeight:600},children:y.match}),t.jsx("span",{style:{color:"#888"},children:y.after})]},h))]})]}),t.jsxs("div",{style:{padding:"6px 10px",borderTop:"1px solid #e0e0e0",fontSize:10,color:"#999"},children:[r==="headings"&&`${n.length}개 제목`,r==="pages"&&`${k.length}개 페이지`,r==="results"&&`${d.length}개 결과`]})]})}const Z=14,Sl=[{icon:t.jsx(zo,{size:Z}),label:"실행 취소",shortcut:"Ctrl+Z",action:"undo",disabledKey:"cannotUndo"},{icon:t.jsx($n,{size:Z}),label:"다시 실행",shortcut:"Ctrl+Y",action:"redo",disabledKey:"cannotRedo",dividerAfter:!0}],Cl=[{icon:t.jsx(gr,{size:Z}),label:"잘라내기",shortcut:"Ctrl+X",action:"cut",disabledKey:"noSelection"},{icon:t.jsx(mr,{size:Z}),label:"복사",shortcut:"Ctrl+C",action:"copy",disabledKey:"noSelection"},{icon:t.jsx(yo,{size:Z}),label:"붙여넣기",shortcut:"Ctrl+V",action:"paste"},{icon:t.jsx(yo,{size:Z}),label:"서식 없이 붙여넣기",shortcut:"Ctrl+Shift+V",action:"pastePlain",dividerAfter:!0}],Tl=[{icon:t.jsx(yt,{size:Z}),label:"굵게",shortcut:"Ctrl+B",action:"bold"},{icon:t.jsx(vt,{size:Z}),label:"기울임",shortcut:"Ctrl+I",action:"italic"},{icon:t.jsx(kt,{size:Z}),label:"밑줄",shortcut:"Ctrl+U",action:"underline",dividerAfter:!0}],Ml=[{icon:t.jsx(wt,{size:Z}),label:"왼쪽 맞춤",action:"alignLeft"},{icon:t.jsx(Jt,{size:Z}),label:"가운데 맞춤",action:"alignCenter"},{icon:t.jsx(Zt,{size:Z}),label:"오른쪽 맞춤",action:"alignRight"},{icon:t.jsx(kr,{size:Z}),label:"양쪽 맞춤",action:"alignJustify"}],El=[{icon:t.jsx(Ao,{size:Z}),label:"본문",action:"paragraph"},{icon:t.jsx(Un,{size:Z}),label:"제목 1",action:"heading1"},{icon:t.jsx(Wn,{size:Z}),label:"제목 2",action:"heading2"},{icon:t.jsx(ka,{size:Z}),label:"제목 3",action:"heading3"}],zl=[{icon:t.jsx(Yt,{size:Z}),label:"글머리 기호",action:"bulletList"},{icon:t.jsx(Po,{size:Z}),label:"번호 매기기",action:"orderedList"}],Il=[{icon:t.jsx(vr,{size:Z}),label:"들여쓰기",shortcut:"Tab",action:"indent"},{icon:t.jsx(yr,{size:Z}),label:"내어쓰기",shortcut:"Shift+Tab",action:"outdent",dividerAfter:!0}],Pl=[{icon:t.jsx(jt,{size:Z}),label:"하이퍼링크...",labelIfActive:"링크 편집...",shortcut:"Ctrl+K",action:"hyperlink",activeKey:"isLink"},{icon:t.jsx(Lo,{size:Z}),label:"그림 삽입...",action:"insertImage",dividerAfter:!0}],po={icon:t.jsx(Xt,{size:Z}),label:"새 메모",shortcut:"Ctrl+Alt+M",action:"insertComment"},Al=[{label:"행 추가 (위)",action:"addRowBefore"},{label:"행 추가 (아래)",action:"addRowAfter"},{label:"열 추가 (왼쪽)",action:"addColumnBefore"},{label:"열 추가 (오른쪽)",action:"addColumnAfter"},{dividerOnly:!0},{label:"행 삭제",action:"deleteRow"},{label:"열 삭제",action:"deleteColumn"},{label:"셀 병합",action:"mergeCells"},{label:"셀 분할",action:"splitCell"},{dividerOnly:!0},{label:"표 삭제",action:"deleteTable",danger:!0}],Ll=[{icon:t.jsx(Ao,{size:Z}),label:"글꼴...",shortcut:"Ctrl+D",action:"fontDialog"},{icon:t.jsx(Gn,{size:Z}),label:"단락...",action:"paragraphDialog"}],Jo={icon:t.jsx(Rn,{size:Z}),label:"서식 지우기",action:"clearFormat"},fo={alignment:t.jsx(wt,{size:Z}),style:t.jsx(Ao,{size:Z}),list:t.jsx(Yt,{size:Z}),table:t.jsx(va,{size:Z})},Zo=14;function ft({icon:e,label:o,shortcut:r,onClick:i,danger:n,disabled:a,dividerAfter:s}){return t.jsxs(t.Fragment,{children:[t.jsxs("button",{type:"button",className:"ctx-menu-item",onMouseDown:l=>{l.preventDefault(),l.stopPropagation(),a||i==null||i()},disabled:a,style:{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 12px 6px 8px",border:"none",background:"transparent",cursor:a?"default":"pointer",fontSize:12,textAlign:"left",color:n?"#dc2626":a?"#bbb":"#333",fontFamily:"'Segoe UI', '맑은 고딕', sans-serif",opacity:a?.5:1},onMouseEnter:l=>{a||(l.currentTarget.style.background="#eff6ff")},onMouseLeave:l=>{l.currentTarget.style.background="transparent"},children:[t.jsx("span",{style:{width:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},children:e}),t.jsx("span",{style:{flex:1},children:o}),r&&t.jsx("span",{style:{fontSize:10,color:"#999",marginLeft:12},children:r})]}),s&&t.jsx("div",{style:{height:1,background:"#e5e5e5",margin:"3px 0"}})]})}function go({icon:e,label:o,children:r}){const[i,n]=u.useState(!1);return t.jsxs("div",{style:{position:"relative"},onMouseEnter:()=>n(!0),onMouseLeave:()=>n(!1),children:[t.jsxs("button",{type:"button",className:"ctx-menu-item",style:{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 12px 6px 8px",border:"none",background:"transparent",cursor:"pointer",fontSize:12,textAlign:"left",color:"#333",fontFamily:"'Segoe UI', '맑은 고딕', sans-serif"},onMouseEnter:a=>a.currentTarget.style.background="#eff6ff",onMouseLeave:a=>a.currentTarget.style.background="transparent",children:[t.jsx("span",{style:{width:18,display:"flex",alignItems:"center",justifyContent:"center"},children:e}),t.jsx("span",{style:{flex:1},children:o}),t.jsx("span",{style:{fontSize:10,color:"#999"},children:"▶"})]}),i&&t.jsx("div",{style:{position:"absolute",left:"100%",top:-4,background:"#fff",border:"1px solid #d1d5db",borderRadius:4,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:160,padding:"4px 0",zIndex:10},children:r})]})}function Te(e,o,r,i){return e.map((n,a)=>{if(n.dividerOnly)return t.jsx("div",{style:{height:1,background:"#e5e5e5",margin:"3px 0"}},a);const s=n.disabledKey?r[n.disabledKey]:!1,l=n.activeKey&&i[n.activeKey]&&n.labelIfActive?n.labelIfActive:n.label;return t.jsx(ft,{icon:n.icon,label:l,shortcut:n.shortcut,danger:n.danger,disabled:s,dividerAfter:n.dividerAfter,onClick:()=>{var d;return(d=o[n.action])==null?void 0:d.call(o)}},n.action)})}function Dl(e,o,r){const i=a=>{a(),o()},n=()=>e.chain().focus();return{undo:()=>i(()=>n().undo().run()),redo:()=>i(()=>n().redo().run()),cut:()=>i(()=>{const{from:a,to:s}=e.state.selection,l=e.state.doc.textBetween(a,s,`
`);navigator.clipboard.writeText(l).then(()=>{n().deleteSelection().run()}).catch(()=>document.execCommand("cut"))}),copy:()=>i(()=>{const{from:a,to:s}=e.state.selection,l=e.state.doc.textBetween(a,s,`
`);navigator.clipboard.writeText(l).catch(()=>document.execCommand("copy"))}),paste:()=>i(()=>{navigator.clipboard.readText().then(a=>{n().insertContent(a).run()}).catch(()=>{})}),pastePlain:()=>i(()=>{navigator.clipboard.readText().then(a=>{n().insertContent({type:"text",text:a}).run()}).catch(()=>{})}),bold:()=>i(()=>n().toggleBold().run()),italic:()=>i(()=>n().toggleItalic().run()),underline:()=>i(()=>n().toggleUnderline().run()),alignLeft:()=>i(()=>n().setTextAlign("left").run()),alignCenter:()=>i(()=>n().setTextAlign("center").run()),alignRight:()=>i(()=>n().setTextAlign("right").run()),alignJustify:()=>i(()=>n().setTextAlign("justify").run()),paragraph:()=>i(()=>n().setParagraph().run()),heading1:()=>i(()=>n().toggleHeading({level:1}).run()),heading2:()=>i(()=>n().toggleHeading({level:2}).run()),heading3:()=>i(()=>n().toggleHeading({level:3}).run()),bulletList:()=>i(()=>n().toggleBulletList().run()),orderedList:()=>i(()=>n().toggleOrderedList().run()),indent:()=>i(()=>n().increaseIndent().run()),outdent:()=>i(()=>n().decreaseIndent().run()),hyperlink:()=>i(()=>{var a;return(a=r.onOpenHyperlinkDialog)==null?void 0:a.call(r)}),insertImage:()=>i(()=>{const a=document.createElement("input");a.type="file",a.accept="image/*",a.onchange=s=>{var m;const l=(m=s.target.files)==null?void 0:m[0];if(!l)return;const d=new FileReader;d.onload=()=>e.chain().focus().setImage({src:d.result}).run(),d.readAsDataURL(l)},a.click()}),insertComment:()=>i(()=>{var a;return(a=r.onInsertComment)==null?void 0:a.call(r)}),addRowBefore:()=>i(()=>n().addRowBefore().run()),addRowAfter:()=>i(()=>n().addRowAfter().run()),addColumnBefore:()=>i(()=>n().addColumnBefore().run()),addColumnAfter:()=>i(()=>n().addColumnAfter().run()),deleteRow:()=>i(()=>n().deleteRow().run()),deleteColumn:()=>i(()=>n().deleteColumn().run()),mergeCells:()=>i(()=>n().mergeCells().run()),splitCell:()=>i(()=>n().splitCell().run()),deleteTable:()=>i(()=>n().deleteTable().run()),fontDialog:()=>i(()=>{var a;return(a=r.onOpenFontDialog)==null?void 0:a.call(r)}),paragraphDialog:()=>i(()=>{var a;return(a=r.onOpenParagraphDialog)==null?void 0:a.call(r)}),clearFormat:()=>i(()=>n().clearNodes().unsetAllMarks().run())}}function _l({editor:e,onOpenFontDialog:o,onOpenParagraphDialog:r,onOpenHyperlinkDialog:i,onInsertComment:n,commentStore:a,commentDispatch:s,commentAuthor:l}){const[d,m]=u.useState(!1),[p,f]=u.useState({x:0,y:0}),c=u.useRef(null);u.useEffect(()=>{if(!e)return;const A=S=>{if(!e.view.dom.contains(S.target))return;S.preventDefault(),S.stopPropagation();const R=Math.min(S.clientX,window.innerWidth-220),j=Math.min(S.clientY,window.innerHeight-400);f({x:R,y:j}),m(!0)},L=S=>{c.current&&!c.current.contains(S.target)&&m(!1)},C=()=>m(!1);return document.addEventListener("contextmenu",A),document.addEventListener("mousedown",L),document.addEventListener("scroll",C,!0),()=>{document.removeEventListener("contextmenu",A),document.removeEventListener("mousedown",L),document.removeEventListener("scroll",C,!0)}},[e]);const g=()=>m(!1);if(!d||!e)return null;const k=!e.state.selection.empty,v=e.isActive("table"),y=e.isActive("link"),h={cannotUndo:!e.can().undo(),cannotRedo:!e.can().redo(),noSelection:!k},x={isLink:y},b=Dl(e,g,{onOpenFontDialog:o,onOpenParagraphDialog:r,onOpenHyperlinkDialog:i,onInsertComment:n}),P=e.state.selection.$from.marks().find(A=>A.type.name==="comment");return t.jsxs("div",{ref:c,style:{position:"fixed",left:p.x,top:p.y,zIndex:5e3,background:"#fff",border:"1px solid #d1d5db",borderRadius:6,boxShadow:"0 6px 24px rgba(0,0,0,0.15)",minWidth:200,padding:"4px 0",animation:"ctxIn 0.1s ease-out"},children:[Te(Sl,b,h,x),Te(Cl,b,h,x),k&&Te(Tl,b,h,x),t.jsx(go,{icon:fo.alignment,label:"단락 정렬",children:Te(Ml,b,h,x)}),t.jsx(go,{icon:fo.style,label:"스타일",children:Te(El,b,h,x)}),t.jsx(go,{icon:fo.list,label:"목록",children:Te(zl,b,h,x)}),t.jsx("div",{style:{height:1,background:"#e5e5e5",margin:"3px 0"}}),Te(Il,b,h,x),Te(Pl,b,h,x),t.jsx(ft,{icon:po.icon,label:po.label,shortcut:po.shortcut,onClick:()=>{var A;return(A=b[po.action])==null?void 0:A.call(b)}}),P&&a&&s&&(()=>{const A=P.attrs.commentId,L=a.comments[A];return t.jsxs(t.Fragment,{children:[t.jsx(ft,{icon:t.jsx(pr,{size:Zo}),label:"메모에 답글 달기",onClick:()=>{s({type:"SET_ACTIVE",id:A}),s({type:"SET_PANEL_VISIBLE",visible:!0}),a.markupMode!=="all"&&s({type:"SET_MARKUP_MODE",mode:"all"}),g()}}),t.jsx(ft,{icon:t.jsx(mt,{size:Zo}),label:"메모 해결",onClick:()=>{s({type:"RESOLVE_COMMENT",id:A,author:l}),g()},disabled:L==null?void 0:L.resolved}),t.jsx(ft,{icon:t.jsx(Ve,{size:Zo}),label:"메모 삭제",danger:!0,onClick:()=>{e.commands.unsetComment(A),s({type:"DELETE_COMMENT",id:A}),g()}})]})})(),t.jsx("div",{style:{height:1,background:"#e5e5e5",margin:"3px 0"}}),v&&t.jsxs(t.Fragment,{children:[t.jsx(go,{icon:fo.table,label:"표 조작",children:Te(Al,b,h,x)}),t.jsx("div",{style:{height:1,background:"#e5e5e5",margin:"3px 0"}})]}),Te(Ll,b,h,x),t.jsx("div",{style:{height:1,background:"#e5e5e5",margin:"3px 0"}}),t.jsx(ft,{icon:Jo.icon,label:Jo.label,disabled:!k,onClick:()=>{var A;return(A=b[Jo.action])==null?void 0:A.call(b)}})]})}const Rl=new Sr("footnote"),nn={decimal:e=>String(e),lowerRoman:e=>an(e).toLowerCase(),upperRoman:e=>an(e),lowerAlpha:e=>String.fromCharCode(96+(e-1)%26+1),upperAlpha:e=>String.fromCharCode(64+(e-1)%26+1),symbol:e=>{const o=["*","†","‡","§","‖","¶"],r=(e-1)%o.length,i=Math.floor((e-1)/o.length)+1;return o[r].repeat(i)}};function an(e){const o=[1e3,900,500,400,100,90,50,40,10,9,5,4,1],r=["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];let i="";for(let n=0;n<o.length;n++)for(;e>=o[n];)i+=r[n],e-=o[n];return i}function Ro(e,o="decimal"){return(nn[o]||nn.decimal)(e)}const Nl=qe.create({name:"footnoteReference",group:"inline",inline:!0,atom:!0,selectable:!0,draggable:!1,addAttributes(){return{footnoteId:{default:null,parseHTML:e=>e.getAttribute("data-footnote-id"),renderHTML:e=>({"data-footnote-id":e.footnoteId})},number:{default:1,parseHTML:e=>parseInt(e.getAttribute("data-footnote-number"))||1,renderHTML:e=>({"data-footnote-number":e.number})},noteType:{default:"footnote",parseHTML:e=>e.getAttribute("data-note-type")||"footnote",renderHTML:e=>({"data-note-type":e.noteType})}}},parseHTML(){return[{tag:"sup[data-footnote-id]"}]},renderHTML({HTMLAttributes:e}){const o=e["data-footnote-id"]||"",r=String(e["data-footnote-number"]||"?");return["sup",Cr(e,{class:"footnote-ref"}),["a",{id:o?`fn-ref-${o}`:null,class:"blog-footnote-ref",href:o?`#fn-content-${o}`:null},r]]},addNodeView(){return({node:e})=>{const o=document.createElement("sup");return o.className="footnote-ref",o.textContent=String(e.attrs.number),o.setAttribute("data-footnote-id",e.attrs.footnoteId||""),o.setAttribute("data-footnote-number",e.attrs.number),o.setAttribute("data-note-type",e.attrs.noteType||"footnote"),o.addEventListener("click",r=>{r.stopPropagation();const i=e.attrs.footnoteId,n=document.querySelector(`[data-footnote-item-id="${i}"]`);n&&(n.scrollIntoView({behavior:"smooth",block:"center"}),n.classList.add("footnote-item-flash"),setTimeout(()=>n.classList.remove("footnote-item-flash"),Zn))}),o.addEventListener("mouseenter",()=>{o.classList.add("footnote-ref-hover");const r=e.attrs.footnoteId,i=document.querySelector(".footnote-tooltip");i&&i.remove();const n=document.querySelector(`[data-footnote-item-id="${r}"]`);if(n){const a=document.createElement("div");a.className="footnote-tooltip";const s=n.querySelector(".footnote-item-content");a.textContent=(s==null?void 0:s.textContent)||"(각주 내용 없음)";const l=o.getBoundingClientRect();a.style.left=l.left+"px",a.style.top=l.bottom+6+"px",document.body.appendChild(a)}}),o.addEventListener("mouseleave",()=>{o.classList.remove("footnote-ref-hover");const r=document.querySelector(".footnote-tooltip");r&&r.remove()}),{dom:o,update(r){return r.type.name!=="footnoteReference"?!1:(o.textContent=String(r.attrs.number),o.setAttribute("data-footnote-id",r.attrs.footnoteId||""),o.setAttribute("data-footnote-number",r.attrs.number),o.setAttribute("data-note-type",r.attrs.noteType||"footnote"),!0)},destroy(){const r=document.querySelector(".footnote-tooltip");r&&r.remove()}}}},addCommands(){return{insertFootnote:(e,o="footnote")=>({chain:r})=>r().insertContent({type:"footnoteReference",attrs:{footnoteId:e,number:0,noteType:o}}).run(),removeFootnote:e=>({tr:o,state:r,dispatch:i})=>{let n=!1;return r.doc.descendants((a,s)=>{if(a.type.name==="footnoteReference"&&a.attrs.footnoteId===e)return o.delete(s,s+a.nodeSize),n=!0,!1}),n&&i&&i(o),n},renumberFootnotes:()=>({tr:e,state:o,dispatch:r})=>{let i=1,n=!1;return o.doc.descendants((a,s)=>{a.type.name==="footnoteReference"&&(a.attrs.number!==i&&(e.setNodeMarkup(s,void 0,{...a.attrs,number:i}),n=!0),i++)}),n&&r&&r(e),!0},getFootnoteIds:()=>({state:e})=>{const o=[];return e.doc.descendants(r=>{r.type.name==="footnoteReference"&&o.push(r.attrs.footnoteId)}),o}}},addProseMirrorPlugins(){return[new jr({key:Rl,appendTransaction(e,o,r){let i=!1;for(const l of e)if(l.docChanged){i=!0;break}if(!i)return null;const n=r.tr;let a=1,s=!1;return r.doc.descendants((l,d)=>{l.type.name==="footnoteReference"&&(l.attrs.number!==a&&(n.setNodeMarkup(d,void 0,{...l.attrs,number:a}),s=!0),a++)}),s?n:null}})]}});function Fl(){return"fn-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7)}function pi(e){const o=[];return e.descendants(r=>{r.type.name==="footnoteReference"&&o.push({id:r.attrs.footnoteId,number:r.attrs.number,noteType:r.attrs.noteType||"footnote"})}),o}function fi({editor:e,endnotes:o,setEndnotes:r,numberFormat:i="lowerRoman"}){const n=u.useRef(null),[a,s]=u.useState(null),[l,d]=u.useState("");u.useEffect(()=>{if(!e)return;const k=()=>{const y=pi(e.state.doc).filter(h=>h.noteType==="endnote").map(h=>h.id);r(h=>{let x=h.filter(w=>y.includes(w.id));return x.sort((w,b)=>y.indexOf(w.id)-y.indexOf(b.id)),x=x.map((w,b)=>({...w,number:b+1})),x})};return e.on("update",k),k(),()=>e.off("update",k)},[e,r]);const m=u.useCallback(k=>{if(!e)return;let v=null;if(e.state.doc.descendants((y,h)=>{if(y.type.name==="footnoteReference"&&y.attrs.footnoteId===k)return v=h,!1}),v!==null){e.chain().focus().setTextSelection(v).run();try{const y=e.view.domAtPos(v),h=y.node.nodeType===Node.TEXT_NODE?y.node.parentElement:y.node;h==null||h.scrollIntoView({behavior:"smooth",block:"center"})}catch{}}},[e]),p=(k,v)=>{s(k),d(v||""),setTimeout(()=>{var y,h;(y=n.current)==null||y.focus(),(h=n.current)==null||h.select()},30)},f=k=>{r(v=>v.map(y=>y.id===k?{...y,content:l}:y)),s(null)},c=k=>{e&&(e.commands.removeFootnote(k),r(v=>v.filter(y=>y.id!==k)))},g=(k,v)=>{if(k.key==="Enter"&&(k.ctrlKey||k.metaKey)){k.preventDefault(),f(v);return}if(k.key==="Escape"){s(null);return}if(k.key==="Tab"){k.preventDefault(),f(v);const y=o.findIndex(x=>x.id===v),h=o[y+1];h&&p(h.id,h.content)}};return!o||o.length===0?null:t.jsxs("div",{className:"endnote-area",children:[t.jsx("div",{className:"endnote-separator"}),t.jsx("div",{className:"endnote-header",children:"미주"}),t.jsx("div",{className:"footnote-list",children:o.map(k=>{const v=Ro(k.number,i),y=a===k.id;return t.jsxs("div",{"data-footnote-item-id":k.id,className:`footnote-item${y?" footnote-item-editing":""}`,children:[t.jsx("span",{className:"footnote-item-number endnote-number",onClick:()=>m(k.id),title:"클릭하면 본문 위치로 이동",children:v}),t.jsx("div",{className:"footnote-item-content",style:{flex:1},children:y?t.jsx("textarea",{ref:n,className:"footnote-edit-input",value:l,onChange:h=>d(h.target.value),onBlur:()=>f(k.id),onKeyDown:h=>g(h,k.id)}):t.jsx("span",{className:"footnote-item-text",onClick:()=>p(k.id,k.content),children:k.content||"(클릭하여 미주 내용 입력)"})}),t.jsx("button",{type:"button",className:"footnote-delete-btn",onClick:()=>c(k.id),title:"미주 삭제",children:"✕"})]},k.id)})})]})}function sn(e){if(!e||e.isDestroyed)return null;try{return e.view||null}catch{return null}}function gi({editor:e,footnotes:o,setFootnotes:r,onHeightChange:i,numberFormat:n="decimal",variant:a="document",pageLayout:s,dynamicPageCount:l=1}){const d=u.useRef(null),[m,p]=u.useState(null),[f,c]=u.useState(""),g=u.useRef(null),[k,v]=u.useState({});u.useEffect(()=>{if(!e)return;const C=()=>{const R=pi(e.state.doc).filter(j=>j.noteType==="footnote").map(j=>j.id);r(j=>{let M=j.filter(N=>R.includes(N.id));return M.sort((N,E)=>R.indexOf(N.id)-R.indexOf(E.id)),M=M.map((N,E)=>({...N,number:E+1})),M})};return e.on("update",C),C(),()=>e.off("update",C)},[e,r]),u.useEffect(()=>{if(!e||e.isDestroyed||a!=="document"||!(s!=null&&s.contentAreaHeight))return;const C=()=>{var E,O;const R=sn(e),j=(O=(E=R==null?void 0:R.dom)==null?void 0:E.closest)==null?void 0:O.call(E,".editor-page-area");if(!j)return;const M=j.getBoundingClientRect(),N={};e.state.doc.descendants((_,T)=>{var D;if(!(_.type.name!=="footnoteReference"||_.attrs.noteType!=="footnote"))try{const F=R.domAtPos(T),W=F.node.nodeType===Node.TEXT_NODE?F.node.parentElement:F.node,z=(D=W==null?void 0:W.getBoundingClientRect)==null?void 0:D.call(W);if(!z)return;const U=Math.max(0,z.top-M.top),K=(s.pageH||s.contentAreaHeight)+(s.PAGE_GAP||0),$=K>0?Math.floor(U/K)+1:1;N[_.attrs.footnoteId]=Math.max(1,Math.min(l||$,$))}catch{}}),v(N)};e.on("update",C),e.on("selectionUpdate",C);const S=setTimeout(C,120);return()=>{e.off("update",C),e.off("selectionUpdate",C),clearTimeout(S)}},[e,s,a,l]),u.useEffect(()=>{if(!d.current||!i)return;const C=new ResizeObserver(S=>{for(const R of S)i(R.contentRect.height)});return C.observe(d.current),()=>C.disconnect()},[i]);const y=u.useCallback(C=>{if(!e)return;let S=null;if(e.state.doc.descendants((R,j)=>{if(R.type.name==="footnoteReference"&&R.attrs.footnoteId===C)return S=j,!1}),S!==null){e.chain().focus().setTextSelection(S).run();try{const R=sn(e);if(!R)return;const j=R.domAtPos(S),M=j.node.nodeType===Node.TEXT_NODE?j.node.parentElement:j.node;M==null||M.scrollIntoView({behavior:"smooth",block:"center"}),M&&(M.classList.add("footnote-ref-flash"),setTimeout(()=>M.classList.remove("footnote-ref-flash"),Zn))}catch{}}},[e]),h=(C,S)=>{p(C),c(S||""),setTimeout(()=>{var R,j;(R=g.current)==null||R.focus(),(j=g.current)==null||j.select()},30)},x=C=>{r(S=>S.map(R=>R.id===C?{...R,content:f}:R)),p(null)},w=(C,S)=>{if(C.key==="Enter"&&(C.ctrlKey||C.metaKey)){C.preventDefault(),x(S);return}if(C.key==="Escape"){p(null);return}if(C.key==="Tab"){C.preventDefault(),x(S);const R=o.findIndex(M=>M.id===S),j=o[R+1];j&&h(j.id,j.content)}},b=C=>{e&&(e.commands.removeFootnote(C),r(S=>S.filter(R=>R.id!==C)))};if(!o||o.length===0)return null;const I=a==="document"?o.reduce((C,S)=>{const R=k[S.id]||1;return C[R]||(C[R]=[]),C[R].push(S),C},{}):{blog:o},P=Object.keys(I).sort((C,S)=>C==="blog"?1:S==="blog"?-1:Number(C)-Number(S)),A=a==="document",L=C=>{if(!A)return;const S=Math.max(1,Number(C)||1),{pageH:R=0,marginBottom:j=0,marginLeft:M=0,marginRight:N=0,PAGE_GAP:E=0}=s||{};return{position:"absolute",top:(S-1)*(R+E)+R-j+8,left:M,right:N,maxHeight:Math.max(44,j-14),overflow:"auto"}};return t.jsxs("div",{ref:d,className:`footnote-area ${a==="blog"?"blog-editor-footnote-area":"document-footnote-area paged-footnote-area"}`,children:[!A&&t.jsx("div",{className:"footnote-separator"}),a==="blog"&&t.jsx("div",{className:"footnote-area-label",children:"블로그 하단 각주"}),t.jsx("div",{className:"footnote-list",children:P.map(C=>t.jsxs("div",{className:"footnote-page-group",style:L(C),children:[A&&t.jsx("div",{className:"footnote-separator"}),a==="document"&&t.jsxs("div",{className:"footnote-page-label",children:[C,"쪽 각주"]}),I[C].map(S=>{const R=Ro(S.number,n),j=m===S.id;return t.jsxs("div",{"data-footnote-item-id":S.id,className:`footnote-item${j?" footnote-item-editing":""}`,children:[t.jsx("span",{className:"footnote-item-number",onClick:()=>y(S.id),title:"클릭하면 본문 위치로 이동",children:R}),t.jsx("div",{className:"footnote-item-content",style:{flex:1},children:j?t.jsx("textarea",{ref:g,className:"footnote-edit-input",value:f,onChange:M=>c(M.target.value),onBlur:()=>x(S.id),onKeyDown:M=>w(M,S.id)}):t.jsx("span",{className:"footnote-item-text",onClick:()=>h(S.id,S.content),children:S.content||"(클릭하여 각주 내용 입력)"})}),t.jsx("button",{type:"button",className:"footnote-delete-btn",onClick:()=>b(S.id),title:"각주 삭제",children:"✕"})]},S.id)})]},C))})]})}function ln(e){if(e.length===0)return"";if(e.length===1)return`M ${e[0].x} ${e[0].y} L ${e[0].x} ${e[0].y}`;let o=`M ${e[0].x} ${e[0].y}`;for(let r=1;r<e.length;r++)o+=` L ${e[r].x} ${e[r].y}`;return o}function Ol({activeTool:e,penColor:o,penWidth:r,highlighterOpacity:i,drawingState:n}){const a=u.useRef(null),s=u.useRef(!1),l=u.useCallback(g=>{const k=a.current;if(!k)return{x:0,y:0};const v=k.getBoundingClientRect(),y=g.touches?g.touches[0].clientX:g.clientX,h=g.touches?g.touches[0].clientY:g.clientY;return{x:y-v.left,y:h-v.top}},[]),d=u.useCallback(()=>{const g=e==null?void 0:e.startsWith("highlight");return{color:o,width:r,opacity:g?i:1,tool:e}},[e,o,r,i]),m=u.useCallback(g=>{if(g.preventDefault(),!e)return;if(e==="eraser"){const v=l(g);n.eraseAt(v.x,v.y),s.current=!0;return}if(e==="lasso")return;s.current=!0;const k=l(g);n.startStroke(d()),n.addPoint(k)},[e,l,d,n]),p=u.useCallback(g=>{if(!s.current)return;g.preventDefault();const k=l(g);if(e==="eraser"){n.eraseAt(k.x,k.y);return}n.addPoint(k)},[e,l,n]),f=u.useCallback(()=>{s.current&&(s.current=!1,e!=="eraser"&&n.finishStroke())},[e,n]),c=()=>e==="eraser"?"cell":e==="lasso"||e?"crosshair":"default";return t.jsxs("svg",{ref:a,style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",zIndex:50,cursor:c(),touchAction:"none",pointerEvents:e?"auto":"none"},onPointerDown:m,onPointerMove:p,onPointerUp:f,onPointerLeave:f,children:[n.strokes.map((g,k)=>t.jsx("path",{d:ln(g.points),stroke:g.color,strokeWidth:g.width,fill:"none",opacity:g.opacity!=null?g.opacity:1,strokeLinecap:"round",strokeLinejoin:"round"},`stroke-${k}`)),n.currentStroke&&n.currentStroke.points.length>0&&t.jsx("path",{d:ln(n.currentStroke.points),stroke:n.currentStroke.color,strokeWidth:n.currentStroke.width,fill:"none",opacity:n.currentStroke.opacity!=null?n.currentStroke.opacity:1,strokeLinecap:"round",strokeLinejoin:"round"})]})}function Bl({value:e,onChange:o,differentFirst:r,oddEvenDifferent:i,isFirstPage:n,isOdd:a}){const[s,l]=u.useState(!1),d=u.useRef(null),m=r&&n?"첫 페이지 머리글":i?a?"홀수 페이지 머리글":"짝수 페이지 머리글":"머리글",p=u.useCallback(()=>{l(!1),d.current&&o(d.current.innerText||"")},[o]),f=u.useCallback(()=>{l(!0),setTimeout(()=>{var c;return(c=d.current)==null?void 0:c.focus()},0)},[]);return t.jsxs("div",{className:`header-footer-edit-area header${s?" editing":""}`,style:{position:"relative",minHeight:32},children:[!s&&!e&&t.jsx("span",{className:"header-footer-label",style:{top:10},children:m}),t.jsx("div",{ref:d,contentEditable:s,suppressContentEditableWarning:!0,onClick:f,onFocus:f,onBlur:p,style:{minHeight:20,fontSize:"9pt",color:s?"#333":"#999",textAlign:"center",outline:"none",cursor:s?"text":"pointer",padding:"4px 8px"},title:"클릭하여 편집",children:e||""})]})}function Hl({value:e,onChange:o,differentFirst:r,oddEvenDifferent:i,isFirstPage:n,isOdd:a,pageNumber:s}){const[l,d]=u.useState(!1),m=u.useRef(null),p=r&&n?"첫 페이지 바닥글":i?a?"홀수 페이지 바닥글":"짝수 페이지 바닥글":"바닥글",f=u.useCallback(()=>{d(!1),m.current&&o(m.current.innerText||"")},[o]),c=u.useCallback(()=>{d(!0),setTimeout(()=>{var k;return(k=m.current)==null?void 0:k.focus()},0)},[]),g=(e||"").replace(/\{PAGE\}/g,String(s||1));return t.jsxs("div",{className:`header-footer-edit-area footer${l?" editing":""}`,style:{position:"relative",minHeight:32},children:[!l&&!e&&t.jsx("span",{className:"header-footer-label",style:{bottom:10},children:p}),t.jsx("div",{ref:m,contentEditable:l,suppressContentEditableWarning:!0,onClick:c,onFocus:c,onBlur:f,style:{minHeight:20,fontSize:"9pt",color:l?"#333":"#999",textAlign:"center",outline:"none",cursor:l?"text":"pointer",padding:"4px 8px"},title:"클릭하여 편집",children:l?e||"":g})]})}const We=37.8,jo=25,So=500,Co=10,$l=60,Ul=120,Wl=u.memo(function({editor:o,editorCanvasRef:r,viewMode:i,darkMode:n,zoom:a,showRuler:s,showNavPane:l,setShowNavPane:d,doc:m,pageLayout:p,commentProps:f,footnoteProps:c,setDialogOpen:g,handleInsertComment:k,showHeaderFooter:v,headerText:y,setHeaderText:h,footerText:x,setFooterText:w,watermarkText:b,pageColor:I,drawProps:P,dynamicPageCount:A=1,isMobile:L=!1}){const{pageH:C}=p,{commentStore:S,commentDispatch:R,commentAuthor:j}=f,M=n?"#2d2d2d":I||"#fff",N=L?"mobile":i;return t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},children:[S.showReviewingPane==="horizontal"&&t.jsx("div",{style:{order:2},children:t.jsx(Kr,{mode:"horizontal",commentStore:S,dispatch:R,currentAuthor:j,editor:o,onClose:()=>R({type:"SET_REVIEWING_PANE",mode:null})})}),t.jsxs("div",{style:{flex:1,display:"flex",overflow:"hidden"},children:[!L&&S.showReviewingPane==="vertical"&&t.jsx(Kr,{mode:"vertical",commentStore:S,dispatch:R,currentAuthor:j,editor:o,onClose:()=>R({type:"SET_REVIEWING_PANE",mode:null})}),!L&&l&&t.jsx(jl,{editor:o,onClose:()=>d(!1)}),t.jsxs("div",{className:"editor-canvas-scroll",style:{flex:1,overflowY:"auto",background:N==="web"||N==="mobile"?n?"#1e1e1e":"#fff":n?"#1e1e1e":"#e8e8e8",display:"flex",justifyContent:"center",padding:N==="web"||N==="mobile"?"0":"20px 0 60px",position:"relative"},children:[s&&!L&&t.jsx(Gl,{pageH:C,zoom:a,darkMode:n}),N==="mobile"&&t.jsx(Vl,{editorCanvasRef:r,editor:o,darkMode:n,handleInsertComment:k,setDialogOpen:g,footnoteProps:c,commentStore:S,commentDispatch:R}),N==="web"&&t.jsx(ql,{editorCanvasRef:r,editor:o,doc:m,darkMode:n,handleInsertComment:k,setDialogOpen:g}),N==="preview"&&t.jsx(Kl,{editorCanvasRef:r,editor:o,doc:m,darkMode:n}),N==="edit"&&t.jsx(Xl,{editorCanvasRef:r,editor:o,doc:m,darkMode:n,zoom:a,pageLayout:p,pageBg:M,watermarkText:b,showHeaderFooter:v,headerText:y,setHeaderText:h,footerText:x,setFooterText:w,footnoteProps:c,handleInsertComment:k,setDialogOpen:g,commentStore:S,commentDispatch:R,commentAuthor:j,drawProps:P,dynamicPageCount:A})]}),S.markupMode==="all"&&S.showCommentsPanel&&Object.keys(S.comments).length>0&&t.jsx(Ts,{editor:o,commentStore:S,dispatch:R,currentAuthor:j})]})]})});function Gl({pageH:e,zoom:o,darkMode:r}){const i=Math.ceil(e/We),n=[];for(let a=0;a<=i;a++){const s=a*We*(o/100);n.push(t.jsxs("div",{style:{position:"absolute",right:0,top:`${s}px`},children:[t.jsx("div",{style:{width:8,height:1,background:r?"#888":"#666"}}),a>0&&a<i&&t.jsx("span",{style:{fontSize:7,color:r?"#888":"#777",position:"absolute",right:10,top:-4,fontFamily:"'Segoe UI', sans-serif"},children:a})]},`vc-${a}`));const l=(a+.5)*We*(o/100);l<e*(o/100)&&n.push(t.jsx("div",{style:{position:"absolute",right:0,top:`${l}px`},children:t.jsx("div",{style:{width:4,height:1,background:r?"#555":"#aaa"}})},`vh-${a}`))}return t.jsx("div",{style:{width:18,flexShrink:0,background:r?"#2d2d2d":"#f5f5f5",borderRight:`1px solid ${r?"#444":"#ddd"}`,position:"sticky",top:0,alignSelf:"flex-start",minHeight:`${e*(o/100)}px`},children:n})}function Vl({editorCanvasRef:e,editor:o,darkMode:r,handleInsertComment:i,setDialogOpen:n,footnoteProps:a,commentStore:s,commentDispatch:l}){var d,m;return t.jsxs("div",{ref:e,className:"editor-mobile-flow",style:{background:r?"#1e1e1e":"#fff",color:r?"#e5e7eb":"#1f2937"},children:[t.jsx(Do,{editor:o}),((d=a==null?void 0:a.footnotes)==null?void 0:d.length)>0&&t.jsx(gi,{editor:o,footnotes:a.footnotes,setFootnotes:a.setFootnotes,onHeightChange:a.setFootnoteAreaHeight,numberFormat:a.footnoteNumberFormat,variant:"blog",pageLayout:null,dynamicPageCount:1}),((m=a==null?void 0:a.endnotes)==null?void 0:m.length)>0&&t.jsx(fi,{editor:o,endnotes:a.endnotes,setEndnotes:a.setEndnotes,numberFormat:a.endnoteNumberFormat}),t.jsx(wl,{editor:o,onInsertComment:i,onOpenLink:()=>n==null?void 0:n("hyperlink")}),t.jsx(ni,{editor:o,commentStore:s,dispatch:l})]})}function ql({editorCanvasRef:e,editor:o,doc:r,darkMode:i,handleInsertComment:n,setDialogOpen:a}){return t.jsxs("div",{ref:e,style:{width:"100%",maxWidth:900,padding:"20px 40px",background:i?"#2d2d2d":"#fff",minHeight:"100%"},children:[r.title&&t.jsx("div",{style:{fontSize:24,fontWeight:700,color:i?"#eee":"#1a1a1a",marginBottom:8,fontFamily:"'Noto Serif KR', Georgia, serif"},children:r.title}),r.subtitle&&t.jsx("div",{style:{fontSize:14,color:"#777",marginBottom:20},children:r.subtitle}),t.jsx(Do,{editor:o}),t.jsx(ci,{editor:o,onInsertComment:n,onOpenImageEdit:()=>a==null?void 0:a("imageEdit")})]})}function Kl({editorCanvasRef:e,editor:o,doc:r,darkMode:i}){return t.jsxs("div",{ref:e,style:{width:"100%",maxWidth:800,padding:"40px 60px",background:i?"#2d2d2d":"#fff",minHeight:"100%",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",margin:"0 auto"},children:[r.title&&t.jsx("div",{style:{fontSize:28,fontWeight:700,color:i?"#eee":"#1a1a1a",marginBottom:12,fontFamily:"'Noto Serif KR', Georgia, serif",borderBottom:"2px solid #1a2332",paddingBottom:12},children:r.title}),r.subtitle&&t.jsx("div",{style:{fontSize:15,color:"#666",marginBottom:8},children:r.subtitle}),(r.author||r.publishedDate)&&t.jsxs("div",{style:{fontSize:12,color:"#999",marginBottom:24},children:[r.author&&t.jsx("span",{children:r.author}),r.author&&r.publishedDate&&t.jsx("span",{children:" · "}),r.publishedDate&&t.jsx("span",{children:r.publishedDate})]}),t.jsx("div",{className:"ProseMirror",style:{fontFamily:"'맑은 고딕', sans-serif",fontSize:"11pt",lineHeight:1.85,color:i?"#ddd":"#1a1a1a"},dangerouslySetInnerHTML:{__html:fr.sanitize((o==null?void 0:o.getHTML())||"")}})]})}function Xl({editorCanvasRef:e,editor:o,doc:r,darkMode:i,zoom:n,pageLayout:a,pageBg:s,watermarkText:l,showHeaderFooter:d,headerText:m,setHeaderText:p,footerText:f,setFooterText:c,footnoteProps:g,handleInsertComment:k,setDialogOpen:v,commentStore:y,commentDispatch:h,commentAuthor:x,drawProps:w,dynamicPageCount:b=1}){var O,_,T;const{pageW:I,pageH:P,marginTop:A,marginBottom:L,marginLeft:C,marginRight:S,PAGE_GAP:R=20}=a,j=n/100,M=i?"#555":"#c0c0c0",N=Math.max(1,Number(b)||1),E=N*P+(N-1)*R;return t.jsx("div",{style:{transform:`scale(${j})`,transformOrigin:"top center",width:I,flexShrink:0},children:t.jsxs("div",{ref:e,className:"editor-page-area",style:{position:"relative",width:I,minHeight:E,background:s,boxShadow:i?"0 1px 4px rgba(0,0,0,0.5)":"0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)",border:i?"1px solid #444":"none",paddingTop:A,paddingBottom:L,paddingLeft:C,paddingRight:S,boxSizing:"border-box"},children:[t.jsx(Yl,{marginTop:A,marginBottom:L,marginLeft:C,marginRight:S,pageH:P,guideColor:M}),l&&t.jsx("div",{style:{position:"absolute",top:P/2,left:"50%",transform:"translate(-50%, -50%) rotate(-45deg)",fontSize:54,color:"rgba(192,192,192,0.25)",fontWeight:300,whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none",fontFamily:"'Segoe UI', '맑은 고딕', sans-serif",letterSpacing:8,zIndex:0},children:l}),d&&t.jsx("div",{style:{position:"absolute",top:0,left:C,right:S,height:A,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9pt",color:"#aaa",zIndex:1},children:t.jsx(Bl,{value:m,onChange:p,differentFirst:!1,oddEvenDifferent:!1,isFirstPage:!0,isOdd:!0})}),d&&t.jsx("div",{style:{position:"absolute",bottom:0,left:C,right:S,height:L,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9pt",color:"#aaa",zIndex:1},children:t.jsx(Hl,{value:f,onChange:c,differentFirst:!1,oddEvenDifferent:!1,isFirstPage:!0,isOdd:!0,pageNumber:1})}),r.title&&t.jsx("div",{style:{fontSize:22,fontWeight:700,color:i?"#eee":"#1a1a1a",marginBottom:8,fontFamily:"'Noto Serif KR', Georgia, serif"},children:r.title}),r.subtitle&&t.jsx("div",{style:{fontSize:14,color:"#777",marginBottom:20,fontFamily:"'맑은 고딕', sans-serif"},children:r.subtitle}),t.jsx(Do,{editor:o}),t.jsx(gi,{editor:o,footnotes:g.footnotes,setFootnotes:g.setFootnotes,onHeightChange:g.setFootnoteAreaHeight,numberFormat:g.footnoteNumberFormat,variant:r.documentType==="blog"?"blog":"document",pageLayout:a,dynamicPageCount:N}),t.jsx(fi,{editor:o,endnotes:g.endnotes,setEndnotes:g.setEndnotes,numberFormat:g.endnoteNumberFormat}),t.jsx(ci,{editor:o,onInsertComment:k,onOpenImageEdit:()=>v==null?void 0:v("imageEdit")}),t.jsx(_l,{editor:o,onOpenFontDialog:()=>v("font"),onOpenParagraphDialog:()=>v("paragraph"),onOpenHyperlinkDialog:()=>v("hyperlink"),onOpenTableDialog:()=>v("table"),onInsertComment:k,commentStore:y,commentDispatch:h,commentAuthor:x}),t.jsx(ni,{editor:o,commentStore:y,dispatch:h}),(((O=w==null?void 0:w.drawOptions)==null?void 0:O.canvasActive)||((T=(_=w==null?void 0:w.drawingState)==null?void 0:_.strokes)==null?void 0:T.length)>0)&&t.jsx(Ol,{activeTool:w.drawOptions.activeTool,penColor:w.drawOptions.penColor,penWidth:w.drawOptions.penWidth,highlighterOpacity:w.drawOptions.highlighterOpacity,drawingState:w.drawingState})]})})}function Yl({marginTop:e,marginBottom:o,marginLeft:r,marginRight:i,pageH:n,guideColor:a}){const s={position:"absolute",pointerEvents:"none",zIndex:4};return t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{...s,top:e,left:r-1,width:12,height:1,background:a}}),t.jsx("div",{style:{...s,top:e,left:r-1,width:1,height:12,background:a}}),t.jsx("div",{style:{...s,top:e,right:i-1,width:12,height:1,background:a}}),t.jsx("div",{style:{...s,top:e,right:i-1,width:1,height:12,background:a}}),t.jsx("div",{style:{...s,top:n-o,left:r-1,width:12,height:1,background:a}}),t.jsx("div",{style:{...s,top:n-o-12,left:r-1,width:1,height:12,background:a}}),t.jsx("div",{style:{...s,top:n-o,right:i-1,width:12,height:1,background:a}}),t.jsx("div",{style:{...s,top:n-o-12,right:i-1,width:1,height:12,background:a}})]})}const Jl=u.memo(function({darkMode:o,dynamicPageCount:r,wordCount:i,charCount:n,viewMode:a,setViewMode:s,zoom:l,setZoom:d}){const m=[{label:`페이지: ${r}/${r}`,title:"페이지 수"},{label:`단어 수: ${i.toLocaleString()}`,title:"단어 수"},{label:`${n.toLocaleString()}자`,title:"문자 수"},{label:"한국어",title:"언어"}],p=[{mode:"edit",icon:t.jsx(Sa,{size:13}),title:"인쇄 모양"},{mode:"preview",icon:t.jsx(Ca,{size:13}),title:"읽기 모드"},{mode:"web",icon:t.jsx(Ta,{size:13}),title:"웹 레이아웃"}];return t.jsxs("div",{style:{height:24,background:o?"#1e1e1e":"#1a2332",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 10px",flexShrink:0,color:"#fff",fontSize:11,fontFamily:"'Segoe UI', '맑은 고딕', sans-serif",userSelect:"none"},children:[t.jsx("div",{style:{display:"flex",alignItems:"center",gap:0},children:m.map((f,c)=>t.jsx("span",{style:{padding:"2px 10px",cursor:"default",fontSize:11,lineHeight:1,borderRight:"1px solid rgba(255,255,255,0.15)"},onMouseEnter:g=>{g.currentTarget.style.background="rgba(255,255,255,0.1)"},onMouseLeave:g=>{g.currentTarget.style.background="transparent"},title:f.title,children:f.label},c))}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:2},children:[p.map(f=>t.jsx("button",{type:"button",onClick:()=>s(f.mode),title:f.title,style:{background:a===f.mode?"rgba(255,255,255,0.2)":"none",border:"none",color:"rgba(255,255,255,0.85)",cursor:"pointer",padding:"3px 5px",borderRadius:2,display:"flex",alignItems:"center"},onMouseEnter:c=>{c.currentTarget.style.background="rgba(255,255,255,0.15)"},onMouseLeave:c=>{c.currentTarget.style.background=a===f.mode?"rgba(255,255,255,0.2)":"none"},children:f.icon},f.mode)),t.jsx("div",{style:{width:1,height:14,background:"rgba(255,255,255,0.2)",margin:"0 6px"}}),t.jsx("button",{type:"button",onClick:()=>d(f=>Math.max(jo,f-Co)),title:"축소",style:{background:"none",border:"none",color:"rgba(255,255,255,0.85)",cursor:"pointer",padding:"2px 3px",display:"flex",borderRadius:2},onMouseEnter:f=>{f.currentTarget.style.background="rgba(255,255,255,0.15)"},onMouseLeave:f=>{f.currentTarget.style.background="none"},children:t.jsx(wa,{size:13})}),t.jsx("input",{type:"range",min:jo,max:So,value:l,onChange:f=>d(+f.target.value),style:{width:100,height:4,cursor:"pointer",accentColor:"#fff",WebkitAppearance:"none",appearance:"none",background:"rgba(255,255,255,0.3)",borderRadius:2}}),t.jsx("button",{type:"button",onClick:()=>d(f=>Math.min(So,f+Co)),title:"확대",style:{background:"none",border:"none",color:"rgba(255,255,255,0.85)",cursor:"pointer",padding:"2px 3px",display:"flex",borderRadius:2},onMouseEnter:f=>{f.currentTarget.style.background="rgba(255,255,255,0.15)"},onMouseLeave:f=>{f.currentTarget.style.background="none"},children:t.jsx(ja,{size:13})}),t.jsxs("span",{style:{width:36,textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.85)"},children:[l,"%"]})]})]})}),Zl=u.memo(function({editor:o,doc:r,setDoc:i,titleRef:n,darkMode:a,setDarkMode:s,saveStatus:l,handleSave:d,handleNew:m,handleNewBlog:p,handlePublishBlog:f,isPublishing:c,onOpenBlogPreview:g,setMetaOpen:k}){var R;const v={background:"none",border:"none",color:"rgba(255,255,255,0.85)",cursor:"pointer",padding:"8px 10px",borderRadius:4,display:"flex",alignItems:"center",lineHeight:1},y=j=>{j.currentTarget.style.background="rgba(255,255,255,0.18)",j.currentTarget.style.color="#fff"},h=j=>{j.currentTarget.style.background="none",j.currentTarget.style.color="rgba(255,255,255,0.85)"},x=[{icon:t.jsx(Vn,{size:16}),title:"저장 (Ctrl+S)",fn:()=>d(!1)},{icon:t.jsx(qn,{size:16}),title:"실행 취소 (Ctrl+Z)",fn:()=>o==null?void 0:o.chain().focus().undo().run()},{icon:t.jsx(Kn,{size:16}),title:"다시 실행 (Ctrl+Y)",fn:()=>o==null?void 0:o.chain().focus().redo().run()}],w=typeof l=="object"&&l!==null?l.message||l.detail||l.status||"":l||"",b=String(w),I=String(typeof l=="object"&&l!==null&&l.status||b),P={"저장 중...":"⟳ 저장 중...",저장됨:"✓ 저장됨","로컬 저장됨":"↓ 로컬 저장",수정됨:"● 수정됨",오류:"✕ 오류",복원됨:"↺ 복원됨",불러옴:"✓ 불러옴","발행 중...":"⟳ 발행 중...",발행됨:"✓ 발행됨","예약 중...":"⟳ 예약 중...",예약됨:"✓ 예약됨","삭제 중...":"⟳ 삭제 중...",삭제됨:"✓ 삭제됨"},A=I==="오류"||b.startsWith("오류")||((R=b.toLowerCase)==null?void 0:R.call(b).includes("error")),L=P[b]||(A?`✕ ${b}`:P[I]||b),C=A?"#ff8888":I==="저장됨"?"#90EE90":I==="발행됨"?"#93c5fd":I==="예약됨"?"#7dd3fc":I==="삭제됨"?"#fca5a5":I==="수정됨"?"#ffdd57":"rgba(255,255,255,0.7)",S={height:36,border:"1px solid rgba(255,255,255,0.24)",borderRadius:6,color:"#fff",cursor:"pointer",padding:"0 14px",display:"inline-flex",alignItems:"center",gap:8,fontSize:14,fontFamily:"'Segoe UI', '맑은 고딕', sans-serif",whiteSpace:"nowrap",letterSpacing:0};return t.jsxs("div",{style:{minHeight:48,background:a?"#1e1e1e":"#1a2332",display:"flex",alignItems:"center",padding:"8px 14px",flexShrink:0,color:"#fff",fontFamily:"'Segoe UI', '맑은 고딕', sans-serif",userSelect:"none"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:2,flexShrink:0},children:[t.jsx("div",{style:{width:24,height:24,marginRight:10,display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsx("span",{style:{fontSize:16,fontWeight:700,letterSpacing:0},children:"W"})}),x.map((j,M)=>t.jsx("button",{type:"button",onClick:j.fn,title:j.title,style:v,onMouseEnter:y,onMouseLeave:h,children:j.icon},M)),t.jsx("div",{style:{width:1,height:22,background:"rgba(255,255,255,0.2)",margin:"0 6px"}}),t.jsx("button",{type:"button",onClick:()=>s(!a),title:"다크 모드",style:v,onMouseEnter:y,onMouseLeave:h,children:a?t.jsx(Ma,{size:16}):t.jsx(Ea,{size:16})}),t.jsx("div",{style:{width:1,height:22,background:"rgba(255,255,255,0.2)",margin:"0 8px"}}),t.jsxs("button",{type:"button",onClick:m,title:"새 문서 만들기",style:{...S,background:"rgba(255,255,255,0.12)"},onMouseEnter:j=>{j.currentTarget.style.background="rgba(255,255,255,0.2)"},onMouseLeave:j=>{j.currentTarget.style.background="rgba(255,255,255,0.12)"},children:[t.jsx(Hn,{size:16}),"새 문서"]}),t.jsxs("button",{type:"button",onClick:g,title:"실제 블로그 발행 화면 미리보기",style:{...S,background:"rgba(255,255,255,0.12)",marginLeft:4},onMouseEnter:j=>{j.currentTarget.style.background="rgba(255,255,255,0.2)"},onMouseLeave:j=>{j.currentTarget.style.background="rgba(255,255,255,0.12)"},children:[t.jsx(Io,{size:16}),"미리보기"]}),t.jsxs("button",{type:"button",onClick:p,title:"블로그 작성 전용 문서 만들기",style:{...S,background:"rgba(37,99,235,0.38)",borderColor:"rgba(147,197,253,0.65)",marginLeft:4},onMouseEnter:j=>{j.currentTarget.style.background="rgba(37,99,235,0.55)"},onMouseLeave:j=>{j.currentTarget.style.background="rgba(37,99,235,0.38)"},children:[t.jsx(vo,{size:16}),"블로그 글쓰기"]}),t.jsxs("button",{type:"button",onClick:f,disabled:c,title:r.documentType==="blog"?"블로그 게시글 발행 상태로 저장":"현재 문서를 블로그 게시글로 발행",style:{...S,background:c?"#93c5fd":"#2563eb",borderColor:"#60a5fa",marginLeft:4,cursor:c?"default":"pointer"},onMouseEnter:j=>{c||(j.currentTarget.style.background="#1d4ed8")},onMouseLeave:j=>{j.currentTarget.style.background=c?"#93c5fd":"#2563eb"},children:[r.documentType==="blog"?t.jsx(Kt,{size:16}):t.jsx(vo,{size:16}),c?"처리 중":r.documentType==="blog"?"발행 저장":"게시글 발행"]})]}),t.jsx("div",{style:{flex:1,display:"flex",justifyContent:"center",alignItems:"center",minWidth:0},children:t.jsx("input",{ref:n,type:"text",value:r.title?r.title+" - Word":"문서 - Word",onChange:j=>{const M=j.target.value.replace(/ - Word$/,"");i(N=>({...N,title:M}))},onFocus:j=>{const M=j.target.value.lastIndexOf(" - Word");M>0&&j.target.setSelectionRange(0,M)},onKeyDown:j=>{j.key==="Enter"&&(j.preventDefault(),o==null||o.commands.focus())},style:{maxWidth:480,textAlign:"center",fontSize:14,fontWeight:500,border:"none",outline:"none",background:"transparent",color:"#fff",fontFamily:"'Segoe UI', '맑은 고딕', sans-serif",width:"100%",letterSpacing:0}})}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:4,flexShrink:0,minWidth:0,maxWidth:"38%"},children:[t.jsx("span",{title:b,style:{minWidth:0,maxWidth:280,fontSize:13,marginRight:6,color:C,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:L}),t.jsx("button",{type:"button",onClick:()=>k(!0),title:"문서 속성",style:{background:"none",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",padding:"4px 6px",borderRadius:2,display:"flex",alignItems:"center"},onMouseEnter:j=>{j.currentTarget.style.background="rgba(255,255,255,0.18)"},onMouseLeave:j=>{j.currentTarget.style.background="none"},children:t.jsx(za,{size:16})})]})]})}),mi="yj-editor-blog-prompt-model",hi="yj-editor-blog-image-model";let mo=null,Bt=null;async function bi(){return mo||Bt||(Bt=(async()=>{try{const e=await fetch("/api/media/ai-config",{credentials:"include"});if(!e.ok)return null;const o=await e.json();return mo=(o==null?void 0:o.data)||null,mo}catch{return null}finally{Bt=null}})(),Bt)}function xi(e){if(typeof localStorage>"u")return null;try{return localStorage.getItem(e)}catch{return null}}function yi(e,o){if(!(typeof localStorage>"u"))try{localStorage.setItem(e,o)}catch{}}function vi(){return xi(mi)}function ki(e){yi(mi,e)}function wi(){return xi(hi)}function ji(e){yi(hi,e)}const Si={"claude-haiku-4-5":"Claude Haiku 4.5 (빠름·저렴)","claude-sonnet-4-6":"Claude Sonnet 4.6 (균형)","claude-opus-4-7":"Claude Opus 4.7 (최고 품질·느림)"},Ci={"dall-e-3":"DALL-E 3 (권장·1792×1024)","dall-e-2":"DALL-E 2 (저렴·1024만)","gpt-image-1":"GPT Image 1 (최신)"},Ql="image/jpeg,image/png,image/webp,image/gif",ed=20*1024*1024,dn={height:38,border:"1px solid #cbd5e1",borderRadius:6,padding:"0 12px",fontSize:14,background:"#fff",color:"#111827",fontFamily:"'Segoe UI', '맑은 고딕', sans-serif",width:"100%"},He={display:"inline-flex",alignItems:"center",gap:6,height:36,padding:"0 14px",fontSize:13,border:"1px solid #cbd5e1",borderRadius:6,background:"#fff",color:"#1e293b",cursor:"pointer",fontWeight:500};function Ir(e){if(typeof document>"u")return null;const o=document.cookie.match(new RegExp(`(?:^|;\\s*)${e}=([^;]*)`));return o?decodeURIComponent(o[1]):null}async function td(e){var s;const o=new FormData;o.append("file",e),o.append("folder","blog");const r={},i=Ir("csrf-token");i&&(r["x-csrf-token"]=i);const n=await fetch("/api/media/upload",{method:"POST",credentials:"include",body:o,headers:r}),a=await n.json().catch(()=>({}));if(!n.ok)throw new Error((a==null?void 0:a.error)||"업로드에 실패했습니다");return(s=a.data)==null?void 0:s.url}async function od(e,o){var s;const r={"Content-Type":"application/json"},i=Ir("csrf-token");i&&(r["x-csrf-token"]=i);const n=await fetch("/api/media/generate",{method:"POST",credentials:"include",headers:r,body:JSON.stringify({prompt:e,size:"1792x1024",folder:"blog",model:o})}),a=await n.json().catch(()=>({}));if(!n.ok)throw new Error((a==null?void 0:a.error)||"AI 이미지 생성에 실패했습니다");return(s=a.data)==null?void 0:s.url}async function rd({title:e,body:o,model:r}){var l,d;const i={"Content-Type":"application/json"},n=Ir("csrf-token");n&&(i["x-csrf-token"]=n);const a=await fetch("/api/media/suggest-prompts",{method:"POST",credentials:"include",headers:i,body:JSON.stringify({title:e,body:o,count:1,scope:"cover",model:r})}),s=await a.json().catch(()=>({}));if(!a.ok)throw new Error((s==null?void 0:s.error)||"프롬프트 추천 실패");return((d=(l=s.data)==null?void 0:l[0])==null?void 0:d.prompt)||""}function nd(e){var r;return e?typeof DOMParser>"u"?e.replace(/<[^>]+>/g," "):(((r=new DOMParser().parseFromString(e,"text/html").body)==null?void 0:r.textContent)||"").replace(/\s+/g," ").trim().slice(0,8e3):""}function Ti({value:e,onChange:o,docContext:r,getEditorHtml:i}){var O,_;const[n,a]=u.useState("idle"),[s,l]=u.useState(!1),[d,m]=u.useState(""),[p,f]=u.useState(""),c=u.useRef(null),[g,k]=u.useState(null),[v,y]=u.useState(""),[h,x]=u.useState("");u.useEffect(()=>{let T=!0;return(async()=>{var F,W;const D=await bi();T&&(k(D),y(wi()||((F=D==null?void 0:D.image)==null?void 0:F.defaultModel)||"dall-e-3"),x(vi()||((W=D==null?void 0:D.prompt)==null?void 0:W.defaultModel)||"claude-haiku-4-5"))})(),()=>{T=!1}},[]);const w=T=>{y(T),ji(T)},b=T=>{x(T),ki(T)},I=u.useCallback(async T=>{f("");const D=T==null?void 0:T[0];if(D){if(!D.type.startsWith("image/")){f("이미지 파일만 업로드할 수 있습니다.");return}if(D.size>ed){f("파일 크기는 20MB 이하만 가능합니다.");return}a("uploading");try{const F=await td(D);F&&o(F)}catch(F){f(F.message||"업로드 실패")}finally{a("idle")}}},[o]),P=T=>{T.preventDefault(),a("dragging")},A=T=>{T.preventDefault()},L=T=>{T.preventDefault(),a("idle")},C=async T=>{var D;T.preventDefault(),a("idle"),await I((D=T.dataTransfer)==null?void 0:D.files)},S=()=>{var T;return(T=c.current)==null?void 0:T.click()},R=async T=>{await I(T.target.files),c.current&&(c.current.value="")},j=async()=>{const T=d.trim();if(T.length<4){f("프롬프트를 4자 이상 입력해주세요.");return}f(""),a("generating");try{const D=await od(T,v);D&&o(D)}catch(D){f(D.message||"생성 실패")}finally{a("idle")}},M=async()=>{f(""),a("suggesting");try{const T=i?i():"",D=nd(T),F=await rd({title:(r==null?void 0:r.title)||"",body:D,model:h});F?(m(F),l(!0)):f("추천된 프롬프트가 비어있습니다. 직접 작성해주세요.")}catch(T){f(T.message||"추천 실패")}finally{a("idle")}},N=n==="uploading"||n==="generating"||n==="suggesting",E=n==="dragging"||n==="uploading"||n==="generating";return t.jsxs("div",{style:{display:"grid",gap:6},children:[t.jsx("input",{ref:c,type:"file",accept:Ql,style:{display:"none"},onChange:R}),e?t.jsxs("div",{style:{position:"relative",display:"flex",gap:8,alignItems:"flex-start"},children:[t.jsx("img",{src:e,alt:"대표 이미지 미리보기",style:{width:96,height:64,objectFit:"cover",borderRadius:4,border:"1px solid #e2e8f0",background:"#f8fafc"},onError:T=>{T.currentTarget.style.opacity=.3}}),t.jsxs("div",{style:{flex:1,minWidth:0,display:"grid",gap:4},children:[t.jsx("input",{type:"text",value:e,onChange:T=>o(T.target.value),style:{...dn},placeholder:"https://..."}),t.jsxs("div",{style:{display:"flex",gap:6,flexWrap:"wrap"},children:[t.jsxs("button",{type:"button",onClick:S,style:He,disabled:N,children:[t.jsx(Ia,{size:11})," 파일 교체"]}),t.jsxs("button",{type:"button",onClick:()=>{d.trim()?j():l(!0)},style:He,disabled:N,title:d.trim()?"현재 프롬프트로 재생성":"AI 프롬프트 입력",children:[n==="generating"?t.jsx(Qe,{size:11,style:{animation:"spin 1s linear infinite"}}):t.jsx(zo,{size:11}),n==="generating"?" 생성 중":" AI로 재생성"]}),t.jsxs("button",{type:"button",onClick:()=>l(T=>!T),style:He,disabled:N,children:[t.jsx(Ce,{size:11})," ",s?"프롬프트 닫기":"프롬프트 보기/수정"]}),t.jsxs("button",{type:"button",onClick:()=>o(""),style:{...He,color:"#b91c1c"},disabled:N,children:[t.jsx(et,{size:11})," 제거"]})]})]})]}):t.jsx("div",{onDragEnter:P,onDragOver:A,onDragLeave:L,onDrop:C,onClick:S,role:"button",tabIndex:0,onKeyDown:T=>{(T.key==="Enter"||T.key===" ")&&(T.preventDefault(),S())},style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"14px 8px",border:`1px dashed ${E?"#1a3a6b":"#cbd5e1"}`,background:E?"rgba(26, 58, 107, 0.05)":"#fafafa",borderRadius:4,cursor:N?"wait":"pointer",color:"#475569",fontSize:11,transition:"border-color 120ms, background 120ms"},children:n==="uploading"||n==="generating"?t.jsxs(t.Fragment,{children:[t.jsx(Qe,{size:18,style:{animation:"spin 1s linear infinite"}}),t.jsx("span",{children:n==="uploading"?"업로드 중...":"AI 이미지 생성 중... (10~20초)"})]}):t.jsxs(t.Fragment,{children:[t.jsx(Lo,{size:18}),t.jsx("span",{children:"드래그&드롭 또는 클릭하여 파일 선택"}),t.jsx("span",{style:{fontSize:10,color:"#94a3b8"},children:"JPG · PNG · WEBP · GIF · 최대 20MB"})]})}),!e&&t.jsxs("div",{style:{display:"flex",gap:6,flexWrap:"wrap"},children:[t.jsxs("div",{style:{position:"relative",flex:1,minWidth:180},children:[t.jsx(jt,{size:12,style:{position:"absolute",left:8,top:9,color:"#94a3b8"}}),t.jsx("input",{type:"text",placeholder:"또는 URL 직접 입력",style:{...dn,paddingLeft:26},onKeyDown:T=>{if(T.key==="Enter"){T.preventDefault();const D=T.currentTarget.value.trim();D&&o(D)}},onBlur:T=>{const D=T.currentTarget.value.trim();D&&o(D)}})]}),t.jsxs("button",{type:"button",onClick:()=>l(T=>!T),style:He,disabled:N,children:[t.jsx(Ce,{size:11})," AI로 생성"]}),t.jsxs("button",{type:"button",onClick:M,style:He,disabled:N,title:"블로그 제목·본문을 분석해 프롬프트를 자동 추천",children:[n==="suggesting"?t.jsx(Qe,{size:11,style:{animation:"spin 1s linear infinite"}}):t.jsx(Xn,{size:11}),n==="suggesting"?" 분석 중":" 프롬프트 추천"]})]}),s&&t.jsxs("div",{style:{display:"grid",gap:8,padding:12,border:"1px solid #e2e8f0",borderRadius:6,background:"#f8fafc"},children:[t.jsx("textarea",{value:d,onChange:T=>m(T.target.value),placeholder:"예: 한국 법률사무소 분위기, 책장과 따뜻한 조명, 전문적이고 신뢰감 있는 일러스트 스타일",rows:3,style:{fontSize:14,fontFamily:"inherit",padding:10,border:"1px solid #cbd5e1",borderRadius:6,resize:"vertical",minHeight:64},disabled:N}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:8},children:[t.jsxs("label",{style:{display:"grid",gap:4,fontSize:12,color:"#475569"},children:[t.jsx("span",{children:"이미지 모델"}),t.jsx("select",{value:v,onChange:T=>w(T.target.value),disabled:N,style:{height:36,padding:"0 10px",fontSize:13,border:"1px solid #cbd5e1",borderRadius:6,background:"#fff"},children:(((O=g==null?void 0:g.image)==null?void 0:O.allowedModels)||["dall-e-3"]).map(T=>{var D;return t.jsxs("option",{value:T,children:[Ci[T]||T,T===((D=g==null?void 0:g.image)==null?void 0:D.defaultModel)?" · 기본":""]},T)})})]}),t.jsxs("label",{style:{display:"grid",gap:4,fontSize:12,color:"#475569"},children:[t.jsx("span",{children:"프롬프트 추천 모델 (Claude)"}),t.jsx("select",{value:h,onChange:T=>b(T.target.value),disabled:N,style:{height:36,padding:"0 10px",fontSize:13,border:"1px solid #cbd5e1",borderRadius:6,background:"#fff"},children:(((_=g==null?void 0:g.prompt)==null?void 0:_.allowedModels)||["claude-haiku-4-5"]).map(T=>{var D;return t.jsxs("option",{value:T,children:[Si[T]||T,T===((D=g==null?void 0:g.prompt)==null?void 0:D.defaultModel)?" · 기본":""]},T)})})]})]}),t.jsxs("div",{style:{display:"flex",gap:6,justifyContent:"flex-end"},children:[t.jsx("button",{type:"button",onClick:()=>{l(!1),m(""),f("")},style:He,disabled:N,children:"취소"}),t.jsxs("button",{type:"button",onClick:j,style:{...He,background:"#1a3a6b",color:"#fff",borderColor:"#1a3a6b",opacity:N?.6:1},disabled:N,children:[n==="generating"?t.jsx(Qe,{size:14,style:{animation:"spin 1s linear infinite"}}):t.jsx(Ce,{size:14}),n==="generating"?"생성 중":"이미지 생성"]})]}),t.jsx("span",{style:{fontSize:11,color:"#64748b"},children:"모델 변경은 같은 단말에서 다음 세션까지 기억됩니다. 1792×1024 · 평균 10~20초."})]}),p&&t.jsx("span",{style:{fontSize:11,color:"#b91c1c"},children:p})]})}const id={position:"fixed",inset:0,background:"rgba(15, 23, 42, 0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16},ad={width:"min(640px, 100%)",maxHeight:"90vh",overflow:"auto",background:"#fff",borderRadius:8,boxShadow:"0 12px 40px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column"},sd={display:"flex",alignItems:"center",gap:8,padding:"14px 18px",borderBottom:"1px solid #e2e8f0",fontSize:14,fontWeight:600,color:"#0f172a"},Qo={padding:"14px 18px",display:"grid",gap:10},ld={fontSize:12,fontFamily:"inherit",padding:8,border:"1px solid #cbd5e1",borderRadius:3,width:"100%",minHeight:60,resize:"vertical"},$e={display:"inline-flex",alignItems:"center",gap:4,height:28,padding:"0 10px",fontSize:11,border:"1px solid #cbd5e1",borderRadius:3,background:"#fff",color:"#1e293b",cursor:"pointer"};function dd(e){if(typeof document>"u")return null;const o=document.cookie.match(new RegExp(`(?:^|;\\s*)${e}=([^;]*)`));return o?decodeURIComponent(o[1]):null}async function er(e,o){const r={"Content-Type":"application/json"},i=dd("csrf-token");i&&(r["x-csrf-token"]=i);const n=await fetch(e,{method:"POST",credentials:"include",headers:r,body:JSON.stringify(o)}),a=await n.json().catch(()=>({}));if(!n.ok)throw new Error((a==null?void 0:a.error)||"요청 실패");return a}function cd(e){var r;return e?typeof DOMParser>"u"?e.replace(/<[^>]+>/g," "):(((r=new DOMParser().parseFromString(e,"text/html").body)==null?void 0:r.textContent)||"").replace(/\s+/g," ").trim().slice(0,8e3):""}function Mi({open:e,onClose:o,editor:r,doc:i}){var S,R;const[n,a]=u.useState("idle"),[s,l]=u.useState([]),[d,m]=u.useState(""),[p,f]=u.useState(null),[c,g]=u.useState(""),[k,v]=u.useState("");u.useEffect(()=>{if(!e)return;let j=!0;return(async()=>{var N,E;const M=await bi();j&&(f(M),g(wi()||((N=M==null?void 0:M.image)==null?void 0:N.defaultModel)||"dall-e-3"),v(vi()||((E=M==null?void 0:M.prompt)==null?void 0:E.defaultModel)||"claude-haiku-4-5"))})(),()=>{j=!1}},[e]);const y=j=>{g(j),ji(j)},h=j=>{v(j),ki(j)};if(u.useEffect(()=>{e||(a("idle"),l([]),m(""))},[e]),!e)return null;const x=async()=>{var N;m("");const j=((N=r==null?void 0:r.getHTML)==null?void 0:N.call(r))||"",M=cd(j);if(M.length<30&&(!(i!=null&&i.title)||i.title.length<5)){m("프롬프트 추천을 위해 본문을 좀 더 입력해주세요. (최소 30자)");return}a("suggesting");try{const O=((await er("/api/media/suggest-prompts",{title:(i==null?void 0:i.title)||"",body:M,count:3,scope:"inline",model:k})).data||[]).map((_,T)=>({id:`sug_${Date.now()}_${T}`,prompt:_.prompt,summary:_.summary,status:"pending",url:null}));l(O),a("reviewing")}catch(E){m(E.message||"추천 실패"),a("idle")}},w=(j,M)=>l(N=>N.map(E=>E.id===j?{...E,...M}:E)),b=j=>l(M=>M.filter(N=>N.id!==j)),I=async j=>{var E;const M=s.find(O=>O.id===j);if(!M)return;const N=M.prompt.trim();if(N.length<4){m("프롬프트가 너무 짧습니다.");return}m(""),w(j,{status:"generating",error:null});try{const _=(E=(await er("/api/media/generate",{prompt:N,size:"1792x1024",folder:"blog",model:c})).data)==null?void 0:E.url;if(!_)throw new Error("이미지 URL 없음");w(j,{status:"done",url:_})}catch(O){w(j,{status:"failed",error:O.message})}},P=j=>{const M=s.find(N=>N.id===j);if(!(!(M!=null&&M.url)||!r))try{r.chain().focus("end").insertContent({type:"image",attrs:{src:M.url,alt:M.summary||"AI generated image"}}).run(),r.chain().focus("end").insertContent("<p></p>").run()}catch{}},A=()=>l(j=>[...j,{id:`cust_${Date.now()}`,prompt:"",summary:"사용자 추가",status:"pending",url:null}]),L=async()=>{var M;m("");const j=s.filter(N=>N.prompt.trim().length>=4);if(j.length===0){m("생성할 프롬프트가 없습니다. 최소 1개 이상 작성해주세요.");return}a("generating");for(const N of j)try{w(N.id,{status:"generating"});const O=(M=(await er("/api/media/generate",{prompt:N.prompt.trim(),size:"1792x1024",folder:"blog",model:c})).data)==null?void 0:M.url;if(!O)throw new Error("이미지 URL 없음");w(N.id,{status:"done",url:O})}catch(E){w(N.id,{status:"failed",error:E.message})}r&&l(N=>(N.forEach(E=>{if(E.status==="done"&&E.url)try{r.chain().focus("end").insertContent({type:"image",attrs:{src:E.url,alt:E.summary||"AI generated image"}}).run(),r.chain().focus("end").insertContent("<p></p>").run()}catch{}}),N)),a("done")},C=()=>{n==="generating"&&!window.confirm("이미지 생성이 진행 중입니다. 정말 닫으시겠습니까? (지금까지 생성된 이미지는 본문에 들어가지 않을 수 있습니다)")||o()};return t.jsx("div",{style:id,onClick:j=>{j.target===j.currentTarget&&C()},children:t.jsxs("div",{style:ad,children:[t.jsxs("div",{style:sd,children:[t.jsx(Ce,{size:16,color:"#1a3a6b"}),t.jsx("span",{style:{flex:1},children:"AI 본문 이미지 자동 추가"}),t.jsx("button",{type:"button",onClick:C,style:{...$e,height:26,padding:"0 8px"},children:t.jsx(et,{size:12})})]}),n==="idle"&&t.jsxs("div",{style:Qo,children:[t.jsxs("p",{style:{fontSize:13,color:"#475569",lineHeight:1.7,margin:0},children:["본문 내용을 분석해 어울리는 이미지 프롬프트 3개를 추천합니다.",t.jsx("br",{}),"각 프롬프트를 검토·수정·삭제한 뒤 이미지를 생성하면 본문 끝에 순서대로 삽입됩니다."]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:10},children:[t.jsxs("label",{style:{display:"grid",gap:4,fontSize:12,color:"#475569"},children:[t.jsx("span",{children:"프롬프트 추천 모델 (Claude)"}),t.jsx("select",{value:k,onChange:j=>h(j.target.value),style:{height:36,padding:"0 10px",fontSize:13,border:"1px solid #cbd5e1",borderRadius:6,background:"#fff"},children:(((S=p==null?void 0:p.prompt)==null?void 0:S.allowedModels)||["claude-haiku-4-5"]).map(j=>{var M;return t.jsxs("option",{value:j,children:[Si[j]||j,j===((M=p==null?void 0:p.prompt)==null?void 0:M.defaultModel)?" · 기본":""]},j)})})]}),t.jsxs("label",{style:{display:"grid",gap:4,fontSize:12,color:"#475569"},children:[t.jsx("span",{children:"이미지 생성 모델 (OpenAI)"}),t.jsx("select",{value:c,onChange:j=>y(j.target.value),style:{height:36,padding:"0 10px",fontSize:13,border:"1px solid #cbd5e1",borderRadius:6,background:"#fff"},children:(((R=p==null?void 0:p.image)==null?void 0:R.allowedModels)||["dall-e-3"]).map(j=>{var M;return t.jsxs("option",{value:j,children:[Ci[j]||j,j===((M=p==null?void 0:p.image)==null?void 0:M.defaultModel)?" · 기본":""]},j)})})]})]}),t.jsxs("p",{style:{fontSize:12,color:"#475569",lineHeight:1.7,margin:0},children:["본문 내용을 분석해 어울리는 이미지 프롬프트 3개를 추천합니다.",t.jsx("br",{}),"각 프롬프트를 검토·수정·삭제한 뒤 이미지를 생성하면 본문 끝에 순서대로 삽입됩니다."]}),t.jsx("div",{style:{display:"flex",justifyContent:"flex-end"},children:t.jsxs("button",{type:"button",onClick:x,style:{...$e,height:36,padding:"0 16px",background:"#1a3a6b",color:"#fff",borderColor:"#1a3a6b"},children:[t.jsx(Xn,{size:14})," 프롬프트 추천 받기"]})})]}),n==="suggesting"&&t.jsxs("div",{style:{...Qo,alignItems:"center",justifyItems:"center",padding:32},children:[t.jsx(Qe,{size:28,style:{animation:"spin 1s linear infinite",color:"#1a3a6b"}}),t.jsx("span",{style:{fontSize:12,color:"#475569"},children:"본문을 분석해 프롬프트를 만들고 있어요... (5~10초)"})]}),(n==="reviewing"||n==="generating"||n==="done")&&t.jsxs("div",{style:Qo,children:[t.jsxs("div",{style:{fontSize:12,color:"#475569"},children:["아래 프롬프트는 자유롭게 수정·삭제·추가할 수 있습니다.",n==="done"&&" 생성이 완료된 이미지는 본문 끝에 추가되었습니다."]}),s.length===0&&t.jsx("div",{style:{fontSize:12,color:"#94a3b8",padding:12,textAlign:"center"},children:'프롬프트가 모두 삭제되었습니다. "프롬프트 추가" 로 직접 작성해 보세요.'}),s.map((j,M)=>t.jsxs("div",{style:{display:"grid",gap:6,padding:10,border:"1px solid #e2e8f0",borderRadius:4,background:j.status==="done"?"#f0fdf4":j.status==="failed"?"#fef2f2":"#f8fafc"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#475569",flexWrap:"wrap"},children:[t.jsxs("strong",{style:{color:"#0f172a"},children:["이미지 ",M+1]}),j.summary&&t.jsxs("span",{children:["· ",j.summary]}),t.jsx("span",{style:{flex:1}}),j.status==="generating"&&t.jsx(Qe,{size:12,style:{animation:"spin 1s linear infinite",color:"#1a3a6b"}}),j.status==="done"&&t.jsx("span",{style:{color:"#16a34a"},children:"✓ 생성 완료"}),j.status==="failed"&&t.jsxs("span",{style:{color:"#b91c1c"},children:["✕ 실패: ",j.error]}),t.jsxs("button",{type:"button",onClick:()=>b(j.id),style:{...$e,height:22,padding:"0 6px",color:"#b91c1c"},disabled:j.status==="generating",children:[t.jsx(Ve,{size:11})," 삭제"]})]}),t.jsx("textarea",{value:j.prompt,onChange:N=>w(j.id,{prompt:N.target.value,status:j.status==="done"?"pending":j.status}),placeholder:"DALL-E 3 영문 프롬프트 (직접 작성도 가능)",style:ld,disabled:j.status==="generating"}),j.url&&t.jsx("img",{src:j.url,alt:j.summary||"",style:{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:3,border:"1px solid #e2e8f0"}}),(j.status==="done"||j.status==="failed")&&t.jsxs("div",{style:{display:"flex",gap:6,flexWrap:"wrap"},children:[t.jsxs("button",{type:"button",onClick:()=>I(j.id),style:{...$e,height:26},children:[t.jsx(zo,{size:11})," 이 이미지만 재생성"]}),j.status==="done"&&j.url&&t.jsxs("button",{type:"button",onClick:()=>P(j.id),style:{...$e,height:26},children:[t.jsx(Wr,{size:11})," 본문에 다시 삽입"]})]})]},j.id)),t.jsxs("div",{style:{display:"flex",gap:6,flexWrap:"wrap"},children:[t.jsxs("button",{type:"button",onClick:A,style:$e,disabled:n==="generating",children:[t.jsx(Wr,{size:11})," 프롬프트 추가"]}),t.jsx("span",{style:{flex:1}}),t.jsx("button",{type:"button",onClick:C,style:$e,disabled:n==="generating",children:n==="done"?"닫기":"취소"}),n!=="done"&&t.jsx("button",{type:"button",onClick:L,style:{...$e,height:32,background:"#1a3a6b",color:"#fff",borderColor:"#1a3a6b",opacity:n==="generating"?.6:1},disabled:n==="generating"||s.length===0,children:n==="generating"?t.jsxs(t.Fragment,{children:[t.jsx(Qe,{size:11,style:{animation:"spin 1s linear infinite"}})," 생성 중"]}):t.jsxs(t.Fragment,{children:[t.jsx(Ce,{size:11})," 이미지 생성 및 본문 삽입"]})})]}),t.jsxs("span",{style:{fontSize:10,color:"#64748b"},children:["· DALL-E 3 (1792x1024) · 1장당 약 10~20초·$0.04 · 순차 생성",t.jsx("br",{}),"· 본문 맨 끝에 추가됩니다. 위치는 추가 후 직접 드래그·이동하세요."]})]}),d&&t.jsx("div",{style:{padding:"8px 18px",color:"#b91c1c",fontSize:12,borderTop:"1px solid #fecaca",background:"#fef2f2"},children:d})]})})}const cn=[{label:"맑은 고딕",value:"맑은 고딕, Malgun Gothic, sans-serif"},{label:"나눔고딕",value:"Nanum Gothic, sans-serif"},{label:"본명조",value:"Nanum Myeongjo, serif"},{label:"Noto Sans KR",value:"Noto Sans KR, sans-serif"},{label:"Pretendard",value:"Pretendard, sans-serif"}],ud=[11,12,13,14,15,16,18,20,24,28,32,40],pd=["#111827","#374151","#6b7280","#dc2626","#ea580c","#ca8a04","#16a34a","#0891b2","#2563eb","#7c3aed","#db2777"],fd=["transparent","#fef9c3","#fee2e2","#dcfce7","#dbeafe","#fce7f3","#e9d5ff"],To={display:"inline-flex",alignItems:"center",justifyContent:"center",width:36,height:36,padding:0,border:"none",background:"transparent",cursor:"pointer",color:"#374151",borderRadius:6},gd={...To,background:"#e0e7ff",color:"#1e40af"},md={display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 14px",border:"none",background:"transparent",cursor:"pointer",color:"#374151",borderRadius:8,fontSize:12,fontFamily:"inherit",minWidth:64};function ce({active:e,onClick:o,title:r,children:i,disabled:n}){return t.jsx("button",{type:"button",onMouseDown:a=>{a.preventDefault(),n||o==null||o()},title:r,"aria-label":r,disabled:n,style:{...e?gd:To,opacity:n?.4:1,cursor:n?"default":"pointer"},onMouseEnter:a=>{!n&&!e&&(a.currentTarget.style.background="#f3f4f6")},onMouseLeave:a=>{e||(a.currentTarget.style.background="transparent")},children:i})}function Ye({icon:e,label:o,onClick:r,disabled:i}){return t.jsxs("button",{type:"button",onMouseDown:n=>{n.preventDefault(),i||r==null||r()},disabled:i,title:o,style:{...md,opacity:i?.4:1,cursor:i?"default":"pointer"},onMouseEnter:n=>{i||(n.currentTarget.style.background="#f3f4f6")},onMouseLeave:n=>{n.currentTarget.style.background="transparent"},children:[t.jsx("span",{style:{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28},children:e}),t.jsx("span",{style:{fontSize:11,lineHeight:1,fontWeight:500},children:o})]})}function un({open:e,onClose:o,colors:r,onPick:i,label:n}){return e?t.jsx("div",{role:"dialog","aria-label":n,style:{position:"absolute",top:"100%",left:0,marginTop:4,background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,boxShadow:"0 6px 20px rgba(0,0,0,0.08)",padding:8,display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:4,zIndex:100},onMouseDown:a=>a.stopPropagation(),children:r.map(a=>t.jsx("button",{type:"button",title:a,onClick:()=>{i(a),o()},style:{width:24,height:24,borderRadius:4,border:a==="transparent"?"1px dashed #d1d5db":"1px solid #e5e7eb",background:a==="transparent"?"#fff":a,cursor:"pointer",padding:0}},a))}):null}function hd({editor:e,doc:o,setDoc:r,saveStatus:i,handleSave:n,handlePublishBlog:a,isPublishing:s,setShowBackstage:l,onSwitchToWordMode:d}){var W;const[m,p]=u.useState(!0),[f,c]=u.useState(!1),[g,k]=u.useState(!1),[v,y]=u.useState(!1),[h,x]=u.useState(!1),w=u.useRef(null),b=o.status==="scheduled",I=!b||Er(o.scheduledPublishAt),P=z=>r(U=>({...U,...z})),A=((W=e==null?void 0:e.getHTML)==null?void 0:W.call(e))||"",L=typeof i=="object"?(i==null?void 0:i.status)||"":i||"",C=L==="저장됨"?"#16a34a":L==="발행됨"?"#2563eb":L==="수정됨"?"#ca8a04":L==="오류"||String(L).startsWith("오류")?"#dc2626":"#9ca3af",S=()=>{var z;return(z=w.current)==null?void 0:z.click()},R=async z=>{var G,B;const U=(G=z.target.files)==null?void 0:G[0];if(!U||!e)return;z.target.value="";const K=new FormData;K.append("file",U),K.append("folder","blog");const $=(document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/)||[])[1],V=$?{"x-csrf-token":decodeURIComponent($)}:{};try{const Y=await(await fetch("/api/media/upload",{method:"POST",credentials:"include",headers:V,body:K})).json();(B=Y==null?void 0:Y.data)!=null&&B.url&&e.chain().focus().setImage({src:Y.data.url,alt:U.name}).run()}catch{}},j=()=>e==null?void 0:e.chain().focus().toggleBlockquote().run(),M=()=>e==null?void 0:e.chain().focus().setHorizontalRule().run(),N=()=>{const z=window.prompt("링크 URL을 입력하세요","https://");z&&z.startsWith("http")&&(e==null||e.chain().focus().extendMarkRange("link").setLink({href:z}).run())},E=()=>e==null?void 0:e.chain().focus().toggleCodeBlock().run(),O=()=>e==null?void 0:e.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:!0}).run(),_=(z,U)=>{try{return(e==null?void 0:e.isActive(z,U))??!1}catch{return!1}},T=z=>e==null?void 0:e.chain().focus().toggleHeading({level:z}).run(),D=()=>e==null?void 0:e.chain().focus().setParagraph().run(),F=_("heading",{level:1})?"제목 1":_("heading",{level:2})?"제목 2":_("heading",{level:3})?"제목 3":"본문";return t.jsxs("div",{style:{display:"flex",flexDirection:"column",flex:1,background:"#fff",height:"100%",overflow:"hidden",fontFamily:"'Pretendard', '맑은 고딕', sans-serif"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",padding:"10px 18px",borderBottom:"1px solid #f1f5f9",flexShrink:0,gap:12},children:[t.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:8,fontSize:18,fontWeight:700,color:"#1a3a6b"},children:[t.jsx("span",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,background:"rgba(26,58,107,0.08)",border:"1px solid rgba(26,58,107,0.15)",padding:5},children:t.jsx(Yi,{size:20,color:"#1a3a6b"})}),t.jsx("span",{children:"blog"})]}),t.jsx("span",{style:{flex:1}}),t.jsxs("span",{style:{fontSize:13,color:C,fontWeight:500},children:["저장 · ",L||"—"]}),t.jsxs("button",{type:"button",onClick:()=>n==null?void 0:n(!1),style:{height:36,padding:"0 14px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff",color:"#374151",cursor:"pointer",fontWeight:500,display:"inline-flex",alignItems:"center",gap:6},children:[t.jsx(Vn,{size:14})," 저장"]}),t.jsxs("button",{type:"button",onClick:()=>l==null?void 0:l(!0),style:{height:36,padding:"0 14px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff",color:"#374151",cursor:"pointer",fontWeight:500,display:"inline-flex",alignItems:"center",gap:6},title:"실제 게시 화면 미리보기",children:[t.jsx(Io,{size:14})," 미리보기"]}),t.jsxs("button",{type:"button",onClick:a,disabled:s||!I,style:{height:36,padding:"0 18px",fontSize:14,fontWeight:600,border:"none",borderRadius:6,background:s||!I?"#94a3b8":"#03c75a",color:"#fff",cursor:s||!I?"default":"pointer",display:"inline-flex",alignItems:"center",gap:6},children:[t.jsx(Kt,{size:14}),s?"처리 중":b?"예약 발행":"발행"]}),t.jsxs("div",{style:{position:"relative"},children:[t.jsx("button",{type:"button",onClick:()=>c(z=>!z),style:{...To,width:32,height:36},"aria-label":"더 보기",children:t.jsx(Yn,{size:18})}),f&&t.jsxs("div",{style:{position:"absolute",right:0,top:"100%",marginTop:4,background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,boxShadow:"0 6px 20px rgba(0,0,0,0.08)",padding:4,minWidth:180,zIndex:100},onMouseLeave:()=>c(!1),children:[t.jsx("button",{type:"button",onClick:()=>{c(!1),d==null||d()},style:{width:"100%",padding:"10px 12px",border:"none",background:"transparent",textAlign:"left",fontSize:13,cursor:"pointer",borderRadius:4},onMouseEnter:z=>{z.currentTarget.style.background="#f3f4f6"},onMouseLeave:z=>{z.currentTarget.style.background="transparent"},children:"Word 스타일로 전환"}),t.jsxs("button",{type:"button",onClick:()=>{c(!1),p(z=>!z)},style:{width:"100%",padding:"10px 12px",border:"none",background:"transparent",textAlign:"left",fontSize:13,cursor:"pointer",borderRadius:4},onMouseEnter:z=>{z.currentTarget.style.background="#f3f4f6"},onMouseLeave:z=>{z.currentTarget.style.background="transparent"},children:["메타 패널 ",m?"닫기":"열기"]})]})]})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",padding:"8px 18px",borderBottom:"1px solid #f1f5f9",flexShrink:0,gap:4,overflowX:"auto"},children:[t.jsx(Ye,{icon:t.jsx(Lo,{size:20}),label:"사진",onClick:S}),t.jsx(Ye,{icon:t.jsx(wr,{size:20}),label:"인용구",onClick:j}),t.jsx(Ye,{icon:t.jsx(Gn,{size:20}),label:"구분선",onClick:M}),t.jsx(Ye,{icon:t.jsx(jt,{size:20}),label:"링크",onClick:N}),t.jsx(Ye,{icon:t.jsx(Pa,{size:20}),label:"표",onClick:O}),t.jsx(Ye,{icon:t.jsx(Aa,{size:20}),label:"코드",onClick:E}),t.jsx(Ye,{icon:t.jsx(Ce,{size:20,color:"#1a3a6b"}),label:"AI 일러스트",onClick:()=>x(!0)}),t.jsx("span",{style:{flex:1}}),t.jsx("input",{ref:w,type:"file",accept:"image/*",style:{display:"none"},onChange:R})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",padding:"6px 18px",borderBottom:"1px solid #e5e7eb",flexShrink:0,gap:6,flexWrap:"wrap",background:"#fafafa"},children:[t.jsxs("select",{value:_("heading",{level:1})?"h1":_("heading",{level:2})?"h2":_("heading",{level:3})?"h3":"p",onChange:z=>{const U=z.target.value;U==="p"?D():T(Number(U.slice(1)))},style:{height:32,padding:"0 8px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff"},"aria-label":"단락 종류",title:F,children:[t.jsx("option",{value:"p",children:"본문"}),t.jsx("option",{value:"h1",children:"제목 1"}),t.jsx("option",{value:"h2",children:"제목 2"}),t.jsx("option",{value:"h3",children:"제목 3"})]}),t.jsx("select",{onChange:z=>e==null?void 0:e.chain().focus().setFontFamily(z.target.value).run(),defaultValue:cn[0].value,style:{height:32,padding:"0 8px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff",minWidth:110},"aria-label":"글꼴",children:cn.map(z=>t.jsx("option",{value:z.value,children:z.label},z.value))}),t.jsx("select",{onChange:z=>e==null?void 0:e.chain().focus().setFontSize(`${z.target.value}pt`).run(),defaultValue:"11",style:{height:32,padding:"0 6px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff",width:60},"aria-label":"글꼴 크기",children:ud.map(z=>t.jsx("option",{value:z,children:z},z))}),t.jsx("div",{style:{width:1,height:22,background:"#e5e7eb",margin:"0 4px"}}),t.jsx(ce,{active:_("bold"),onClick:()=>e==null?void 0:e.chain().focus().toggleBold().run(),title:"굵게 (Ctrl+B)",children:t.jsx(yt,{size:16})}),t.jsx(ce,{active:_("italic"),onClick:()=>e==null?void 0:e.chain().focus().toggleItalic().run(),title:"기울임 (Ctrl+I)",children:t.jsx(vt,{size:16})}),t.jsx(ce,{active:_("underline"),onClick:()=>e==null?void 0:e.chain().focus().toggleUnderline().run(),title:"밑줄 (Ctrl+U)",children:t.jsx(kt,{size:16})}),t.jsx(ce,{active:_("strike"),onClick:()=>e==null?void 0:e.chain().focus().toggleStrike().run(),title:"취소선",children:t.jsx(hr,{size:16})}),t.jsxs("div",{style:{position:"relative"},children:[t.jsx(ce,{onClick:()=>{k(z=>!z),y(!1)},title:"글자색",children:t.jsxs("span",{style:{display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1},children:[t.jsx("span",{style:{fontSize:13,fontWeight:700},children:"A"}),t.jsx("span",{style:{width:16,height:3,background:"#dc2626",marginTop:1}})]})}),t.jsx(un,{open:g,onClose:()=>k(!1),colors:pd,onPick:z=>e==null?void 0:e.chain().focus().setColor(z).run(),label:"글자색 선택"})]}),t.jsxs("div",{style:{position:"relative"},children:[t.jsx(ce,{onClick:()=>{y(z=>!z),k(!1)},title:"형광펜",children:t.jsx("span",{style:{display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1},children:t.jsx("span",{style:{fontSize:13,fontWeight:700,background:"#fef9c3",padding:"0 2px"},children:"A"})})}),t.jsx(un,{open:v,onClose:()=>y(!1),colors:fd,onPick:z=>{z==="transparent"?e==null||e.chain().focus().unsetHighlight().run():e==null||e.chain().focus().setHighlight({color:z}).run()},label:"형광펜 색상 선택"})]}),t.jsx("div",{style:{width:1,height:22,background:"#e5e7eb",margin:"0 4px"}}),t.jsx(ce,{active:_({textAlign:"left"}),onClick:()=>e==null?void 0:e.chain().focus().setTextAlign("left").run(),title:"왼쪽 정렬",children:t.jsx(wt,{size:16})}),t.jsx(ce,{active:_({textAlign:"center"}),onClick:()=>e==null?void 0:e.chain().focus().setTextAlign("center").run(),title:"가운데 정렬",children:t.jsx(Jt,{size:16})}),t.jsx(ce,{active:_({textAlign:"right"}),onClick:()=>e==null?void 0:e.chain().focus().setTextAlign("right").run(),title:"오른쪽 정렬",children:t.jsx(Zt,{size:16})}),t.jsx(ce,{active:_({textAlign:"justify"}),onClick:()=>e==null?void 0:e.chain().focus().setTextAlign("justify").run(),title:"양쪽 맞춤",children:t.jsx(kr,{size:16})}),t.jsx("div",{style:{width:1,height:22,background:"#e5e7eb",margin:"0 4px"}}),t.jsx(ce,{active:_("bulletList"),onClick:()=>e==null?void 0:e.chain().focus().toggleBulletList().run(),title:"글머리 기호",children:t.jsx(Yt,{size:16})}),t.jsx(ce,{active:_("orderedList"),onClick:()=>e==null?void 0:e.chain().focus().toggleOrderedList().run(),title:"번호 매기기",children:t.jsx(Po,{size:16})}),t.jsx(ce,{onClick:()=>e==null?void 0:e.chain().focus().sinkListItem("listItem").run(),title:"들여쓰기",children:t.jsx(vr,{size:16})}),t.jsx(ce,{onClick:()=>e==null?void 0:e.chain().focus().liftListItem("listItem").run(),title:"내어쓰기",children:t.jsx(yr,{size:16})}),t.jsx("div",{style:{width:1,height:22,background:"#e5e7eb",margin:"0 4px"}}),t.jsx(ce,{active:_("superscript"),onClick:()=>e==null?void 0:e.chain().focus().toggleSuperscript().run(),title:"위 첨자",children:t.jsx(On,{size:16})}),t.jsx(ce,{active:_("subscript"),onClick:()=>e==null?void 0:e.chain().focus().toggleSubscript().run(),title:"아래 첨자",children:t.jsx(Fn,{size:16})}),t.jsx("span",{style:{flex:1}}),t.jsxs("button",{type:"button",onClick:()=>p(z=>!z),style:{height:32,padding:"0 12px",fontSize:12,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,fontWeight:500},title:"블로그 메타 / SEO / 대표 이미지 패널",children:[m?t.jsx(et,{size:14}):t.jsx(Bn,{size:14}),m?"메타 닫기":"메타 열기"]})]}),t.jsxs("div",{style:{flex:1,display:"flex",overflow:"hidden",minHeight:0},children:[t.jsx("div",{style:{flex:1,overflowY:"auto",display:"flex",justifyContent:"center",padding:"32px 24px 80px"},children:t.jsxs("div",{style:{width:"100%",maxWidth:760},children:[t.jsx("input",{type:"text",value:o.title||"",onChange:z=>P({title:z.target.value}),placeholder:"제목",style:{width:"100%",border:"none",outline:"none",fontSize:32,fontWeight:700,color:"#111827",padding:"12px 0",borderBottom:"1px solid #e5e7eb",background:"transparent",marginBottom:24,fontFamily:"inherit"}}),t.jsx("div",{className:"blog-simple-editor-content",style:{minHeight:"60vh",fontSize:16,lineHeight:1.85,color:"#1f2937"},children:t.jsx(Do,{editor:e})})]})}),m&&t.jsxs("aside",{style:{width:360,flexShrink:0,borderLeft:"1px solid #e5e7eb",background:"#fafafa",overflowY:"auto",padding:18,display:"grid",gap:16,alignContent:"start"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[t.jsx("strong",{style:{fontSize:14,color:"#0f172a"},children:"발행 설정"}),t.jsx("button",{type:"button",onClick:()=>p(!1),style:{...To,width:28,height:28},title:"패널 닫기",children:t.jsx(et,{size:14})})]}),t.jsxs("label",{style:{display:"grid",gap:6},children:[t.jsx("span",{style:{fontSize:12,color:"#475569",fontWeight:500},children:"게시판"}),t.jsx("select",{value:o.blogCategory||"construction_realestate",onChange:z=>P({blogCategory:z.target.value,documentType:"blog"}),style:{height:36,padding:"0 10px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff"},children:xt.map(z=>t.jsx("option",{value:z.value,children:z.label},z.value))})]}),t.jsxs("label",{style:{display:"grid",gap:6},children:[t.jsx("span",{style:{fontSize:12,color:"#475569",fontWeight:500},children:"공개 상태"}),t.jsxs("select",{value:o.status||"draft",onChange:z=>P({status:z.target.value}),style:{height:36,padding:"0 10px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff"},children:[t.jsx("option",{value:"draft",children:"초안 저장"}),t.jsx("option",{value:"published",children:"즉시 발행"}),t.jsx("option",{value:"scheduled",children:"예약 발행"})]})]}),b&&t.jsxs("label",{style:{display:"grid",gap:6},children:[t.jsx("span",{style:{fontSize:12,color:"#475569",fontWeight:500},children:"예약 일시"}),t.jsx("input",{type:"datetime-local",value:o.scheduledPublishAt||"",onChange:z=>P({scheduledPublishAt:z.target.value}),style:{height:36,padding:"0 10px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff"}}),!I&&t.jsx("span",{style:{fontSize:11,color:"#dc2626"},children:"미래 시각으로 설정해 주세요"})]}),t.jsxs("label",{style:{display:"grid",gap:6},children:[t.jsx("span",{style:{fontSize:12,color:"#475569",fontWeight:500},children:"태그"}),t.jsx("input",{type:"text",value:o.tags||"",onChange:z=>P({tags:z.target.value}),placeholder:"건설, 하자, 계약",style:{height:36,padding:"0 10px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff"}})]}),t.jsxs("label",{style:{display:"grid",gap:6},children:[t.jsx("span",{style:{fontSize:12,color:"#475569",fontWeight:500},children:"URL 슬러그"}),t.jsx("input",{type:"text",value:o.slug||"",onChange:z=>P({slug:z.target.value}),placeholder:"비워두면 제목으로 자동 생성",style:{height:36,padding:"0 10px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff"}})]}),t.jsxs("div",{style:{display:"grid",gap:6},children:[t.jsx("span",{style:{fontSize:12,color:"#475569",fontWeight:500},children:"대표 이미지"}),t.jsx(Ti,{value:o.thumbnailUrl||"",onChange:z=>P({thumbnailUrl:z,ogImageUrl:o.ogImageUrl?o.ogImageUrl:z}),docContext:{title:o.title},getEditorHtml:()=>A})]}),t.jsxs("button",{type:"button",onClick:()=>x(!0),style:{height:36,padding:"0 12px",fontSize:13,border:"1px solid #1a3a6b",borderRadius:6,background:"#fff",color:"#1a3a6b",cursor:"pointer",fontWeight:500,display:"inline-flex",alignItems:"center",gap:6,justifyContent:"center"},title:"본문을 분석해 어울리는 이미지를 AI 로 만들어 본문에 삽입",children:[t.jsx(Ce,{size:14}),"AI 본문 이미지 자동 추가"]}),t.jsxs("button",{type:"button",onClick:()=>P(zr(o,A)),style:{height:36,padding:"0 12px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:6,background:"#fff",color:"#374151",cursor:"pointer",fontWeight:500,display:"inline-flex",alignItems:"center",gap:6,justifyContent:"center"},title:"본문 기준으로 요약·SEO 설명·GEO 키워드·슬러그 자동 채움",children:[t.jsx(Ce,{size:14})," SEO/GEO 자동 채움"]})]})]}),t.jsx(Mi,{open:h,onClose:()=>x(!1),editor:e,doc:o}),t.jsx("style",{children:`
        .blog-simple-editor-content .ProseMirror {
          outline: none;
          padding: 8px 4px;
        }
        .blog-simple-editor-content .ProseMirror p.is-editor-empty:first-child::before {
          content: "본문을 입력하세요...";
          color: #9ca3af;
          float: left;
          height: 0;
          pointer-events: none;
        }
        .blog-simple-editor-content .ProseMirror h1 { font-size: 28px; margin: 24px 0 12px; font-weight: 700; }
        .blog-simple-editor-content .ProseMirror h2 { font-size: 22px; margin: 20px 0 10px; font-weight: 700; }
        .blog-simple-editor-content .ProseMirror h3 { font-size: 18px; margin: 16px 0 8px; font-weight: 700; }
        .blog-simple-editor-content .ProseMirror blockquote {
          border-left: 4px solid #1a3a6b;
          padding: 4px 16px;
          color: #475569;
          margin: 12px 0;
          background: #f8fafc;
        }
        .blog-simple-editor-content .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 12px 0;
        }
        .blog-simple-editor-content .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .blog-simple-editor-content .ProseMirror table {
          border-collapse: collapse;
          margin: 12px 0;
          width: 100%;
        }
        .blog-simple-editor-content .ProseMirror th,
        .blog-simple-editor-content .ProseMirror td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
        }
        .blog-simple-editor-content .ProseMirror th { background: #f3f4f6; font-weight: 600; }
        .blog-simple-editor-content .ProseMirror pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 12px 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .blog-simple-editor-content .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 24px 0;
        }
        @media (max-width: 768px) {
          .blog-simple-editor-content .ProseMirror { font-size: 15px; }
        }
      `})]})}const bd=u.memo(function({darkMode:o,zoom:r,pageW:i,marginLeft:n,marginRight:a,showNavPane:s,showRuler:l}){const d=r/100,m=u.useMemo(()=>{const c=(i-n-a)/We,g=Math.ceil(c),k=r/100,v=[];for(let y=-Math.floor(n/We);y<=g+Math.floor(a/We);y++){const h=(n+y*We)*k;if(h<-5||h>i*k+5)continue;v.push(t.jsxs("div",{style:{position:"absolute",left:`${h}px`,bottom:0,display:"flex",flexDirection:"column",alignItems:"center"},children:[t.jsx("div",{style:{width:1,height:10,background:o?"#888":"#666"}}),y>0&&y<=g&&t.jsx("span",{style:{fontSize:7,color:o?"#888":"#777",position:"absolute",top:2,left:3,fontFamily:"'Segoe UI', sans-serif"},children:y})]},`cm-${y}`));const x=(n+(y+.5)*We)*k;x>0&&x<i*k&&v.push(t.jsx("div",{style:{position:"absolute",left:`${x}px`,bottom:0},children:t.jsx("div",{style:{width:1,height:5,background:o?"#666":"#aaa"}})},`half-${y}`))}return v},[r,i,n,a,o]),p=o?"#999":"#666";return t.jsxs("div",{style:{height:24,background:o?"#2d2d2d":"#f5f5f5",borderBottom:`1px solid ${o?"#444":"#ddd"}`,display:"flex",alignItems:"flex-end",justifyContent:"center",flexShrink:0,position:"relative"},children:[t.jsx("div",{style:{width:s?220:0,flexShrink:0}}),t.jsx("div",{style:{width:l?20:0,flexShrink:0}}),t.jsxs("div",{style:{width:`${i*d}px`,maxWidth:"calc(100% - 56px)",position:"relative",height:"100%"},children:[t.jsx("div",{style:{position:"absolute",left:0,top:0,bottom:0,width:`${n*d}px`,background:o?"#3a3a3a":"#c4c4c4"}}),t.jsx("div",{style:{position:"absolute",right:0,top:0,bottom:0,width:`${a*d}px`,background:o?"#3a3a3a":"#c4c4c4"}}),t.jsx("div",{style:{position:"absolute",left:`${n*d}px`,right:`${a*d}px`,top:0,bottom:0,background:o?"#2d2d2d":"#fff"}}),m,t.jsx("div",{style:{position:"absolute",left:`${n*d-4}px`,bottom:0,width:8,height:8,cursor:"ew-resize",borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderBottom:`8px solid ${p}`}}),t.jsx("div",{style:{position:"absolute",right:`${a*d-4}px`,bottom:0,width:8,height:8,cursor:"ew-resize",borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderBottom:`8px solid ${p}`}})]}),t.jsx("div",{style:{width:28,flexShrink:0}})]})}),xd=u.memo(function(){return t.jsxs("div",{className:"editor-splash",children:[t.jsx("div",{className:"logo",children:t.jsx("span",{style:{fontWeight:700,fontSize:42,letterSpacing:-2},children:"W"})}),t.jsx("div",{className:"subtitle",style:{fontSize:14,marginTop:8,letterSpacing:1},children:"Word"}),t.jsx("div",{style:{fontSize:10,marginTop:4,opacity:.5},children:"법무법인 하이로"}),t.jsx("div",{className:"loading-bar"})]})}),Me={height:40,border:"1px solid #cbd5e1",borderRadius:6,padding:"0 12px",fontSize:14,background:"#fff",color:"#111827",fontFamily:"'Segoe UI', '맑은 고딕', sans-serif",minWidth:0},yd={display:"block",fontSize:13,fontWeight:500,color:"#475569",marginBottom:6,whiteSpace:"nowrap"};function Je({label:e,children:o,style:r}){return t.jsxs("label",{style:{display:"grid",gap:0,minWidth:0,...r},children:[t.jsx("span",{style:yd,children:e}),o]})}function vd({doc:e,setDoc:o,onPublish:r,onPreview:i,isPublishing:n=!1,editorHtml:a="",editor:s=null}){const l=e!=null&&e._blogSlug?`/blog/${e._blogSlug}`:"",d=g=>o(k=>({...k,...g})),m=e.status==="scheduled",p=!m||Er(e.scheduledPublishAt),[f,c]=u.useState(!1);return t.jsxs("section",{"aria-label":"블로그 작성 설정",style:{flexShrink:0,borderBottom:"1px solid #dbe3ef",background:"#f8fafc",padding:"20px 22px 18px",display:"grid",gap:16},children:[t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:14,alignItems:"end"},children:[t.jsx(Je,{label:"블로그 제목",style:{minWidth:260,gridColumn:"span 2"},children:t.jsx("input",{value:e.title||"",onChange:g=>d({title:g.target.value}),placeholder:"게시글 제목을 입력하세요",style:{...Me,height:48,fontSize:20,fontWeight:600}})}),t.jsx(Je,{label:"게시판",children:t.jsx("select",{value:e.blogCategory||"construction_realestate",onChange:g=>d({blogCategory:g.target.value,documentType:"blog"}),style:Me,children:xt.map(g=>t.jsx("option",{value:g.value,children:g.label},g.value))})}),t.jsx(Je,{label:"공개 상태",children:t.jsxs("select",{value:e.status||"draft",onChange:g=>d({status:g.target.value}),style:Me,children:[t.jsx("option",{value:"draft",children:"초안 저장"}),t.jsx("option",{value:"published",children:"즉시 발행"}),t.jsx("option",{value:"scheduled",children:"예약 발행"})]})}),t.jsx(Je,{label:"예약 일시",children:t.jsx("input",{type:"datetime-local",value:e.scheduledPublishAt||"",onChange:g=>d({scheduledPublishAt:g.target.value,status:g.target.value?"scheduled":e.status}),disabled:!m,style:{...Me,opacity:m?1:.48}})})]}),t.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center",justifyContent:"flex-end",flexWrap:"wrap"},children:[t.jsx("button",{type:"button",onClick:i,style:{...Me,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,padding:"0 18px"},children:"미리보기"}),t.jsxs("button",{type:"button",onClick:()=>d(zr(e,a)),title:"본문 기준으로 요약, SEO 설명, GEO 키워드, 슬러그를 채웁니다",style:{...Me,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,padding:"0 18px"},children:[t.jsx(Ce,{size:16}),"SEO/GEO"]}),l&&t.jsx("button",{type:"button",onClick:()=>window.open(l,"_blank","noopener,noreferrer"),title:"공개 글 보기",style:{...Me,width:44,padding:0,cursor:"pointer",justifyContent:"center",display:"inline-flex",alignItems:"center"},children:t.jsx(An,{size:16})}),t.jsxs("button",{type:"button",onClick:r,disabled:n||!p,title:p?void 0:"예약 발행에는 미래 예약 일시가 필요합니다",style:{...Me,borderColor:"#2563eb",background:n||!p?"#93c5fd":"#2563eb",color:"#fff",cursor:n||!p?"default":"pointer",display:"inline-flex",alignItems:"center",gap:8,fontWeight:600,padding:"0 22px"},children:[t.jsx(Kt,{size:16}),n?"처리 중":m?"예약":"발행"]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:14},children:[t.jsx(Je,{label:"태그",children:t.jsxs("div",{style:{position:"relative"},children:[t.jsx(La,{size:16,style:{position:"absolute",left:12,top:12,color:"#94a3b8"}}),t.jsx("input",{value:e.tags||"",onChange:g=>d({tags:g.target.value}),placeholder:"건설, 하자, 계약",style:{...Me,width:"100%",paddingLeft:36}})]})}),t.jsx(Je,{label:"URL 슬러그",children:t.jsx("input",{value:e.slug||"",onChange:g=>d({slug:g.target.value}),placeholder:"비워두면 제목으로 자동 생성",style:{...Me,width:"100%"}})})]}),t.jsx(Je,{label:"대표 이미지",children:t.jsx(Ti,{value:e.thumbnailUrl||"",onChange:g=>d({thumbnailUrl:g,ogImageUrl:e.ogImageUrl?e.ogImageUrl:g}),docContext:{title:e.title},getEditorHtml:()=>{var g;return a||((g=s==null?void 0:s.getHTML)==null?void 0:g.call(s))||""}})}),t.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"},children:[t.jsxs("button",{type:"button",onClick:()=>c(!0),disabled:!s,style:{display:"inline-flex",alignItems:"center",gap:6,height:30,padding:"0 12px",fontSize:12,border:"1px solid #1a3a6b",borderRadius:4,background:"#fff",color:"#1a3a6b",cursor:s?"pointer":"not-allowed",opacity:s?1:.5},title:s?"본문을 분석해 어울리는 이미지 3개를 AI로 만들어 본문에 삽입":"에디터 로드 후 사용 가능",children:[t.jsx(Da,{size:13}),"AI 본문 이미지 자동 추가"]}),t.jsx("span",{style:{fontSize:11,color:"#64748b"},children:"본문을 어느 정도 작성한 뒤 누르세요. 추천 프롬프트를 수정·삭제·재생성 가능합니다."})]}),t.jsx(Mi,{open:f,onClose:()=>c(!1),editor:s,doc:e}),m&&t.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:6,fontSize:11,color:"#075985"},children:[t.jsx(_a,{size:13}),"예약 일시가 지나면 서버가 자동으로 공개 상태로 전환합니다."]})]})}const Pr="blog-footnotes";function tr(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function sr(e){if(!e)return{};if(typeof e=="object")return e;try{const o=JSON.parse(e);return o&&typeof o=="object"?o:{}}catch{return{}}}function kd(e={},o={}){return{...sr(e.metadata),editor:{...sr(e.metadata).editor,footnotes:o.footnotes||[],endnotes:o.endnotes||[],footnoteNumberFormat:o.footnoteNumberFormat||"decimal",endnoteNumberFormat:o.endnoteNumberFormat||"lowerRoman",drawings:Array.isArray(o.drawings)?o.drawings:[],headerText:o.headerText||"",footerText:o.footerText||""}}}function wd(e){const o=sr(e).editor||{};return{footnotes:Array.isArray(o.footnotes)?o.footnotes:[],endnotes:Array.isArray(o.endnotes)?o.endnotes:[],footnoteNumberFormat:o.footnoteNumberFormat||"decimal",endnoteNumberFormat:o.endnoteNumberFormat||"lowerRoman",drawings:Array.isArray(o.drawings)?o.drawings:[],headerText:o.headerText||"",footerText:o.footerText||""}}function Ei(e=""){if(!e||typeof document>"u")return e||"";const o=document.createElement("div");return o.innerHTML=e,o.querySelectorAll(`.${Pr}`).forEach(r=>r.remove()),o.innerHTML.trim()}function jd(e=""){if(!e||typeof document>"u")return[];const o=document.createElement("div");o.innerHTML=e;const r=o.querySelectorAll(`.${Pr} li[id^="fn-content-"]`);return Array.from(r).map((i,n)=>{const a=i.id.replace(/^fn-content-/,""),s=i.querySelector(".blog-footnote-backref"),l=i.cloneNode(!0);return l.querySelectorAll(".blog-footnote-backref").forEach(d=>d.remove()),l.querySelectorAll(".blog-footnote-number").forEach(d=>d.remove()),{id:a,number:n+1,content:(l.textContent||"").trim(),...s!=null&&s.getAttribute("href")?{refId:s.getAttribute("href").replace(/^#fn-ref-/,"")}:{}}}).filter(i=>i.id)}function Sd(e){if(!e)return[];if(Array.isArray(e))return e;try{const o=JSON.parse(e);return Array.isArray(o)?o:[]}catch{return[]}}function Cd(e=[],o="decimal"){const r=e.filter(n=>n==null?void 0:n.id);if(!r.length)return"";const i=r.map((n,a)=>{const s=Ro(n.number||a+1,o),l=tr(n.content||"").replace(/\n/g,"<br>"),d=tr(n.id);return`<li id="fn-content-${d}" class="blog-footnote-item"><span class="blog-footnote-number">${tr(s)}</span> ${l||'<span class="blog-footnote-empty">각주 내용 없음</span>'} <a class="blog-footnote-backref" href="#fn-ref-${d}" aria-label="본문 각주로 돌아가기">↩</a></li>`}).join("");return`<section class="${Pr}" aria-label="각주"><h2>각주</h2><ol>${i}</ol></section>`}function lr(e="",o=[],r="decimal"){const i=Ei(e),n=Cd(o,r);return n?`${i}${n}`:i}const or={저장됨:"#22c55e",발행됨:"#3b82f6",예약됨:"#0ea5e9",삭제됨:"#ef4444",수정됨:"#f59e0b","저장 중...":"#facc15","발행 중...":"#facc15","예약 중...":"#facc15",오류:"#ef4444"};function Td(e){const o=typeof e=="object"&&e!==null?e.status||e.message||"":e||"";if(!o)return"rgba(255,255,255,0.4)";const r=String(o);return or[r]?or[r]:r.toLowerCase().includes("error")||r.startsWith("오류")?or.오류:"rgba(255,255,255,0.55)"}const Md=u.memo(function({editor:o,doc:r,setDoc:i,saveStatus:n,darkMode:a,onOpenSidebar:s,onOpenSheet:l,onOpenOutline:d,onOpenMeta:m,onToggleFocus:p,focusMode:f,onShare:c,isBlog:g}){const k=Td(n),v=typeof n=="object"&&n!==null?n.message||n.status||"":n||"",y=ui(),h=x=>()=>{y(8),x==null||x()};return t.jsxs("div",{className:`editor-mtopbar editor-mobile-only${a?" dark":""}`,children:[t.jsx("button",{type:"button",onClick:h(s),"aria-label":"문서 목록 열기",title:"문서 목록",children:t.jsx(Ra,{size:22})}),t.jsx("input",{type:"text",className:"mtopbar-title",value:(r==null?void 0:r.title)||"",onChange:x=>i(w=>({...w,title:x.target.value})),placeholder:"제목을 입력하세요",onKeyDown:x=>{x.key==="Enter"&&(x.preventDefault(),o==null||o.commands.focus())}}),t.jsx("span",{className:"mtopbar-status",title:v,style:{background:k}}),t.jsx("button",{type:"button",onClick:h(()=>o==null?void 0:o.chain().focus().undo().run()),"aria-label":"실행 취소",title:"실행 취소",children:t.jsx(qn,{size:20})}),t.jsx("button",{type:"button",onClick:h(()=>o==null?void 0:o.chain().focus().redo().run()),"aria-label":"다시 실행",title:"다시 실행",children:t.jsx(Kn,{size:20})}),t.jsx("button",{type:"button",onClick:h(d),"aria-label":"개요",title:"문서 개요",children:t.jsx(Na,{size:20})}),g&&t.jsx("button",{type:"button",onClick:h(m),"aria-label":"블로그 메타",title:"카테고리·태그·썸네일",children:t.jsx(Fa,{size:20})}),t.jsx("button",{type:"button",onClick:h(p),"aria-label":f?"집중 모드 끄기":"집중 모드",title:"집중 모드",className:f?"active":"",children:t.jsx(Oa,{size:20})}),c&&t.jsx("button",{type:"button",onClick:h(c),"aria-label":"공유",title:"공유",children:t.jsx(Ba,{size:20})}),t.jsx("button",{type:"button",onClick:h(l),"aria-label":"더보기 메뉴",title:"더보기",children:t.jsx(Yn,{size:22})})]})}),Ed=u.memo(function({editor:o,darkMode:r,onOpenSheet:i,onOpenLinkDialog:n,onOpenImageDialog:a}){const[,s]=u.useState(0);u.useEffect(()=>{if(!o)return;const c=()=>s(g=>g+1);return o.on("selectionUpdate",c),o.on("transaction",c),()=>{o.off("selectionUpdate",c),o.off("transaction",c)}},[o]);const l=u.useCallback((c,g)=>{try{return(o==null?void 0:o.isActive(c,g))??!1}catch{return!1}},[o]);if(!o)return null;const d=c=>()=>c(o.chain().focus()).run(),m=c=>()=>{o.isActive("heading",{level:c})?o.chain().focus().setParagraph().run():o.chain().focus().setHeading({level:c}).run()},p=()=>{a&&a()},f=()=>{n&&n()};return t.jsxs("div",{className:`editor-mformatbar editor-mobile-only${r?" dark":""}`,role:"toolbar","aria-label":"서식 도구",children:[t.jsx("button",{type:"button",className:l("bold")?"active":"",onMouseDown:c=>c.preventDefault(),onClick:d(c=>c.toggleBold()),"aria-label":"굵게",title:"굵게",children:t.jsx(yt,{size:18})}),t.jsx("button",{type:"button",className:l("italic")?"active":"",onMouseDown:c=>c.preventDefault(),onClick:d(c=>c.toggleItalic()),"aria-label":"기울임",title:"기울임",children:t.jsx(vt,{size:18})}),t.jsx("button",{type:"button",className:l("underline")?"active":"",onMouseDown:c=>c.preventDefault(),onClick:d(c=>c.toggleUnderline()),"aria-label":"밑줄",title:"밑줄",children:t.jsx(kt,{size:18})}),t.jsx("span",{className:"mformatbar-sep","aria-hidden":"true"}),t.jsx("button",{type:"button",className:l("heading",{level:1})?"active":"",onMouseDown:c=>c.preventDefault(),onClick:m(1),"aria-label":"제목 1",title:"제목 1",children:t.jsx(Un,{size:18})}),t.jsx("button",{type:"button",className:l("heading",{level:2})?"active":"",onMouseDown:c=>c.preventDefault(),onClick:m(2),"aria-label":"제목 2",title:"제목 2",children:t.jsx(Wn,{size:18})}),t.jsx("span",{className:"mformatbar-sep","aria-hidden":"true"}),t.jsx("button",{type:"button",className:l("bulletList")?"active":"",onMouseDown:c=>c.preventDefault(),onClick:d(c=>c.toggleBulletList()),"aria-label":"글머리 기호",title:"글머리 기호",children:t.jsx(Yt,{size:18})}),t.jsx("button",{type:"button",className:l("orderedList")?"active":"",onMouseDown:c=>c.preventDefault(),onClick:d(c=>c.toggleOrderedList()),"aria-label":"번호 매기기",title:"번호 매기기",children:t.jsx(Po,{size:18})}),t.jsx("button",{type:"button",className:l("blockquote")?"active":"",onMouseDown:c=>c.preventDefault(),onClick:d(c=>c.toggleBlockquote()),"aria-label":"인용",title:"인용",children:t.jsx(wr,{size:18})}),t.jsx("span",{className:"mformatbar-sep","aria-hidden":"true"}),t.jsx("button",{type:"button",className:l("link")?"active":"",onMouseDown:c=>c.preventDefault(),onClick:f,"aria-label":"링크",title:"링크 삽입",children:t.jsx(jt,{size:18})}),t.jsx("button",{type:"button",onMouseDown:c=>c.preventDefault(),onClick:p,"aria-label":"이미지",title:"이미지 삽입",children:t.jsx(Lo,{size:18})}),t.jsx("button",{type:"button",className:l("code")?"active":"",onMouseDown:c=>c.preventDefault(),onClick:d(c=>c.toggleCode()),"aria-label":"인라인 코드",title:"인라인 코드",children:t.jsx(Ha,{size:18})}),t.jsx("span",{className:"mformatbar-sep","aria-hidden":"true"}),t.jsx("button",{type:"button",onClick:i,"aria-label":"더보기",title:"더보기",children:t.jsx(Ce,{size:18})})]})}),zi="yj-editor-mobile-snippets",ho=[{id:"default-greeting",trigger:";인사",body:"안녕하세요. 법무법인 하이로입니다."},{id:"default-cta",trigger:";상담",body:"보다 정확한 상담은 준비 중 또는 [상담 신청](/consultation)으로 문의해 주세요."},{id:"default-disclaimer",trigger:";면책",body:"본 글은 일반적인 정보 제공을 위한 것이며, 구체적 사건은 전문가 상담이 필요합니다."}];function Ar(){if(typeof localStorage>"u")return ho;try{const e=localStorage.getItem(zi);if(!e)return ho;const o=JSON.parse(e);return Array.isArray(o)?o:ho}catch{return ho}}function Ii(e){if(!(typeof localStorage>"u"))try{localStorage.setItem(zi,JSON.stringify(e))}catch{}}function Pu(e){const o=Ar(),r=o.findIndex(n=>n.id===e.id),i={...e,updatedAt:Date.now()};return r>=0?o[r]=i:o.push({...i,id:i.id||`s_${Date.now()}`}),Ii(o),o}function Au(e){const o=Ar().filter(r=>r.id!==e);return Ii(o),o}function zd(e){if(!e)return()=>{};const o=({transaction:r})=>{var d;if(!(r!=null&&r.docChanged)||!((d=r.steps)==null?void 0:d[r.steps.length-1]))return;const n=e.state.selection;if(!n.empty)return;const a=n.from,s=e.state.doc.textBetween(Math.max(0,a-24),a,`
`,"\0");if(!/[\s\n]$/.test(s))return;const l=Ar();for(const m of l){const p=m.trigger;if(!p)continue;const f=`${p} `;if(s.endsWith(f)||s.endsWith(`${p}
`)){const c=a-f.length;e.chain().focus().deleteRange({from:c,to:a}).insertContent(m.body+" ").run();return}}};return e.on("transaction",o),()=>e.off("transaction",o)}const Id=[/^#{1,6}\s/m,/\*\*[^*\n]+\*\*/,/(^|\s)\*[^*\n]+\*/,/^[-*]\s/m,/^\d+\.\s/m,/^>\s/m,/\[[^\]]+\]\([^)]+\)/,/^```/m];function Pd(e){if(!e||typeof e!="string")return!1;const o=e.trim();if(o.length<4)return!1;let r=0;for(const i of Id)i.test(o)&&(r+=1);return r>=1&&o.length<3e4}function Ad(e){var i;if(!((i=e==null?void 0:e.view)!=null&&i.dom))return()=>{};const o=e.view.dom,r=n=>{const a=n.clipboardData;if(!a)return;const s=a.getData("text/html");if(s&&s.length>16)return;const l=a.getData("text/plain");if(!(!l||!Pd(l))){n.preventDefault();try{const d=Jn.parse(l,{gfm:!0,breaks:!0});e.chain().focus().insertContent(d).run()}catch{e.chain().focus().insertContent(l).run()}}};return o.addEventListener("paste",r),()=>o.removeEventListener("paste",r)}const Ld="yj-editor-mobile-versions:",Dd=30;function Lr(e){return`${Ld}${e||"draft"}`}function _d(e){if(typeof localStorage>"u")return[];try{const o=localStorage.getItem(Lr(e));if(!o)return[];const r=JSON.parse(o);return Array.isArray(r)?r:[]}catch{return[]}}function Rd(e,o){if(typeof localStorage>"u")return[];const r=_d(e),i=r[0];if(i&&i.html===o.html)return r;const n=[{...o,ts:Date.now()},...r].slice(0,Dd);try{localStorage.setItem(Lr(e),JSON.stringify(n))}catch{}return n}function Lu(e){if(!(typeof localStorage>"u"))try{localStorage.removeItem(Lr(e))}catch{}}const Nd="yj-editor-mobile-bookmarks:";function Pi(e){return`${Nd}${e||"draft"}`}function Mo(e){if(typeof localStorage>"u")return[];try{const o=localStorage.getItem(Pi(e));if(!o)return[];const r=JSON.parse(o);return Array.isArray(r)?r:[]}catch{return[]}}function Ai(e,o){try{localStorage.setItem(Pi(e),JSON.stringify(o))}catch{}}function Fd(e,o,r){if(!e)return[];const n=e.state.selection.from,a=e.state.doc.textBetween(Math.max(0,n-60),n+60,`
`,"\0").trim().slice(0,120),s=Mo(o),l=[{id:`bm_${Date.now()}`,pos:n,text:a,label:a.slice(0,30),createdAt:Date.now()},...s].slice(0,30);return Ai(o,l),l}function Od(e,o){const r=Mo(e).filter(i=>i.id!==o);return Ai(e,r),r}function Bd(e,o){if(!e||!o)return;let r=o.pos;try{const n=e.state.doc.textBetween(0,e.state.doc.content.size,`
`,"\0").indexOf((o.text||"").slice(0,30));n>=0&&(r=n+1),e.chain().focus().setTextSelection(Math.max(1,Math.min(r,e.state.doc.content.size))).scrollIntoView().run()}catch{}}const pn="yj-editor-blog-advanced-mode",Hd=u.lazy(()=>Q(()=>import("./MobileToolSheet-_V85cvL0.js"),__vite__mapDeps([17,1,3])).then(e=>({default:e.MobileToolSheet}))),$d=u.lazy(()=>Q(()=>import("./MobileSidebarDrawer-C97-fz7N.js"),__vite__mapDeps([18,1,4,5,6,2,7,3,8,9])).then(e=>({default:e.MobileSidebarDrawer}))),Ud=u.lazy(()=>Q(()=>import("./MobileSlashMenu-0_O1bE3P.js"),__vite__mapDeps([19,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.MobileSlashMenu}))),Wd=u.lazy(()=>Q(()=>import("./MobileVoiceInput-Dhe6Labe.js"),__vite__mapDeps([20,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.MobileVoiceInput}))),Gd=u.lazy(()=>Q(()=>import("./MobileImageQuickAdd-Cxx_9LBR.js"),__vite__mapDeps([21,1,4,5,3,6,2,7,8,9])).then(e=>({default:e.MobileImageQuickAdd}))),Vd=u.lazy(()=>Q(()=>import("./MobileOutline-8s2wap2D.js"),__vite__mapDeps([22,1,3])).then(e=>({default:e.MobileOutline}))),qd=u.lazy(()=>Q(()=>import("./MobileMetaSheet-C23u3VW3.js"),__vite__mapDeps([23,1,2,4,5,3,6,7,8,9])).then(e=>({default:e.MobileMetaSheet}))),Kd=u.lazy(()=>Q(()=>import("./MobileWritingHud-DZwPqRbF.js"),__vite__mapDeps([24,1])).then(e=>({default:e.MobileWritingHud}))),Xd=u.lazy(()=>Q(()=>import("./MobileSpeedDial-DxBreYeX.js"),__vite__mapDeps([25,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.MobileSpeedDial}))),Yd=u.lazy(()=>Q(()=>import("./MobileCommandPalette-CyFcaTGp.js"),__vite__mapDeps([26,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.MobileCommandPalette}))),Jd=u.lazy(()=>Q(()=>import("./MobileAiAssistant-CVISj5Ac.js"),__vite__mapDeps([27,1,4,5,3,6,2,7,8,9])).then(e=>({default:e.MobileAiAssistant}))),Zd=u.lazy(()=>Q(()=>import("./MobilePublishSheet-DkfQOix1.js"),__vite__mapDeps([28,1,3])).then(e=>({default:e.MobilePublishSheet}))),Qd=u.lazy(()=>Q(()=>import("./MobileFindReplace-Df5AhVX7.js"),__vite__mapDeps([29,1,3])).then(e=>({default:e.MobileFindReplace}))),ec=u.lazy(()=>Q(()=>import("./MobileVersionHistory-vsNBcidm.js"),__vite__mapDeps([30,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.MobileVersionHistory}))),tc=u.lazy(()=>Q(()=>import("./MobileGoalBar-DfxIhyA-.js"),__vite__mapDeps([31,1,3,4,5,6,2,7,8,9])).then(e=>({default:e.MobileGoalBar}))),oc=u.lazy(()=>Q(()=>import("./BackstageView-CqwR-eJ2.js"),__vite__mapDeps([32,1,2,3])).then(e=>({default:e.BackstageView}))),rc=u.lazy(()=>Q(()=>import("./DialogManager-DVXRYO3P.js"),__vite__mapDeps([33,1,2,34,4,5,3,6,7,8,9])).then(e=>({default:e.DialogManager})));function nc(e){var dt,ct;const{editor:o,titleRef:r,editorCanvasRef:i,doc:n,setDoc:a,docId:s,documents:l,loading:d,saveStatus:m,handleSave:p,loadDocument:f,handleNew:c,handleNewBlog:g,handleDeleteDocument:k,handlePublishBlog:v,isPublishing:y,showAuthorDialog:h,handleAuthorSave:x,handleAuthorCancel:w,handleInsertComment:b,commentStore:I,showBackstage:P,setShowBackstage:A,handleExportDocx:L,handleExportPdf:C,handleExportHtml:S,handleExportMarkdown:R,handleExportHwpx:j,handleImportDocx:M,dialogOpen:N,setDialogOpen:E,sidebarCollapsed:O,setSidebarCollapsed:_,sidebarSearch:T,setSidebarSearch:D,viewMode:F,setViewMode:W,zoom:z,setZoom:U,showRuler:K,showNavPane:$,setShowNavPane:V,darkMode:G,setDarkMode:B,activeTab:q,setActiveTab:Y,ribbonCollapsed:ie,setRibbonCollapsed:H,findBarMode:ne,setFindBarMode:J,pageW:ee,marginLeft:be,marginRight:Ee,headerText:xe,setHeaderText:ye,footerText:pe,setFooterText:ve,watermarkText:ge,pageColor:tt,showHeaderFooter:ot,dynamicPageCount:ke,wordCount:Ke,charCount:De,metaOpen:ze,setMetaOpen:Ie,memoProps:ae,drawingState:St}=e,[rt,me]=u.useState(!1),[we,Ct]=u.useState(""),oe=Ji("(max-width: 767.98px)"),[Tt,nt]=u.useState(!1),[Mt,_e]=u.useState(!1),[it,Qt]=u.useState(!1),[Et,Re]=u.useState(!1),[zt,eo]=u.useState(!1),[Fo,at]=u.useState(!1),[st,to]=u.useState(!1),[It,le]=u.useState(!1),[Oo,Pt]=u.useState(!1),[Bo,lt]=u.useState(!1),[Ho,Ne]=u.useState(!1),[$o,At]=u.useState(!1),[Uo,Lt]=u.useState(()=>Mo(s)),{keyboardHeight:Wo,keyboardOpen:Dt}=vl(),[Go,oo]=u.useState({activeTool:null,penColor:"#000000",penWidth:3,highlighterOpacity:.4,canvasActive:!1}),ro={drawingState:St,drawOptions:Go,setDrawOptions:oo};u.useEffect(()=>{if(!o)return;const re=()=>{var je;return Ct(((je=o.getHTML)==null?void 0:je.call(o))||"")};return re(),o.on("update",re),()=>o.off("update",re)},[o]),u.useEffect(()=>{if(!oe||!o)return;const re=zd(o),je=Ad(o);return()=>{re==null||re(),je==null||je()}},[oe,o]),u.useEffect(()=>{if(!oe||!o)return;const re=setInterval(()=>{var Rt;const je=(Rt=o.getHTML)==null?void 0:Rt.call(o);je&&Rd(s,{html:je,label:"자동 저장"})},6e4);return()=>clearInterval(re)},[oe,o,s]),u.useEffect(()=>{oe&&Lt(Mo(s))},[s,oe]);const no={...n,blogCategory:(n==null?void 0:n.blogCategory)||(n==null?void 0:n.category)||"construction_realestate",author:(n==null?void 0:n.author)||"법무법인 하이로"},io=ii(no,we),Vo=(n==null?void 0:n.documentType)==="blog"?lr(we,((dt=ae.canvasFootnoteProps)==null?void 0:dt.footnotes)||[],((ct=ae.canvasFootnoteProps)==null?void 0:ct.footnoteNumberFormat)||"decimal"):we,qo=async()=>{if(typeof navigator>"u"||!navigator.share){de("이 기기에서는 공유 기능을 지원하지 않습니다.");return}try{await navigator.share({title:(n==null?void 0:n.title)||"법무법인 하이로 문서",text:(n==null?void 0:n.excerpt)||(n==null?void 0:n.summary)||"",url:typeof window<"u"?window.location.href:""})}catch{}},Fe=(n==null?void 0:n.documentType)==="blog",[Ko,ao]=u.useState(()=>{if(typeof localStorage>"u")return!1;try{return localStorage.getItem(pn)==="1"}catch{return!1}}),_t=re=>{ao(re);try{localStorage.setItem(pn,re?"1":"0")}catch{}};return Fe&&!Ko?t.jsxs(t.Fragment,{children:[t.jsx(hd,{editor:o,doc:n,setDoc:a,saveStatus:m,handleSave:p,handlePublishBlog:v,isPublishing:y,handleInsertComment:b,setShowBackstage:A,onSwitchToWordMode:()=>_t(!0)}),h&&t.jsx(qr,{onSave:x,onCancel:w}),t.jsx("style",{children:Xr})]}):t.jsxs("div",{style:{display:"flex",height:"100vh",overflow:"hidden","--editor-keyboard-h":`${Wo}px`},"data-keyboard-open":Dt?"true":"false",className:`word-editor-root${G?" dark-mode":""}${st&&oe?" mobile-focus-mode":""} comment-markup-${I.markupMode}`,children:[t.jsx("style",{children:Xr}),d&&t.jsx(xd,{}),h&&t.jsx(qr,{onSave:x,onCancel:w}),P&&t.jsx(u.Suspense,{fallback:null,children:t.jsx(oc,{doc:n,setDoc:a,onClose:()=>A(!1),onNew:()=>{c(),A(!1)},onSave:()=>{p(!1),A(!1)},onExportDocx:L,onExportPdf:C,onExportHtml:S,onExportMarkdown:R,onExportHwpx:j,onImportDocx:M,onPrint:()=>window.print()})}),N&&t.jsx(u.Suspense,{fallback:null,children:t.jsx(rc,{dialogOpen:N,setDialogOpen:E,editor:o,layoutProps:ae.dialogLayoutProps,pageProps:ae.dialogPageProps,footnoteProps:ae.dialogFootnoteProps,printPreviewProps:ae.dialogPrintPreviewProps})}),!oe&&t.jsx(Bs,{documents:l,onSelect:f,currentId:s,onNew:c,onNewBlog:g,onDelete:k,search:T,setSearch:D,collapsed:O,setCollapsed:_}),oe&&t.jsx(u.Suspense,{fallback:null,children:t.jsx($d,{open:Tt,onClose:()=>nt(!1),documents:l,currentId:s,onSelect:f,onNew:c,onNewBlog:g,onDelete:k,search:T,setSearch:D})}),t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0},children:[oe&&t.jsx(Md,{editor:o,doc:n,setDoc:a,saveStatus:m,darkMode:G,onOpenSidebar:()=>nt(!0),onOpenSheet:()=>_e(!0),onOpenOutline:()=>eo(!0),onOpenMeta:()=>at(!0),onToggleFocus:()=>to(re=>!re),focusMode:st,onShare:typeof navigator<"u"&&navigator.share?qo:null,isBlog:Fe}),!oe&&t.jsx(Zl,{editor:o,doc:n,setDoc:a,titleRef:r,darkMode:G,setDarkMode:B,saveStatus:m,handleSave:p,handleNew:c,handleNewBlog:g,handlePublishBlog:v,isPublishing:y,onOpenBlogPreview:()=>me(!0),setMetaOpen:Ie}),!oe&&t.jsx(xl,{editor:o,doc:n,activeTab:q,setActiveTab:Y,ribbonCollapsed:ie,setRibbonCollapsed:H,darkMode:G,viewMode:F,setShowBackstage:A,findBarMode:ne,setFindBarMode:J,setDialogOpen:E,onNew:c,onNewBlog:g,onPublishBlog:v,isPublishing:y,designProps:ae.ribbonDesignProps,layoutProps:ae.ribbonLayoutProps,referencesProps:ae.ribbonReferencesProps,reviewProps:ae.ribbonReviewProps,viewProps:ae.ribbonViewProps,drawProps:ro,blogPublishStatus:io,onOpenBlogPreview:()=>me(!0),onOpenMeta:()=>Ie(!0),onSwitchToSimpleBlog:()=>_t(!1)}),!oe&&K&&t.jsx(bd,{darkMode:G,zoom:z,pageW:ee,marginLeft:be,marginRight:Ee,showNavPane:$,showRuler:K}),(n==null?void 0:n.documentType)==="blog"&&t.jsx(vd,{doc:n,setDoc:a,onPublish:v,onPreview:()=>me(!0),isPublishing:y,editorHtml:we,editor:o}),t.jsx(Wl,{editor:o,editorCanvasRef:i,viewMode:F,darkMode:G,zoom:z,showRuler:K&&!oe,showNavPane:$&&!oe,setShowNavPane:V,doc:n,pageLayout:ae.canvasPageLayout,commentProps:ae.canvasCommentProps,footnoteProps:ae.canvasFootnoteProps,setDialogOpen:E,handleInsertComment:b,showHeaderFooter:ot&&!oe,headerText:xe,setHeaderText:ye,footerText:pe,setFooterText:ve,watermarkText:ge,pageColor:tt,drawProps:ro,dynamicPageCount:ke,isMobile:oe}),oe&&t.jsx(Ed,{editor:o,darkMode:G,onOpenSheet:()=>_e(!0),onOpenLinkDialog:()=>E("hyperlink"),onOpenImageDialog:()=>Re(!0)}),oe&&t.jsxs(u.Suspense,{fallback:null,children:[t.jsx(Ud,{editor:o,onOpenImage:()=>Re(!0),onOpenTable:()=>E("table"),onInsertComment:b}),t.jsx(tc,{editor:o,hidden:it||Et||st||It}),t.jsx(Kd,{editor:o,hidden:it||Et||st||It}),t.jsx(Xd,{editor:o,onVoice:()=>Qt(!0),onImage:()=>Re(!0),onTable:()=>E("table"),onFocus:()=>to(re=>!re),onPalette:()=>le(!0),onAi:()=>Pt(!0)}),t.jsx(Wd,{editor:o,open:it,onClose:()=>Qt(!1)}),t.jsx(Gd,{editor:o,open:Et,onClose:()=>Re(!1)}),t.jsx(Vd,{editor:o,open:zt,onClose:()=>eo(!1)}),t.jsx(qd,{open:Fo,onClose:()=>at(!1),doc:n,setDoc:a,onPublish:()=>{v(),at(!1)},onPreview:()=>{me(!0),at(!1)},isPublishing:y}),t.jsx(Yd,{open:It,onClose:()=>le(!1),editor:o,onShowFind:()=>{Ne(!0),le(!1)},onShowReplace:()=>{Ne(!0),le(!1)},onOpenImage:()=>{Re(!0),le(!1)},onOpenTable:()=>{E("table"),le(!1)},onOpenSymbol:()=>{E("symbol"),le(!1)},onInsertComment:()=>{b(),le(!1)},onOpenSeo:()=>{lt(!0),le(!1)},onOpenAi:()=>{Pt(!0),le(!1)},onOpenSchedule:()=>{lt(!0),le(!1)},onOpenVersion:()=>{At(!0),le(!1)},onTogglePresence:()=>de("공동 편집 표시는 다음 단계에서 추가됩니다."),bookmarks:Uo,onAddBookmark:()=>{const re=Fd(o,s);Lt(re)},onJumpBookmark:re=>Bd(o,re),onRemoveBookmark:re=>Lt(Od(s,re))}),t.jsx(Jd,{editor:o,open:Oo,onClose:()=>Pt(!1),doc:n}),t.jsx(Zd,{open:Bo,onClose:()=>lt(!1),doc:n,setDoc:a,editorHtml:we,onPublish:()=>{v(),lt(!1)},isPublishing:y}),t.jsx(Qd,{editor:o,open:Ho,onClose:()=>Ne(!1)}),t.jsx(ec,{editor:o,open:$o,onClose:()=>At(!1),docId:s})]}),!oe&&t.jsx(Jl,{darkMode:G,dynamicPageCount:ke,wordCount:Ke,charCount:De,viewMode:F,setViewMode:W,zoom:z,setZoom:U}),oe&&t.jsx(u.Suspense,{fallback:null,children:t.jsx(Hd,{open:Mt,onClose:()=>_e(!1),editor:o,doc:n,darkMode:G,setDarkMode:B,handleSave:p,handleNew:c,handleNewBlog:g,handlePublishBlog:v,isPublishing:y,onOpenBlogPreview:()=>me(!0),onOpenMeta:()=>Ie(!0),onShowFind:()=>{Ne(!0),_e(!1)},onShowReplace:()=>{Ne(!0),_e(!1)},onOpenImage:()=>{Re(!0),_e(!1)},onOpenLink:()=>E("hyperlink"),onOpenTable:()=>E("table"),onOpenSymbol:()=>E("symbol"),onInsertComment:b,exportHandlers:{docx:L,pdf:C,html:S,markdown:R,hwpx:j},zoomCtl:{zoom:z,setZoom:U}})}),ze&&t.jsx("div",{onClick:()=>Ie(!1),style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.15)",zIndex:999}}),t.jsx(Fs,{doc:n,setDoc:a,open:ze,onClose:()=>Ie(!1),editorHtml:we}),rt&&t.jsx(Ns,{doc:no,html:Vo,status:io,onPublish:v,publishing:y,onClose:()=>me(!1)})]})]})}function ic(e){if(e.length===0)return"";if(e.length===1)return`M ${e[0].x} ${e[0].y} L ${e[0].x} ${e[0].y}`;let o=`M ${e[0].x} ${e[0].y}`;for(let r=1;r<e.length;r++)o+=` L ${e[r].x} ${e[r].y}`;return o}function ac(){const[e,o]=u.useState([]),[r,i]=u.useState([]),[n,a]=u.useState(null),s=u.useCallback(v=>{a({...v,points:[]})},[]),l=u.useCallback(v=>{a(y=>y?{...y,points:[...y.points,v]}:null)},[]),d=u.useCallback(()=>{a(v=>(!v||v.points.length===0||(o(y=>[...y,v]),i([])),null))},[]),m=u.useCallback(()=>{o(v=>{if(v.length===0)return v;const y=v[v.length-1];return i(h=>[...h,y]),v.slice(0,-1)})},[]),p=u.useCallback(()=>{i(v=>{if(v.length===0)return v;const y=v[v.length-1];return o(h=>[...h,y]),v.slice(0,-1)})},[]),f=u.useCallback((v,y,h=10)=>{o(x=>{const w=x.filter(b=>!b.points.some(I=>Math.abs(I.x-v)<h&&Math.abs(I.y-y)<h));return w.length<x.length&&i([]),w})},[]),c=u.useCallback((v=[])=>{o(Array.isArray(v)?v:[]),i([]),a(null)},[]),g=u.useCallback(()=>{o([]),i([]),a(null)},[]),k=u.useCallback((v,y)=>{const h=e.map(x=>{const w=ic(x.points),b=x.opacity!=null?x.opacity:1;return`<path d="${w}" stroke="${x.color}" stroke-width="${x.width}" fill="none" opacity="${b}" stroke-linecap="round" stroke-linejoin="round"/>`}).join(`
  `);return`<svg xmlns="http://www.w3.org/2000/svg" width="${v}" height="${y}">
  ${h}
</svg>`},[e]);return{strokes:e,currentStroke:n,redoStack:r,startStroke:s,addPoint:l,finishStroke:d,undo:m,redo:p,eraseAt:f,hydrateDrawings:c,resetDrawings:g,toSvgString:k,canUndo:e.length>0,canRedo:r.length>0}}function No(e,o){const r=URL.createObjectURL(e),i=document.createElement("a");i.href=r,i.download=o,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)}function sc(e){return e?/^#{1,6}\s/.test(e)||/\*\*/.test(e)||/^[-*]\s/.test(e.split(`
`).find(o=>o.trim())||""):!1}function lc(e){if(!e)return"";let o=e;return o=o.replace(/<h1[^>]*>(.*?)<\/h1>/gi,`# $1
`),o=o.replace(/<h2[^>]*>(.*?)<\/h2>/gi,`## $1
`),o=o.replace(/<h3[^>]*>(.*?)<\/h3>/gi,`### $1
`),o=o.replace(/<strong>(.*?)<\/strong>/gi,"**$1**"),o=o.replace(/<b>(.*?)<\/b>/gi,"**$1**"),o=o.replace(/<em>(.*?)<\/em>/gi,"*$1*"),o=o.replace(/<i>(.*?)<\/i>/gi,"*$1*"),o=o.replace(/<p[^>]*>(.*?)<\/p>/gi,`$1

`),o=o.replace(/<br\s*\/?>/gi,`
`),o=o.replace(/<[^>]+>/g,""),o=o.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," "),o.trim()}function Ue(e){return Math.round(e*20)}function fn(e){if(e){if(e.startsWith("#")){const o=e.replace("#","");return o.length===3?o.split("").map(r=>r+r).join(""):o.substring(0,6)}if(e.startsWith("rgb")){const o=e.match(/(\d+)/g);if(o&&o.length>=3)return o.slice(0,3).map(r=>parseInt(r).toString(16).padStart(2,"0")).join("")}}}function dc(e){return e?e.endsWith("pt")?parseFloat(e):e.endsWith("px")?parseFloat(e)*.75:parseFloat(e)||11:11}async function cc(e,o="문서"){var r;try{let R=function(D){const F=[];function W(z,U={}){if(z.nodeType===Node.TEXT_NODE){const G=z.textContent;if(!G)return;const B=z.parentElement,q=(B==null?void 0:B.style)||{},Y=U.bold||(B==null?void 0:B.closest("strong, b"))!==null,ie=U.italic||(B==null?void 0:B.closest("em, i"))!==null,H=U.underline||(B==null?void 0:B.closest("u"))!==null,ne=U.strike||(B==null?void 0:B.closest("s, del, strike"))!==null,J=(B==null?void 0:B.closest("sub"))!==null,ee=(B==null?void 0:B.closest("sup"))!==null,be=q.fontFamily||U.fontFamily,Ee=q.fontSize||U.fontSize,xe=q.color||U.color,ye=q.backgroundColor||U.backgroundColor,pe={text:G,bold:Y||void 0,italics:ie||void 0,underline:H?{}:void 0,strike:ne||void 0,subScript:J||void 0,superScript:ee||void 0};if(be){const ge=be.replace(/['"]/g,"").split(",")[0].trim();pe.font=ge}Ee&&(pe.size=Ue(dc(Ee)));const ve=fn(xe);if(ve&&ve!=="000000"&&ve!=="1a1a1a"&&(pe.color=ve),ye&&ye!=="transparent"&&ye!=="rgba(0, 0, 0, 0)"){const ge=fn(ye);ge&&(pe.shading={type:A.SOLID,color:ge,fill:ge})}F.push(new l(pe));return}if(z.nodeType!==Node.ELEMENT_NODE)return;const K=z,$=K.tagName;if($==="BR"){F.push(new l({break:1}));return}if($==="IMG")return;const V={...U};($==="STRONG"||$==="B")&&(V.bold=!0),($==="EM"||$==="I")&&(V.italic=!0),$==="U"&&(V.underline=!0),($==="S"||$==="DEL"||$==="STRIKE")&&(V.strike=!0),K.style.fontFamily&&(V.fontFamily=K.style.fontFamily),K.style.fontSize&&(V.fontSize=K.style.fontSize),K.style.color&&(V.color=K.style.color),K.style.backgroundColor&&(V.backgroundColor=K.style.backgroundColor);for(const G of K.childNodes)W(G,V)}return W(D),F.length===0&&F.push(new l({text:D.textContent||""})),F},j=function(D){var W;const F=((W=D.style)==null?void 0:W.textAlign)||D.getAttribute("align");if(F==="center")return m.CENTER;if(F==="right")return m.RIGHT;if(F==="justify")return m.JUSTIFIED},M=function(D){var K,$,V;const F={},W=D.getAttribute("data-line-spacing")||((K=D.style)==null?void 0:K.lineHeight);if(W){const G=parseFloat(W);!isNaN(G)&&G>0&&(F.line=Math.round(G*240))}const z=($=D.style)==null?void 0:$.marginBottom;if(z){const G=parseFloat(z);isNaN(G)||(F.after=Ue(G*.75))}const U=(V=D.style)==null?void 0:V.marginTop;if(U){const G=parseFloat(U);isNaN(G)||(F.before=Ue(G*.75))}return Object.keys(F).length>0?F:void 0},N=function(D){var U,K,$;const F={},W=((U=D.style)==null?void 0:U.paddingLeft)||((K=D.style)==null?void 0:K.marginLeft);if(W){const V=parseFloat(W);!isNaN(V)&&V>0&&(F.left=Ue(V*.75))}const z=($=D.style)==null?void 0:$.textIndent;if(z){const V=parseFloat(z);!isNaN(V)&&V!==0&&(F.firstLine=Ue(Math.abs(V)*.75))}return Object.keys(F).length>0?F:void 0},E=function(D){const F=[];for(const W of D.querySelectorAll("tr")){const z=[];for(const U of W.querySelectorAll("td, th")){const K=[];if(U.children.length>0)for(const V of U.children)K.push(new s({children:R(V),alignment:j(V)}));K.length===0&&K.push(new s({children:R(U)}));const $=U.tagName==="TH";z.push(new k({children:K,shading:$?{type:A.SOLID,color:"f1f5f9",fill:"f1f5f9"}:void 0}))}z.length>0&&F.push(new g({children:z}))}return F.length>0?new c({rows:F,width:{size:100,type:v.PERCENTAGE}}):null},O=function(D,F=0){var z;const W=D.tagName==="OL";for(const U of D.children){if(U.tagName!=="LI")continue;const K=U.querySelector("ul, ol"),$=[];for(const V of U.childNodes)if(!(V.nodeType===Node.ELEMENT_NODE&&(V.tagName==="UL"||V.tagName==="OL")))if(V.nodeType===Node.TEXT_NODE){const G=(z=V.textContent)==null?void 0:z.trim();G&&$.push(new l({text:G}))}else V.nodeType===Node.ELEMENT_NODE&&$.push(...R(V));if($.length>0){const V=W?`${Array.from(D.children).indexOf(U)+1}. `:"• ";S.push(new s({children:[new l({text:V}),...$],indent:{left:Ue((F+1)*18)}}))}K&&O(K,F+1)}};const i=await Q(()=>import("./index-LHXn8vCj.js"),[]),{Document:n,Packer:a,Paragraph:s,TextRun:l,HeadingLevel:d,AlignmentType:m,TabStopType:p,TabStopPosition:f,Table:c,TableRow:g,TableCell:k,WidthType:v,BorderStyle:y,ImageRun:h,LevelFormat:x,convertInchesToTwip:w,ExternalHyperlink:b,NumberFormat:I,PageNumber:P,ShadingType:A}=i,C=new DOMParser().parseFromString(e,"text/html"),S=[];for(const D of C.body.children){const F=D.tagName;if(D.getAttribute("data-type")==="page-break"){S.push(new s({children:[],pageBreakBefore:!0}));continue}if(/^H[1-4]$/.test(F)){const W=parseInt(F[1]),z={1:d.HEADING_1,2:d.HEADING_2,3:d.HEADING_3,4:d.HEADING_4};S.push(new s({children:R(D),heading:z[W],alignment:j(D),spacing:M(D)}));continue}if(F==="TABLE"){const W=E(D);W&&S.push(W);continue}if(F==="UL"||F==="OL"){O(D);continue}if(F==="BLOCKQUOTE"){S.push(new s({children:R(D),indent:{left:720},border:{left:{style:y.SINGLE,size:6,color:"3b82f6"}}}));continue}if(F==="HR"){S.push(new s({children:[],border:{bottom:{style:y.SINGLE,size:1,color:"cccccc"}}}));continue}if(F==="PRE"){const z=(D.textContent||"").split(`
`);for(const U of z)S.push(new s({children:[new l({text:U,font:"Consolas",size:Ue(9)})],shading:{type:A.SOLID,color:"f5f5f5",fill:"f5f5f5"}}));continue}if(!((r=D.textContent)!=null&&r.trim())&&!D.querySelector("img")){S.push(new s({children:[]}));continue}S.push(new s({children:R(D),alignment:j(D),spacing:M(D),indent:N(D)}))}S.length===0&&S.push(new s({children:[new l({text:""})]}));const _=new n({styles:{default:{document:{run:{font:"맑은 고딕",size:Ue(11)},paragraph:{spacing:{line:360}}}}},sections:[{properties:{page:{size:{width:w(8.27),height:w(11.69)},margin:{top:w(1),bottom:w(1),left:w(1.25),right:w(1.25)}}},children:S}]}),T=await a.toBlob(_);No(T,`${o}.docx`)}catch(i){de("DOCX 내보내기 중 오류가 발생했습니다: "+i.message)}}function uc(e){var n,a,s;const r=((n=e.closest)==null?void 0:n.call(e,".editor-page-area"))||((a=e.querySelector)==null?void 0:a.call(e,".editor-page-area"))||e;if(r.scrollWidth>0&&r.scrollHeight>0)return r;const i=(s=e.querySelector)==null?void 0:s.call(e,".ProseMirror");return(i==null?void 0:i.scrollWidth)>0&&(i==null?void 0:i.scrollHeight)>0?i:r}async function pc(e,o="문서",r={}){if(!e){de("PDF 내보내기: 에디터 요소를 찾을 수 없습니다.");return}try{const i=(await Q(async()=>{const{default:h}=await import("./html2canvas.esm-QH1iLAAe.js");return{default:h}},[])).default,{jsPDF:n}=await Q(async()=>{const{jsPDF:h}=await import("./jspdf.es.min-Dis_9kLl.js").then(x=>x.j);return{jsPDF:h}},__vite__mapDeps([35,4,1,5]));await new Promise(h=>setTimeout(h,200));const a=uc(e),s=await i(a,{scale:2,useCORS:!0,logging:!1,backgroundColor:"#ffffff",windowWidth:a.scrollWidth||a.clientWidth||window.innerWidth,windowHeight:a.scrollHeight||a.clientHeight||window.innerHeight,ignoreElements:h=>{var x,w;return((x=h.hasAttribute)==null?void 0:x.call(h,"data-page-overlay"))||((w=h.classList)==null?void 0:w.contains("page-break-overlay"))}}),l=s.toDataURL("image/png"),d=r.orientation==="landscape"?"l":"p",m=r.pageSize||"a4",p=new n(d,"mm",m),f=p.internal.pageSize.getWidth(),c=p.internal.pageSize.getHeight(),g=f,k=s.height*f/s.width;let v=0,y=0;for(;v<k&&(y>0&&p.addPage(),p.addImage(l,"PNG",0,-v,g,k),v+=c,y++,!(y>100)););p.save(`${o}.pdf`)}catch(i){de("PDF 내보내기 중 오류가 발생했습니다: "+i.message)}}function fc(e,o="문서"){const r=`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${o}</title>
<style>
  body {
    font-family: '맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
    font-size: 11pt;
    line-height: 1.75;
    color: #1a1a1a;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 60px;
  }
  h1 { font-size: 24pt; font-weight: 700; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  h2 { font-size: 18pt; font-weight: 600; margin: 20px 0 10px; }
  h3 { font-size: 14pt; font-weight: 600; margin: 16px 0 8px; }
  h4 { font-size: 12pt; font-weight: 600; margin: 14px 0 6px; }
  p { margin: 6px 0; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  blockquote { border-left: 3px solid #3b82f6; margin: 12px 0; padding: 8px 16px; background: #fafaf6; color: #555; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; }
  th { background: #f1f5f9; font-weight: 600; }
  code { background: #f0f0ee; padding: 1px 4px; border-radius: 2px; }
  pre { background: #2d2d2d; color: #ccc; padding: 12px 16px; border-radius: 4px; overflow-x: auto; }
  a { color: #3b82f6; }
  img { max-width: 100%; }
</style>
</head>
<body>
${e}
</body>
</html>`,i=new Blob([r],{type:"text/html;charset=utf-8"});No(i,`${o}.html`)}async function gc(e,o="문서"){try{const r=(await Q(async()=>{const{default:s}=await import("./turndown.browser.es-kLzRgxYD.js");return{default:s}},[])).default,i=new r({headingStyle:"atx",codeBlockStyle:"fenced",bulletListMarker:"-",emDelimiter:"*",strongDelimiter:"**"});i.addRule("strikethrough",{filter:["del","s","strike"],replacement:s=>`~~${s}~~`}),i.addRule("underline",{filter:["u"],replacement:s=>`<u>${s}</u>`}),i.addRule("highlight",{filter:s=>s.nodeName==="MARK",replacement:s=>`==${s}==`}),i.addRule("taskList",{filter:s=>s.nodeName==="LI"&&s.getAttribute("data-type")==="taskItem",replacement:(s,l)=>`${l.getAttribute("data-checked")==="true"?"- [x]":"- [ ]"} ${s.trim()}
`}),i.addRule("pageBreak",{filter:s=>{var l;return((l=s.getAttribute)==null?void 0:l.call(s,"data-type"))==="page-break"},replacement:()=>`
---

`});const n=i.turndown(e),a=new Blob([n],{type:"text/markdown;charset=utf-8"});No(a,`${o}.md`)}catch(r){de("마크다운 내보내기 중 오류가 발생했습니다: "+r.message)}}function Gt(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"):""}function mc(e){const o=[];function r(n){const a=n==null?void 0:n.tagName;return a==="H1"?"1":a==="H2"?"2":a==="H3"||a==="H4"?"3":"0"}function i(n){let a=[];for(const s of n.childNodes)if(s.nodeType===Node.TEXT_NODE){const l=s.textContent;l&&a.push(Gt(l))}else s.nodeType===Node.ELEMENT_NODE&&(s.tagName==="BR"?a.push(`
`):a.push(...i(s)));return a}for(const n of e.children){const a=n.tagName;if(n.getAttribute("data-type")==="page-break"){o.push('    <hp:p><hp:run><hp:ctrl><hp:colPr type="SECTION" breakType="PAGE"/></hp:ctrl></hp:run></hp:p>');continue}const s=r(n),d=i(n).join("");if(!d.trim()&&a!=="HR"){o.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="${s}"><hp:t></hp:t></hp:run></hp:p>`);continue}if(a==="UL"||a==="OL"){n.querySelectorAll("li").forEach((p,f)=>{const c=a==="OL"?`${f+1}. `:"• ",g=Gt(p.textContent||"");o.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:t>${c}${g}</hp:t></hp:run></hp:p>`)});continue}if(a==="TABLE"){const m=n.querySelectorAll("tr");for(const p of m){const f=p.querySelectorAll("td, th"),c=Array.from(f).map(g=>Gt(g.textContent||"")).join("	");o.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:t>${c}</hp:t></hp:run></hp:p>`)}continue}o.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="${s}"><hp:t>${Gt(d)}</hp:t></hp:run></hp:p>`)}return o.length===0&&o.push('    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>'),`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hp:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"
  xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:subList>
${o.join(`
`)}
  </hp:subList>
</hp:sec>`}async function hc(e,o="문서"){try{const r=(await Q(async()=>{const{default:d}=await import("./jszip.min-CxqYyiPY.js").then(m=>m.j);return{default:d}},__vite__mapDeps([36,1,37]))).default,i=new r,a=new DOMParser().parseFromString(e,"text/html");i.file("mimetype","application/hwp+zip",{compression:"STORE"}),i.file("META-INF/manifest.xml",`<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:media-type="application/hwp+zip" manifest:full-path="/"/>
  <manifest:file-entry manifest:media-type="application/xml" manifest:full-path="Contents/content.hpf"/>
  <manifest:file-entry manifest:media-type="application/xml" manifest:full-path="Contents/header.xml"/>
  <manifest:file-entry manifest:media-type="application/xml" manifest:full-path="Contents/section0.xml"/>
</manifest:manifest>`),i.file("Contents/content.hpf",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" version="1.0">
  <opf:metadata>
    <opf:title>${Gt(o)}</opf:title>
    <opf:language>ko</opf:language>
    <opf:meta name="creator" content="법무법인 하이로 에디터"/>
    <opf:meta name="date" content="${new Date().toISOString()}"/>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="header" href="header.xml" media-type="application/xml"/>
    <opf:item id="section0" href="section0.xml" media-type="application/xml"/>
  </opf:manifest>
  <opf:spine>
    <opf:itemref idref="section0"/>
  </opf:spine>
</opf:package>`),i.file("Contents/header.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ha:HWPDocumentHeaderType xmlns:ha="http://www.hancom.co.kr/hwpml/2011/head"
  version="1.1" secCnt="1">
  <ha:beginNum page="1" footnote="1" endnote="1"/>
  <ha:refList>
    <ha:fontfaces>
      <ha:fontface lang="HANGUL">
        <ha:font id="0" face="맑은 고딕" type="TTF"/>
      </ha:fontface>
      <ha:fontface lang="LATIN">
        <ha:font id="0" face="맑은 고딕" type="TTF"/>
      </ha:fontface>
    </ha:fontfaces>
    <ha:charProperties>
      <ha:charPr id="0" height="1100" bold="false" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
      <ha:charPr id="1" height="1600" bold="true" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
      <ha:charPr id="2" height="1400" bold="true" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
      <ha:charPr id="3" height="1200" bold="true" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
    </ha:charProperties>
    <ha:paraProperties>
      <ha:paraPr id="0" align="JUSTIFY">
        <ha:spacing line="160" lineType="PERCENT"/>
        <ha:margin indent="0" left="0" right="0"/>
      </ha:paraPr>
    </ha:paraProperties>
  </ha:refList>
  <ha:compatibleDocument targetProgram="HWP201X"/>
</ha:HWPDocumentHeaderType>`);const s=mc(a.body);i.file("Contents/section0.xml",s);const l=await i.generateAsync({type:"blob",mimeType:"application/hwp+zip",compression:"DEFLATE",compressionOptions:{level:6}});No(l,`${o}.hwpx`)}catch(r){de("한글(HWPX) 내보내기 중 오류가 발생했습니다: "+r.message)}}const bc=["p","br","span","div","strong","b","em","i","u","s","h1","h2","h3","h4","h5","h6","ul","ol","li","blockquote","code","pre","table","thead","tbody","tr","td","th","a","img","sup","sub","hr"],xc=["href","title","src","alt","colspan","rowspan"],yc=["style","on*"];async function vc(e){try{const o=await Q(()=>import("./index-Dcb--nax.js").then(n=>n.i),__vite__mapDeps([38,1,37])),r=await e.arrayBuffer(),i=await o.convertToHtml({arrayBuffer:r});return fr.sanitize(i.value,{ALLOWED_TAGS:bc,ALLOWED_ATTR:xc,FORBID_ATTR:yc,ALLOW_DATA_ATTR:!1,ALLOW_UNKNOWN_PROTOCOLS:!1})}catch(o){return de("DOCX 불러오기 중 오류가 발생했습니다: "+o.message),null}}function he(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function gn(e){return typeof e=="string"?e.trim():""}function mn(e=[],o="decimal",r="각주"){const i=e.filter(a=>a==null?void 0:a.id);if(!i.length)return"";const n=i.map((a,s)=>`<li><sup>${he(Ro(a.number||s+1,o))}</sup> ${he(a.content||"").replace(/\n/g,"<br>")}</li>`).join("");return`<section data-export-notes="${he(r)}"><h2>${he(r)}</h2><ol>${n}</ol></section>`}function kc(e=[]){return e.length?e.length===1?`M ${e[0].x} ${e[0].y} L ${e[0].x} ${e[0].y}`:e.map((o,r)=>`${r===0?"M":"L"} ${o.x} ${o.y}`).join(" "):""}function wc(e=[],o=794,r=1123){const i=e.filter(a=>Array.isArray(a==null?void 0:a.points)&&a.points.length>0);if(!i.length)return"";const n=i.map(a=>`<path d="${he(kc(a.points))}" stroke="${he(a.color||"#000")}" stroke-width="${he(a.width||1)}" fill="none" opacity="${he(a.opacity??1)}" stroke-linecap="round" stroke-linejoin="round"/>`).join("");return`<section data-export-drawings="true"><h2>그리기</h2><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${he(o)} ${he(r)}" width="100%" height="auto">${n}</svg></section>`}function jc(e,o={},r={}){const i=e||"",n=gn(o.title),a=gn(o.subtitle),s=[n?`<h1 data-export-metadata="title" style="font-size:22pt;font-weight:700;margin:0 0 8px;font-family:'Noto Serif KR',Georgia,serif;">${he(n)}</h1>`:"",a?`<p data-export-metadata="subtitle" style="font-size:14pt;color:#777;margin:0 0 20px;font-family:'맑은 고딕',sans-serif;">${he(a)}</p>`:""].filter(Boolean).join(""),l=mn(r.footnotes||[],r.footnoteNumberFormat||"decimal","각주"),d=mn(r.endnotes||[],r.endnoteNumberFormat||"lowerRoman","미주"),m=wc(r.drawings||[],r.pageW,r.pageH);return`${s}${i}${m}${l}${d}`}const Dr="word-editor-autosave";function Sc(e,o,r={}){try{localStorage.setItem(Dr,JSON.stringify({html:e,doc:o,...r,timestamp:Date.now()}))}catch{}}function Cc(){try{const e=localStorage.getItem(Dr);return e?JSON.parse(e):null}catch{return null}}function Ht(){try{localStorage.removeItem(Dr)}catch{}}function bo(e){if(!e)return"";if(typeof document<"u"){const o=document.createElement("div");return o.innerHTML=e,(o.textContent||"").replace(/\s+/g," ").trim()}return String(e).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}function hn(e,o=240){const r=String(e||"").trim();if(!r)return null;if(r.length<=o)return r;const i=r.split(new RegExp("(?<=[.?!])\\s+"));let n="";for(const a of i){const s=n?`${n} ${a}`:a;if(s.length>o&&n.length>0||(n=s,n.length>=o))break}return(n||r).trim()}function $t(e,o="저장 중 오류가 발생했습니다"){return e?e.status===401?"관리자 로그인이 만료되었습니다":e.status===403?"저장 권한이 없습니다":e.message||o:o}function bn(e){return!e||e==="<p></p>"||bo(e).length===0}function dr(e){if(!e)return!1;const o=new Date(e);return!Number.isNaN(o.getTime())&&o.getTime()>Date.now()}function Ut(e){return e?String(e).replace(" ","T").slice(0,16):""}function Wt(e){return e.isPublished?"published":dr(e.scheduledPublishAt)?"scheduled":"draft"}function Tc(e,o={}){const[r,i]=u.useState({...lo}),[n,a]=u.useState(null),[s,l]=u.useState([]),[d,m]=u.useState(!1),[p,f]=u.useState(""),[c,g]=u.useState(!1),k=u.useRef(null),v=u.useRef(null),y=u.useRef(!1),h=u.useRef(r),x=u.useRef(n);u.useEffect(()=>{h.current=r},[r]),u.useEffect(()=>{x.current=n},[n]);const w=u.useRef(o);u.useEffect(()=>{w.current=o},[o]);const b=u.useCallback(()=>{k.current&&(clearTimeout(k.current),k.current=null),v.current&&(clearTimeout(v.current),v.current=null)},[]);u.useEffect(()=>b,[b]);const I=E=>({id:`blog:${E.id}`,title:E.title||"",documentType:"blog",blogCategory:E.category||"construction_realestate",status:Wt(E),_source:"blog",_blogId:E.id,_blogSlug:E.slug,_blogCategory:E.category,_blogContent:E.content,_blogExcerpt:E.excerpt,_blogAuthor:E.author,_blogThumbnailUrl:E.thumbnailUrl,_blogSeoTitle:E.seoTitle,_blogSeoDescription:E.seoDescription,_blogCanonicalUrl:E.canonicalUrl,_blogOgImageUrl:E.ogImageUrl,_blogGeoSummary:E.geoSummary,_blogGeoFaq:E.geoFaq,_blogGeoKeywords:E.geoKeywords,_blogFootnotes:E.footnotes,_blogIsPublished:E.isPublished,_blogPublishedAt:E.publishedAt,_blogScheduledPublishAt:E.scheduledPublishAt,_blogTags:E.tags}),P=async()=>{var T;const E=await fe.get("/blog?all=true&limit=200&page=1").catch(()=>({data:[],meta:null})),O=[...E.data||[]],_=((T=E.meta)==null?void 0:T.totalPages)||1;for(let D=2;D<=_;D+=1){const F=await fe.get(`/blog?all=true&limit=200&page=${D}`).catch(()=>({data:[]}));O.push(...F.data||[])}return O},A=u.useCallback(async()=>{try{const[E,O]=await Promise.all([fe.get("/documents?limit=200").catch(()=>({data:[]})),P()]),_=E.data||[],T=(O||[]).map(I);l([...T,..._])}catch(E){f(`오류: ${$t(E,"문서 목록을 불러오지 못했습니다")}`),l([])}},[]),L=u.useCallback(async E=>{var O,_,T,D,F,W,z,U,K,$,V,G;try{if(b(),m(!0),typeof E=="string"&&E.startsWith("blog:")){const ie=E.slice(5);let H=s.find(ee=>ee.id===E);if(H)H={id:H._blogId,slug:H._blogSlug,title:H.title,category:H._blogCategory,content:H._blogContent,excerpt:H._blogExcerpt,author:H._blogAuthor,isPublished:H._blogIsPublished,thumbnailUrl:H._blogThumbnailUrl,seoTitle:H._blogSeoTitle,seoDescription:H._blogSeoDescription,canonicalUrl:H._blogCanonicalUrl,ogImageUrl:H._blogOgImageUrl,geoSummary:H._blogGeoSummary,geoFaq:H._blogGeoFaq,geoKeywords:H._blogGeoKeywords,footnotes:H._blogFootnotes,publishedAt:H._blogPublishedAt,scheduledPublishAt:H._blogScheduledPublishAt,tags:H._blogTags};else if(H=(await P()).find(be=>be.id===ie),!H)throw new Error("블로그 게시글을 찾을 수 없습니다");a(E),i({title:H.title||"",documentType:"blog",blogCategory:H.category||"construction_realestate",subtitle:"",author:H.author||"",source:"",publishedDate:H.publishedAt?String(H.publishedAt).slice(0,10):"",contentMarkdown:"",summary:H.excerpt||"",tags:Oe(H.tags),slug:H.slug||"",thumbnailUrl:H.thumbnailUrl||"",seoTitle:H.seoTitle||"",seoDescription:H.seoDescription||"",canonicalUrl:H.canonicalUrl||"",ogImageUrl:H.ogImageUrl||"",geoSummary:H.geoSummary||"",geoFaq:H.geoFaq||"",geoKeywords:Oe(H.geoKeywords),status:Wt(H),scheduledPublishAt:Ut(H.scheduledPublishAt),importance:3,_source:"blog",_blogId:H.id,_blogSlug:H.slug});const ne=Sd(H.footnotes),J=ne.length?ne:jd(H.content||"");(_=(O=w.current).hydrateFootnotes)==null||_.call(O,{footnotes:J,endnotes:[],footnoteNumberFormat:"decimal"}),(D=(T=w.current).hydrateDrawings)==null||D.call(T,[]),(W=(F=w.current).hydrateHeaderFooter)==null||W.call(F,{}),e&&e.commands.setContent(Ei(H.content||"")),f("저장됨");return}const q=(await fe.get("/documents/"+E)).data;a(E),i({title:q.title||"",documentType:q.documentType||"article",subtitle:q.subtitle||"",author:q.author||"",source:q.source||"",publishedDate:q.publishedDate?q.publishedDate.slice(0,10):"",contentMarkdown:q.contentMarkdown||"",contentHtml:q.contentHtml||"",summary:q.summary||"",status:q.status||"draft",importance:q.importance??3,tags:q.tags||"",slug:q.slug||"",scheduledPublishAt:q.scheduledPublishAt?Ut(q.scheduledPublishAt):"",metadata:q.metadata||null});const Y=wd(q.metadata);if((U=(z=w.current).hydrateFootnotes)==null||U.call(z,Y),($=(K=w.current).hydrateDrawings)==null||$.call(K,Y.drawings||[]),(G=(V=w.current).hydrateHeaderFooter)==null||G.call(V,Y),e){let ie=q.contentHtml||"";!ie&&q.contentMarkdown&&(ie=sc(q.contentMarkdown)?Jn(q.contentMarkdown):"<p>"+q.contentMarkdown.replace(/\n/g,"</p><p>")+"</p>"),e.commands.setContent(ie||"")}f("저장됨")}catch(B){f(`오류: ${$t(B,"문서를 불러오지 못했습니다")}`)}finally{m(!1)}},[e,s,b]),C=u.useCallback(async(E=!1,O=null)=>{var G,B;if(!e||E&&y.current)return;f("저장 중...");const _=(O==null?void 0:O.doc)||r,T=(O==null?void 0:O.docId)??n,D=(O==null?void 0:O.html)??e.getHTML(),F=!!O,W=_.documentType==="blog"||_._source==="blog",z=(O==null?void 0:O.footnotes)||w.current||{},U=W?lr(D,z.footnotes||[],z.footnoteNumberFormat||"decimal"):D,K=dr(_.scheduledPublishAt),$=_.status==="scheduled"&&!K,V={title:_.title||"제목 없음",category:_.blogCategory||"construction_realestate",content:U,excerpt:_.summary||hn(bo(U))||null,author:_.author||null,thumbnailUrl:_.thumbnailUrl||null,slug:_.slug||void 0,tags:_.tags||null,seoTitle:_.seoTitle||null,seoDescription:_.seoDescription||null,canonicalUrl:_.canonicalUrl||null,ogImageUrl:_.ogImageUrl||_.thumbnailUrl||null,geoSummary:_.geoSummary||null,geoFaq:_.geoFaq||null,geoKeywords:_.geoKeywords||null,footnotes:JSON.stringify(z.footnotes||[]),scheduledPublishAt:K?_.scheduledPublishAt:null,isPublished:_.status==="published"&&!K};try{if(W){if(bn(V.content)){if(E){f("로컬 저장됨");return}throw new Error("블로그 본문을 입력해 주세요")}if(!((G=_.title)!=null&&G.trim())){if(E){f("로컬 저장됨");return}throw new Error("블로그 제목을 입력해 주세요")}if($){if(E){f("로컬 저장됨");return}throw new Error("예약 발행에는 미래 예약 일시가 필요합니다")}if(!_._blogId){if(E){f("로컬 저장됨");return}const J=(await fe.post("/blog",V)).data;J!=null&&J.id&&(F||(a(`blog:${J.id}`),i(ee=>({...ee,_source:"blog",_blogId:J.id,_blogSlug:J.slug,_blogCategory:J.category,slug:J.slug||ee.slug,tags:Oe(J.tags||ee.tags),status:Wt(J),thumbnailUrl:J.thumbnailUrl||ee.thumbnailUrl,seoTitle:J.seoTitle||ee.seoTitle,seoDescription:J.seoDescription||ee.seoDescription,canonicalUrl:J.canonicalUrl||ee.canonicalUrl,ogImageUrl:J.ogImageUrl||ee.ogImageUrl,geoSummary:J.geoSummary||ee.geoSummary,geoFaq:J.geoFaq||ee.geoFaq,geoKeywords:Oe(J.geoKeywords||ee.geoKeywords),publishedDate:J.publishedAt?String(J.publishedAt).slice(0,10):ee.publishedDate,scheduledPublishAt:Ut(J.scheduledPublishAt)})))),await A(),Ht(),f("저장됨");return}const H=(await fe.patch("/blog/"+_._blogId,V)).data;H&&!F&&i(ne=>({...ne,_blogSlug:H.slug||ne._blogSlug,_blogCategory:H.category||ne._blogCategory,slug:H.slug||ne.slug,tags:Oe(H.tags||ne.tags),status:Wt(H),thumbnailUrl:H.thumbnailUrl||"",seoTitle:H.seoTitle||"",seoDescription:H.seoDescription||"",canonicalUrl:H.canonicalUrl||"",ogImageUrl:H.ogImageUrl||"",geoSummary:H.geoSummary||"",geoFaq:H.geoFaq||"",geoKeywords:Oe(H.geoKeywords),publishedDate:H.publishedAt?String(H.publishedAt).slice(0,10):"",scheduledPublishAt:Ut(H.scheduledPublishAt)})),await A(),F||Ht(),f("저장됨");return}const q=lc(U),Y={title:_.title||"제목 없음",documentType:_.documentType,subtitle:_.subtitle,author:_.author,source:_.source,publishedDate:_.publishedDate||null,contentHtml:U,contentMarkdown:q,contentPlain:bo(U),summary:_.summary,status:_.status,importance:_.importance,metadata:kd(_,z)};if(T)await fe.patch("/documents/"+T,Y);else{if(E){f("로컬 저장됨");return}const H=(B=(await fe.post("/documents",Y)).data)==null?void 0:B.id;H&&!F&&(a(H),A())}F||Ht(),f("저장됨")}catch(q){f(`오류: ${$t(q)}`)}},[e,r,n,A]),S=u.useCallback(async()=>{var z;if(!e||y.current)return;b(),y.current=!0,g(!0);const E=e.getHTML(),O=w.current||{},_=lr(E,O.footnotes||[],O.footnoteNumberFormat||"decimal"),T=h.current,D=x.current;if(bn(E)){f("오류: 블로그 본문을 입력해 주세요"),y.current=!1,g(!1);return}if(!((z=T.title)!=null&&z.trim())){f("오류: 블로그 제목을 입력해 주세요"),y.current=!1,g(!1);return}const F=dr(T.scheduledPublishAt);if(T.status==="scheduled"&&!F){f("오류: 예약 발행에는 미래 예약 일시가 필요합니다"),y.current=!1,g(!1);return}f(F?"예약 중...":"발행 중...");const W={title:T.title.trim(),category:T.blogCategory||"construction_realestate",content:_,excerpt:T.summary||hn(bo(_))||null,author:T.author||null,thumbnailUrl:T.thumbnailUrl||null,slug:T.slug||void 0,tags:T.tags||null,seoTitle:T.seoTitle||null,seoDescription:T.seoDescription||null,canonicalUrl:T.canonicalUrl||null,ogImageUrl:T.ogImageUrl||T.thumbnailUrl||null,geoSummary:T.geoSummary||null,geoFaq:T.geoFaq||null,geoKeywords:T.geoKeywords||null,footnotes:JSON.stringify(O.footnotes||[]),scheduledPublishAt:F?T.scheduledPublishAt:null,isPublished:!F};try{const U=T._blogId||(typeof D=="string"&&D.startsWith("blog:")?D.slice(5):null),$=(U?await fe.patch("/blog/"+U,W):await fe.post("/blog",W)).data,V=!!($!=null&&$.isPublished)&&!($!=null&&$.scheduledPublishAt),G=!!($!=null&&$.scheduledPublishAt);$!=null&&$.id&&(a(`blog:${$.id}`),i(B=>({...B,documentType:"blog",blogCategory:$.category||W.category,status:Wt($),summary:$.excerpt||B.summary,slug:$.slug||B.slug,tags:Oe($.tags||B.tags),thumbnailUrl:$.thumbnailUrl||B.thumbnailUrl||"",seoTitle:$.seoTitle||B.seoTitle||"",seoDescription:$.seoDescription||B.seoDescription||"",canonicalUrl:$.canonicalUrl||B.canonicalUrl||"",ogImageUrl:$.ogImageUrl||B.ogImageUrl||"",geoSummary:$.geoSummary||B.geoSummary||"",geoFaq:$.geoFaq||B.geoFaq||"",geoKeywords:Oe($.geoKeywords||B.geoKeywords),publishedDate:$.publishedAt?String($.publishedAt).slice(0,10):B.publishedDate,scheduledPublishAt:Ut($.scheduledPublishAt),_source:"blog",_blogId:$.id,_blogSlug:$.slug,_blogCategory:$.category}))),Ht(),await A(),f(G?"예약됨":V?"발행됨":"저장됨"),V?de("블로그 게시글이 발행되었습니다."):G&&de("블로그 게시글이 예약되었습니다.")}catch(U){f(`오류: ${$t(U,"블로그 발행 중 오류가 발생했습니다")}`)}finally{y.current=!1,g(!1)}},[e,A,b]),R=u.useCallback(()=>{var E,O,_,T,D,F;b(),a(null),i({...lo}),(O=(E=w.current).resetFootnotes)==null||O.call(E),(T=(_=w.current).resetDrawings)==null||T.call(_),(F=(D=w.current).resetHeaderFooter)==null||F.call(D),e&&e.commands.setContent(""),f("")},[e,b]),j=u.useCallback(()=>{var E,O,_,T,D,F;b(),a(null),i({...lo,documentType:"blog",author:"법무법인 하이로",status:"draft"}),(O=(E=w.current).resetFootnotes)==null||O.call(E),(T=(_=w.current).resetDrawings)==null||T.call(_),(F=(D=w.current).resetHeaderFooter)==null||F.call(D),e&&e.commands.setContent(""),f("")},[e,b]),M=u.useCallback(async E=>{var _,T,D,F,W,z;const O=typeof E=="string"?E:E==null?void 0:E.id;if(O)try{b(),f("삭제 중..."),O.startsWith("blog:")?await fe.delete(`/blog/${O.slice(5)}`):await fe.delete(`/documents/${O}`),x.current===O&&(a(null),i({...lo}),(T=(_=w.current).resetFootnotes)==null||T.call(_),(F=(D=w.current).resetDrawings)==null||F.call(D),(z=(W=w.current).resetHeaderFooter)==null||z.call(W),e&&e.commands.setContent(""),Ht()),await A(),f("삭제됨")}catch(U){f(`오류: ${$t(U,"삭제 중 오류가 발생했습니다")}`)}},[e,A,b]),N=u.useCallback(()=>{y.current||(k.current&&clearTimeout(k.current),v.current&&clearTimeout(v.current),f("수정됨"),k.current=setTimeout(()=>{if(e&&!e.isDestroyed){const E=e.getHTML(),O={html:E,doc:{...h.current},docId:x.current,footnotes:{...w.current}};Sc(E,O.doc,{footnotes:O.footnotes}),f("로컬 저장됨"),v.current=setTimeout(()=>C(!0,O),Wa)}},1e3))},[e,C]);return{doc:r,setDoc:i,docId:n,setDocId:a,documents:s,setDocuments:l,loading:d,saveStatus:p,setSaveStatus:f,isPublishing:c,loadDocument:L,handleSave:C,handleNew:R,handleNewBlog:j,handleDeleteDocument:M,refreshList:A,handlePublishBlog:S,scheduleAutoSave:N}}function Mc(e,o){const[r,i]=u.useReducer(xs,null,bs),[n,a]=u.useState(()=>gs()),[s,l]=u.useState(!1),d=u.useRef(null),m=u.useCallback(b=>{n?b(n):(l(!0),d.current=b)},[n]),p=u.useCallback(()=>{l(!1),d.current=null},[]),f=u.useCallback((b,I)=>{const P=hs(b,I);ms(P),a(P),l(!1),d.current&&(d.current(P),d.current=null)},[]),c=u.useCallback(()=>{e&&m(b=>{const{from:I,to:P}=e.state.selection,A=ei();if(I===P){const C=e.state.doc.resolve(I);if(!C.parent.textContent.trim())return;const R=C.parent.textBetween(0,C.parentOffset),j=C.parent.textBetween(C.parentOffset,C.parent.content.size),M=R.search(/\S+$/),N=j.match(/^\S+/),E=N?C.parentOffset+N[0].length:C.parentOffset,O=C.start()+(M>=0?M:C.parentOffset),_=C.start()+E;if(O<_)e.chain().focus().setTextSelection({from:O,to:_}).setComment(A).run();else return}else e.chain().focus().setComment(A).run();const L=ti(b,"");L.id=A,i({type:"ADD_COMMENT",comment:L})})},[e,m]),g=u.useCallback(()=>{!e||!r.activeCommentId||(e.commands.unsetComment(r.activeCommentId),i({type:"DELETE_COMMENT",id:r.activeCommentId}))},[e,r.activeCommentId]),k=u.useCallback(()=>{e&&(e.commands.unsetAllComments(),i({type:"DELETE_ALL"}))},[e]),v=u.useCallback(()=>{if(!e)return;const{from:b}=e.state.selection,I=ys(e,b);I&&(e.commands.setTextSelection({from:I.from,to:I.to}),e.commands.scrollIntoView(),i({type:"SET_ACTIVE",id:I.commentId}))},[e]),y=u.useCallback(()=>{if(!e)return;const{from:b}=e.state.selection,I=vs(e,b);I&&(e.commands.setTextSelection({from:I.from,to:I.to}),e.commands.scrollIntoView(),i({type:"SET_ACTIVE",id:I.commentId}))},[e]);u.useEffect(()=>{const b=()=>c();return window.addEventListener("comment:insert",b),()=>window.removeEventListener("comment:insert",b)},[c]),u.useEffect(()=>{Object.keys(r.comments).length>0&&ks(o,r.comments)},[r.comments,o]),u.useEffect(()=>{const b=ws(o);b&&Object.keys(b).length>0&&i({type:"LOAD_COMMENTS",comments:b})},[o]),u.useEffect(()=>{if(!e||e.isDestroyed)return;const b=()=>{var A;if(!e||e.isDestroyed)return;let P;try{P=(A=e.view)==null?void 0:A.dom}catch{return}P&&P.querySelectorAll("span.comment-highlight").forEach(L=>{const C=L.getAttribute("data-comment-id");L.classList.toggle("comment-active",C===r.activeCommentId);const S=r.comments[C];L.classList.toggle("comment-resolved",(S==null?void 0:S.resolved)??!1)})},I=setTimeout(b,0);return e.on("update",b),()=>{clearTimeout(I),e.off("update",b)}},[e,r.activeCommentId,r.comments]);const h=u.useCallback(()=>{i({type:"DELETE_ALL"})},[]),x=u.useCallback(b=>{i({type:"LOAD_COMMENTS",comments:b})},[]),w=u.useCallback(b=>{i({type:"SET_ACTIVE",id:b})},[]);return{commentStore:r,commentDispatch:i,commentAuthor:n,showAuthorDialog:s,handleInsertComment:c,handleAuthorSave:f,handleAuthorCancel:p,handleDeleteActiveComment:g,handleDeleteAllComments:k,handleNextComment:v,handlePrevComment:y,deleteAllComments:h,loadComments:x,setActiveComment:w}}const xn=40;function Ec(){const[e,o]=u.useState("normal"),[r,i]=u.useState({top:96,bottom:96,left:120,right:120}),[n,a]=u.useState("portrait"),[s,l]=u.useState("a4"),[d,m]=u.useState(1),[p,f]=u.useState("#ffffff"),[c,g]=u.useState(""),[k,v]=u.useState(null),[y,h]=u.useState({headerPos:12.5,footerPos:12.5,differentFirstPage:!1,differentOddEven:!1}),x=u.useMemo(()=>{const w=$r.find(M=>M.value===s)||$r[0],b=Ur.find(M=>M.value===e)||Ur[1],I=n==="portrait"?w.width:w.height,P=n==="portrait"?w.height:w.width,A=e==="custom"?r.top:b.top,L=e==="custom"?r.bottom:b.bottom,C=e==="custom"?r.left:b.left,S=e==="custom"?r.right:b.right,R=P-A-L,j=L+xn+A;return{pageW:I,pageH:P,marginTop:A,marginBottom:L,marginLeft:C,marginRight:S,contentAreaHeight:R,gapH:j}},[e,r,n,s]);return{margins:e,setMargins:o,customMargins:r,setCustomMargins:i,orientation:n,setOrientation:a,pageSize:s,setPageSize:l,columns:d,setColumns:m,pageColor:p,setPageColor:f,watermarkText:c,setWatermarkText:g,pageBorder:k,setPageBorder:v,headerFooterSettings:y,setHeaderFooterSettings:h,...x,PAGE_GAP:xn}}const yn=[8,9,10,10.5,11,12,14,16,18,20,22,24,28,36,48,72];function zc(e,o){const r=u.useRef(o);r.current=o;const i=u.useCallback(n=>{if(!e)return;const a=parseFloat(e.getAttributes("textStyle").fontSize||"11"),s=n==="up"?yn.find(l=>l>a)||72:[...yn].reverse().find(l=>l<a)||8;e.chain().focus().setFontSize(s+"pt").run()},[e]);u.useEffect(()=>{const n=a=>{var d,m,p,f,c,g,k,v;const s=a.ctrlKey||a.metaKey,l=r.current;s&&a.key==="s"&&(a.preventDefault(),(d=l.onSave)==null||d.call(l)),s&&a.key==="f"&&(a.preventDefault(),(m=l.onFind)==null||m.call(l)),s&&a.key==="h"&&(a.preventDefault(),(p=l.onReplace)==null||p.call(l)),s&&a.key==="k"&&(a.preventDefault(),(f=l.onHyperlink)==null||f.call(l)),s&&a.key==="d"&&(a.preventDefault(),(c=l.onFont)==null||c.call(l)),s&&a.key==="p"&&(a.preventDefault(),(g=l.onPrint)==null||g.call(l)),s&&a.altKey&&a.key==="m"&&(a.preventDefault(),(k=l.onComment)==null||k.call(l)),a.key==="F11"&&(a.preventDefault(),(v=l.onFullscreen)==null||v.call(l)),s&&a.shiftKey&&a.key===">"&&(a.preventDefault(),i("up")),s&&a.shiftKey&&a.key==="<"&&(a.preventDefault(),i("down"))};return window.addEventListener("keydown",n),()=>window.removeEventListener("keydown",n)},[i])}function Ic(e){return Array.from(document.querySelectorAll("[data-footnote-item-id]")).find(o=>o.getAttribute("data-footnote-item-id")===e)}function Pc(e){const[o,r]=u.useState([]),[i,n]=u.useState([]),[a,s]=u.useState(0),[l,d]=u.useState("decimal"),[m,p]=u.useState("lowerRoman"),f=u.useCallback(h=>{if(!e)return;const x=Fl();e.commands.insertFootnote(x,h),(h==="footnote"?r:n)(b=>[...b,{id:x,number:b.length+1,content:""}]),setTimeout(()=>{var I;const b=Ic(x);b&&(b.scrollIntoView({behavior:"smooth",block:"center"}),(I=b.querySelector(".footnote-item-text"))==null||I.click())},100)},[e]),c=u.useCallback(()=>f("footnote"),[f]),g=u.useCallback(()=>f("endnote"),[f]),k=u.useCallback(h=>{h.type==="footnote"?(d(h.numberFormat),c()):(p(h.numberFormat),g())},[c,g]),v=u.useCallback(()=>{r([]),n([])},[]),y=u.useCallback((h={})=>{r(Array.isArray(h.footnotes)?h.footnotes:[]),n(Array.isArray(h.endnotes)?h.endnotes:[]),h.footnoteNumberFormat&&d(h.footnoteNumberFormat),h.endnoteNumberFormat&&p(h.endnoteNumberFormat)},[]);return{footnotes:o,setFootnotes:r,endnotes:i,setEndnotes:n,footnoteAreaHeight:a,setFootnoteAreaHeight:s,footnoteNumberFormat:l,setFootnoteNumberFormat:d,endnoteNumberFormat:m,setEndnoteNumberFormat:p,handleInsertFootnote:c,handleInsertEndnote:g,handleFootnoteDialogInsert:k,resetFootnotes:v,hydrateFootnotes:y}}function Ac({editor:e,doc:o,setDoc:r,setSaveStatus:i,editorCanvasRef:n,layoutOptions:a,footnoteState:s,drawingState:l}){const d=u.useCallback(()=>jc((e==null?void 0:e.getHTML())||"",o,{footnotes:(s==null?void 0:s.footnotes)||[],footnoteNumberFormat:(s==null?void 0:s.footnoteNumberFormat)||"decimal",endnotes:(s==null?void 0:s.endnotes)||[],endnoteNumberFormat:(s==null?void 0:s.endnoteNumberFormat)||"lowerRoman",drawings:(l==null?void 0:l.strokes)||[]}),[e,o,s,l]),m=u.useCallback(()=>{e&&cc(d(),o.title||"문서")},[e,o.title,d]),p=u.useCallback(()=>{var y;const v=(n==null?void 0:n.current)||((y=e==null?void 0:e.view)==null?void 0:y.dom);v?pc(v,o.title||"문서",a):de("에디터 요소를 찾을 수 없습니다.")},[e,o.title,n,a]),f=u.useCallback(()=>{e&&fc(d(),o.title||"문서")},[e,o.title,d]),c=u.useCallback(()=>{e&&gc(d(),o.title||"문서")},[e,o.title,d]),g=u.useCallback(()=>{e&&hc(d(),o.title||"문서")},[e,o.title,d]),k=u.useCallback(()=>{const v=document.createElement("input");v.type="file",v.accept=".docx",v.onchange=async y=>{var w;const h=(w=y.target.files)==null?void 0:w[0];if(!h)return;const x=await vc(h);x&&e&&(e.commands.setContent(x),r(b=>({...b,title:h.name.replace(".docx","")})),i("불러옴"))},v.click()},[e,r,i]);return{handleExportDocx:m,handleExportPdf:p,handleExportHtml:f,handleExportMarkdown:c,handleExportHwpx:g,handleImportDocx:k}}const Vt=new Sr("visualPagination");function Pe(e,o=0){const r=Number(e);return`${Number.isFinite(r)?r:o}px`}function vn(e,o,r){if(!r)return;const i=document.createElement("div");i.className=`editor-page-gap-running-text ${o}`,i.textContent=r,e.appendChild(i)}function kn(e,o,r){const i=r?"top":"bottom",n=r?0:Number(o.marginBottom||0)-1,a=r?Number(o.marginTop||0)-1:0,s=Number(o.marginLeft||0),l=Number(o.marginRight||0);for(const d of["left","right"]){const m=document.createElement("span");m.className=`editor-page-gap-guide ${i} ${d}`,m.style[i]="0px",m.style[d]=Pe(d==="left"?s:l),r?m.style.top=Pe(n):m.style.bottom=Pe(a),e.appendChild(m)}}function Lc(e={}){const o=document.createElement("div");o.className="editor-page-gap",o.dataset.pageGap="true",o.contentEditable="false",o.style.width=Pe(e.pageWidth),o.style.marginLeft=`-${Pe(e.marginLeft)}`,o.style.marginRight=`-${Pe(e.marginRight)}`,o.style.pointerEvents="none",o.style.setProperty("--page-gap-page-bg",e.pageBg||"#fff"),o.style.setProperty("--page-gap-canvas-bg",e.canvasBg||"#e8e8e8"),o.style.setProperty("--page-gap-label",e.labelColor||"#aaa"),o.style.setProperty("--page-gap-guide",e.guideColor||"#c0c0c0");const r=document.createElement("div");r.className="editor-page-gap-surface footer",r.style.height=Pe(e.marginBottom),vn(r,"footer-text",e.footerText),kn(r,e,!1);const i=document.createElement("div");i.className="editor-page-gap-separator",i.style.height=Pe(e.pageGap,20),i.style.boxShadow=`inset 0 1px 0 ${e.shadowColor||"rgba(0,0,0,0.08)"}, inset 0 -1px 0 ${e.shadowColor||"rgba(0,0,0,0.08)"}`,i.textContent=`${e.afterPage||1} / ${e.page||2}`;const n=document.createElement("div");return n.className="editor-page-gap-surface header",n.style.height=Pe(e.marginTop),vn(n,"header-text",e.headerText),kn(n,e,!0),o.append(r,i,n),o}function Dc(e,o=[]){const r=e.doc.content.size,i=o.filter(n=>n&&Number.isFinite(Number(n.pos))).map(n=>{const a=Math.max(0,Math.min(r,Number(n.pos))),s=`pgap-${a}-${n.page||""}-${n.afterPage||""}`;return Ga.widget(a,()=>Lc(n),{side:-1,key:s})});return Va.create(e.doc,i)}const _c=ue.create({name:"visualPagination",addProseMirrorPlugins(){return[new jr({key:Vt,state:{init(){return{breaks:[]}},apply(e,o){const r=e.getMeta(Vt);return r||o}},props:{decorations(e){const o=Vt.getState(e);return Dc(e,(o==null?void 0:o.breaks)||[])}}})]}}),wn=40,jn=.4,Rc=".editor-canvas-scroll";function rr(){const e=window.getSelection();if(!e||e.rangeCount===0)return;const r=e.getRangeAt(0).getBoundingClientRect();if(!r||r.width===0&&r.height===0)return;const i=document.querySelector(Rc);if(!i)return;const n=i.getBoundingClientRect(),a=r.top-n.top,s=r.bottom-n.top,l=n.height;if(s>l-wn){const d=i.scrollTop+s-l+l*jn;i.scrollTo({top:d,behavior:"auto"})}else if(a<wn){const d=i.scrollTop+a-l*jn;i.scrollTo({top:Math.max(0,d),behavior:"auto"})}}const Nc=20;function Fc({editor:e,viewMode:o,darkMode:r,pageColor:i,pageW:n,contentAreaHeight:a,marginTop:s,marginBottom:l,marginLeft:d,marginRight:m,headerText:p,footerText:f,PAGE_GAP:c=Nc,editorCanvasRef:g,setDynamicPageCount:k}){const[v,y]=u.useState([]),h=u.useRef(""),x=u.useRef(null),w=r?"#2d2d2d":i||"#fff",b=r?"#1e1e1e":"#e8e8e8";return u.useEffect(()=>{if(!e)return;if(o!=="edit"){h.current&&(h.current="",e.view.dispatch(e.state.tr.setMeta(Vt,{breaks:[]})));return}const I=(j,M)=>(j||"").replace(/\{PAGE\}/g,String(M)),P=(j,M,N)=>({pos:j,page:M,afterPage:N,pageWidth:n,pageGap:c,marginTop:s,marginBottom:l,marginLeft:d,marginRight:m,pageBg:w,canvasBg:b,guideColor:r?"#555":"#c0c0c0",labelColor:r?"#777":"#aaa",shadowColor:r?"rgba(0,0,0,0.45)":"rgba(0,0,0,0.08)",headerText:I(p,M),footerText:I(f,N)}),A=()=>{var K,$,V;if(!e||e.isDestroyed)return;let j;try{j=(K=e.view)==null?void 0:K.dom}catch{return}if(!j||a<=0)return;const M=[];e.state.doc.forEach((G,B)=>{M.push({node:G,offset:B})});const N=Math.max(0,j.offsetTop-s),E=Math.max(Ul,a-N);let O=1,_=0,T=E,D=0,F=0,W=0;const z=[];for(const G of Array.from(j.children)){if(!(G instanceof HTMLElement))continue;if(G.dataset.pageGap==="true"){D+=G.offsetHeight;continue}const B=M[F++];if(!B)break;const q=B.node.type.name,Y=(($=B.node.attrs)==null?void 0:$.sectionType)||"next-page";if(q==="pageBreak"||q==="sectionBreak"&&Y!=="continuous"){W+=1;continue}(V=B.node.attrs)!=null&&V.pageBreakBefore&&(W+=1);const H=G.offsetTop-D,ne=H+G.offsetHeight,J=G.offsetHeight<=a;for(;W>0;)z.push(P(B.offset,O+1,O)),O+=1,_=H,T=H+a,W-=1;for(;H>=T-1;)O+=1,_=T,T=_+a;if(!(ne<=T+1)){if(J&&H>_+1){z.push(P(B.offset,O+1,O)),O+=1,_=H,T=H+a;continue}for(;ne>T+1;)O+=1,T+=a}}O+=W,k(Math.max(1,O)),y(z);const U=JSON.stringify({breaks:z.map(({pos:G,page:B,afterPage:q})=>[G,B,q]),pageW:n,marginTop:s,marginBottom:l,marginLeft:d,marginRight:m,pageBg:w,canvasBg:b,headerText:p,footerText:f});U!==h.current&&(h.current=U,e.view.dispatch(e.state.tr.setMeta(Vt,{breaks:z}))),rr()},L=()=>{x.current&&cancelAnimationFrame(x.current),x.current=requestAnimationFrame(A)};e.on("update",L),e.on("selectionUpdate",rr);const C=setTimeout(L,100),S=new ResizeObserver(L),R=setTimeout(()=>{var j;try{const M=(j=e.view)==null?void 0:j.dom;M&&S.observe(M)}catch{}g.current&&S.observe(g.current)},0);return()=>{e.off("update",L),e.off("selectionUpdate",rr),clearTimeout(C),clearTimeout(R),x.current&&cancelAnimationFrame(x.current),S.disconnect()}},[e,o,a,n,s,l,d,m,w,b,r,p,f,c,g,k]),{pageBreaks:v,pageBg:w,canvasBg:b}}const Oc=ue.create({name:"fontSize",addOptions(){return{types:["textStyle"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{fontSize:{default:null,parseHTML:e=>{var o;return((o=e.style.fontSize)==null?void 0:o.replace(/['"]+/g,""))||null},renderHTML:e=>e.fontSize?{style:`font-size: ${e.fontSize}`}:{}}}}]},addCommands(){return{setFontSize:e=>({chain:o})=>o().setMark("textStyle",{fontSize:e}).run(),unsetFontSize:()=>({chain:e})=>e().setMark("textStyle",{fontSize:null}).removeEmptyTextStyle().run()}}}),Bc=ue.create({name:"lineSpacing",addOptions(){return{types:["paragraph","heading"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{lineSpacing:{default:null,parseHTML:e=>e.style.lineHeight||null,renderHTML:e=>e.lineSpacing?{style:`line-height: ${e.lineSpacing}`}:{}}}}]},addCommands(){return{setLineSpacing:e=>({tr:o,state:r,dispatch:i})=>{const{selection:n}=r,{from:a,to:s}=n;let l=!1;return r.doc.nodesBetween(a,s,(d,m)=>{this.options.types.includes(d.type.name)&&(o.setNodeMarkup(m,void 0,{...d.attrs,lineSpacing:e}),l=!0)}),l&&i&&i(o),!0},unsetLineSpacing:()=>({tr:e,state:o,dispatch:r})=>{const{selection:i}=o,{from:n,to:a}=i;let s=!1;return o.doc.nodesBetween(n,a,(l,d)=>{if(this.options.types.includes(l.type.name)){const m={...l.attrs};delete m.lineSpacing,e.setNodeMarkup(d,void 0,m),s=!0}}),s&&r&&r(e),!0}}}}),Hc=ue.create({name:"indent",addOptions(){return{types:["paragraph","heading"],minLevel:0,maxLevel:10}},addGlobalAttributes(){return[{types:this.options.types,attributes:{indent:{default:0,parseHTML:e=>{const o=e.style.marginLeft;return o&&Math.round(parseInt(o)/40)||0},renderHTML:e=>!e.indent||e.indent<=0?{}:{style:`margin-left: ${e.indent*40}px`}}}}]},addCommands(){return{increaseIndent:()=>({tr:e,state:o,dispatch:r})=>{const{selection:i}=o,{from:n,to:a}=i;let s=!1;return o.doc.nodesBetween(n,a,(l,d)=>{if(this.options.types.includes(l.type.name)){const m=l.attrs.indent||0;m<this.options.maxLevel&&(e.setNodeMarkup(d,void 0,{...l.attrs,indent:m+1}),s=!0)}}),s&&r&&r(e),s},decreaseIndent:()=>({tr:e,state:o,dispatch:r})=>{const{selection:i}=o,{from:n,to:a}=i;let s=!1;return o.doc.nodesBetween(n,a,(l,d)=>{if(this.options.types.includes(l.type.name)){const m=l.attrs.indent||0;m>this.options.minLevel&&(e.setNodeMarkup(d,void 0,{...l.attrs,indent:m-1}),s=!0)}}),s&&r&&r(e),s}}},addKeyboardShortcuts(){return{Tab:()=>this.editor.commands.increaseIndent(),"Shift-Tab":()=>this.editor.commands.decreaseIndent()}}}),$c=ue.create({name:"paragraphSpacing",addOptions(){return{types:["paragraph","heading"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{spacingBefore:{default:null,parseHTML:e=>e.style.marginTop||null,renderHTML:e=>e.spacingBefore?{style:`margin-top: ${e.spacingBefore}`}:{}},spacingAfter:{default:null,parseHTML:e=>e.style.marginBottom||null,renderHTML:e=>e.spacingAfter?{style:`margin-bottom: ${e.spacingAfter}`}:{}}}}]},addCommands(){return{setSpacingBefore:e=>({tr:o,state:r,dispatch:i})=>{const{selection:n}=r,{from:a,to:s}=n;let l=!1;return r.doc.nodesBetween(a,s,(d,m)=>{this.options.types.includes(d.type.name)&&(o.setNodeMarkup(m,void 0,{...d.attrs,spacingBefore:e}),l=!0)}),l&&i&&i(o),!0},setSpacingAfter:e=>({tr:o,state:r,dispatch:i})=>{const{selection:n}=r,{from:a,to:s}=n;let l=!1;return r.doc.nodesBetween(a,s,(d,m)=>{this.options.types.includes(d.type.name)&&(o.setNodeMarkup(m,void 0,{...d.attrs,spacingAfter:e}),l=!0)}),l&&i&&i(o),!0}}}}),Uc=ue.create({name:"letterSpacing",addOptions(){return{types:["textStyle"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{letterSpacing:{default:null,parseHTML:e=>e.style.letterSpacing||null,renderHTML:e=>e.letterSpacing?{style:`letter-spacing: ${e.letterSpacing}`}:{}}}}]},addCommands(){return{setLetterSpacing:e=>({chain:o})=>o().setMark("textStyle",{letterSpacing:e}).run(),unsetLetterSpacing:()=>({chain:e})=>e().setMark("textStyle",{letterSpacing:null}).removeEmptyTextStyle().run()}}}),Wc=ue.create({name:"textShadow",addOptions(){return{types:["textStyle"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{textShadow:{default:null,parseHTML:e=>e.style.textShadow||null,renderHTML:e=>e.textShadow?{style:`text-shadow: ${e.textShadow}`}:{}}}}]},addCommands(){return{setTextShadow:e=>({chain:o})=>o().setMark("textStyle",{textShadow:e}).run(),unsetTextShadow:()=>({chain:e})=>e().setMark("textStyle",{textShadow:null}).removeEmptyTextStyle().run()}}}),Gc=ue.create({name:"textBorder",addOptions(){return{types:["textStyle"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{textBorder:{default:null,parseHTML:e=>e.style.border||null,renderHTML:e=>e.textBorder?{style:`border: ${e.textBorder}; padding: 1px 2px`}:{}}}}]},addCommands(){return{setTextBorder:e=>({chain:o})=>o().setMark("textStyle",{textBorder:e}).run(),unsetTextBorder:()=>({chain:e})=>e().setMark("textStyle",{textBorder:null}).removeEmptyTextStyle().run()}}});function Ge(e,o){return({tr:r,state:i,dispatch:n})=>{const{from:a,to:s}=i.selection;let l=!1;return i.doc.nodesBetween(a,s,(d,m)=>{e.includes(d.type.name)&&(r.setNodeMarkup(m,void 0,{...d.attrs,...o}),l=!0)}),l&&n&&n(r),!0}}const Vc=ue.create({name:"paragraphBorder",addOptions(){return{types:["paragraph","heading"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{borderTop:{default:null,parseHTML:e=>e.style.borderTop||null,renderHTML:e=>e.borderTop?{style:`border-top: ${e.borderTop}`}:{}},borderBottom:{default:null,parseHTML:e=>e.style.borderBottom||null,renderHTML:e=>e.borderBottom?{style:`border-bottom: ${e.borderBottom}`}:{}},borderLeft:{default:null,parseHTML:e=>e.style.borderLeft||null,renderHTML:e=>e.borderLeft?{style:`border-left: ${e.borderLeft}`}:{}},borderRight:{default:null,parseHTML:e=>e.style.borderRight||null,renderHTML:e=>e.borderRight?{style:`border-right: ${e.borderRight}`}:{}},borderColor:{default:null,parseHTML:e=>e.style.borderColor||null,renderHTML:e=>e.borderColor?{style:`border-color: ${e.borderColor}`}:{}},backgroundColor:{default:null,parseHTML:e=>e.style.backgroundColor||null,renderHTML:e=>e.backgroundColor?{style:`background-color: ${e.backgroundColor}`}:{}}}}]},addCommands(){return{setParagraphBorder:e=>Ge(this.options.types,e),setParagraphShading:e=>Ge(this.options.types,{backgroundColor:e}),unsetParagraphBorder:()=>Ge(this.options.types,{borderTop:null,borderBottom:null,borderLeft:null,borderRight:null,borderColor:null,backgroundColor:null})}}}),qc=ue.create({name:"dropCap",addOptions(){return{types:["paragraph"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{dropCap:{default:"none",parseHTML:e=>e.getAttribute("data-drop-cap")||"none",renderHTML:e=>!e.dropCap||e.dropCap==="none"?{}:{"data-drop-cap":e.dropCap}}}}]},addCommands(){return{setDropCap:e=>Ge(this.options.types,{dropCap:e}),unsetDropCap:()=>Ge(this.options.types,{dropCap:"none"})}}}),Kc=ue.create({name:"keepWithNext",addOptions(){return{types:["paragraph","heading"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{keepWithNext:{default:!1,parseHTML:e=>e.getAttribute("data-keep-with-next")==="true",renderHTML:e=>e.keepWithNext?{"data-keep-with-next":"true"}:{}}}}]},addCommands(){return{setKeepWithNext:e=>Ge(this.options.types,{keepWithNext:!!e})}}}),Xc=ue.create({name:"widowOrphan",addOptions(){return{types:["paragraph","heading"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{widowOrphan:{default:!0,parseHTML:e=>e.getAttribute("data-widow-orphan")!=="false",renderHTML:e=>e.widowOrphan!==!1?{}:{"data-widow-orphan":"false"}}}}]},addCommands(){return{setWidowOrphan:e=>Ge(this.options.types,{widowOrphan:!!e})}}});ue.create({name:"textDirection",addOptions(){return{types:["paragraph","heading"]}},addGlobalAttributes(){return[{types:this.options.types,attributes:{direction:{default:null,parseHTML:e=>e.getAttribute("dir")||null,renderHTML:e=>e.direction?{dir:e.direction}:{}}}}]},addCommands(){return{setTextDirection:e=>Ge(this.options.types,{direction:e})}}});const Yc=qe.create({name:"pageBreak",group:"block",atom:!0,parseHTML(){return[{tag:'div[data-type="page-break"]'}]},renderHTML(){return["div",{class:"page-break","data-type":"page-break"}]},addCommands(){return{setPageBreak:()=>({commands:e})=>e.insertContent({type:this.name})}},addKeyboardShortcuts(){return{"Mod-Enter":()=>this.editor.commands.setPageBreak()}}}),Jc=["next-page","continuous","even-page","odd-page"],Zc=qe.create({name:"sectionBreak",group:"block",atom:!0,addAttributes(){return{sectionType:{default:"next-page",parseHTML:e=>e.getAttribute("data-section-type")||"next-page",renderHTML:e=>({"data-section-type":e.sectionType})}}},parseHTML(){return[{tag:'div[data-type="section-break"]'}]},renderHTML({HTMLAttributes:e}){return["div",{class:"section-break","data-type":"section-break",...e}]},addCommands(){return{setSectionBreak:(e="next-page")=>({commands:o})=>{const r=Jc.includes(e)?e:"next-page";return o.insertContent({type:this.name,attrs:{sectionType:r}})}}}}),Qc=qe.create({name:"columnBreak",group:"block",atom:!0,parseHTML(){return[{tag:'div[data-type="column-break"]'}]},renderHTML(){return["div",{class:"column-break","data-type":"column-break"}]},addCommands(){return{setColumnBreak:()=>({commands:e})=>e.insertContent({type:this.name})}}}),eu=qe.create({name:"bookmark",group:"inline",inline:!0,atom:!0,addAttributes(){return{id:{default:null,parseHTML:e=>e.getAttribute("data-bookmark-id"),renderHTML:e=>({"data-bookmark-id":e.id})},name:{default:null,parseHTML:e=>e.getAttribute("data-bookmark-name"),renderHTML:e=>({"data-bookmark-name":e.name})}}},parseHTML(){return[{tag:"span.bookmark-anchor"}]},renderHTML({HTMLAttributes:e}){return["span",{class:"bookmark-anchor",...e}]},addCommands(){return{setBookmark:e=>({commands:o})=>{const r=`bm-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return o.insertContent({type:this.name,attrs:{id:r,name:e}})},removeBookmark:e=>({tr:o,state:r,dispatch:i})=>{let n=!1;return r.doc.descendants((a,s)=>{if(a.type.name===this.name&&a.attrs.name===e)return o.delete(s,s+a.nodeSize),n=!0,!1}),n&&i&&i(o),n}}}}),tu=_o.create({name:"trackInsert",inclusive:!0,excludes:"trackDelete",addAttributes(){return{author:{default:null,parseHTML:e=>e.getAttribute("data-author"),renderHTML:e=>({"data-author":e.author})},date:{default:null,parseHTML:e=>e.getAttribute("data-date"),renderHTML:e=>({"data-date":e.date})}}},parseHTML(){return[{tag:'span[data-track="insert"]'}]},renderHTML({HTMLAttributes:e}){return["span",{...e,"data-track":"insert",class:"track-insert"},0]},addCommands(){return{setTrackInsert:e=>({commands:o})=>o.setMark(this.name,{author:(e==null?void 0:e.author)||"사용자",date:(e==null?void 0:e.date)||new Date().toISOString()}),unsetTrackInsert:()=>({commands:e})=>e.unsetMark(this.name)}}}),ou=_o.create({name:"trackDelete",inclusive:!1,excludes:"trackInsert",addAttributes(){return{author:{default:null,parseHTML:e=>e.getAttribute("data-author"),renderHTML:e=>({"data-author":e.author})},date:{default:null,parseHTML:e=>e.getAttribute("data-date"),renderHTML:e=>({"data-date":e.date})}}},parseHTML(){return[{tag:'span[data-track="delete"]'}]},renderHTML({HTMLAttributes:e}){return["span",{...e,"data-track":"delete",class:"track-delete"},0]},addCommands(){return{setTrackDelete:e=>({commands:o})=>o.setMark(this.name,{author:(e==null?void 0:e.author)||"사용자",date:(e==null?void 0:e.date)||new Date().toISOString()}),unsetTrackDelete:()=>({commands:e})=>e.unsetMark(this.name)}}}),ru=_o.create({name:"trackFormat",inclusive:!1,addAttributes(){return{author:{default:null,parseHTML:e=>e.getAttribute("data-author"),renderHTML:e=>({"data-author":e.author})},date:{default:null,parseHTML:e=>e.getAttribute("data-date"),renderHTML:e=>({"data-date":e.date})},description:{default:null,parseHTML:e=>e.getAttribute("data-description"),renderHTML:e=>({"data-description":e.description})}}},parseHTML(){return[{tag:'span[data-track="format"]'}]},renderHTML({HTMLAttributes:e}){return["span",{...e,"data-track":"format",class:"track-format"},0]},addCommands(){return{setTrackFormat:e=>({commands:o})=>o.setMark(this.name,{author:(e==null?void 0:e.author)||"사용자",date:(e==null?void 0:e.date)||new Date().toISOString(),description:(e==null?void 0:e.description)||""}),unsetTrackFormat:()=>({commands:e})=>e.unsetMark(this.name)}}}),nu=new Sr("trackChanges");function Sn(e){const o=[];return e.descendants((r,i)=>{if(!r.isText)return;r.marks.some(a=>a.type.name==="trackInsert"||a.type.name==="trackDelete"||a.type.name==="trackFormat")&&o.push({from:i,to:i+r.nodeSize})}),o}const iu=ue.create({name:"trackChangesManager",addStorage(){return{enabled:!1,author:"사용자"}},addProseMirrorPlugins(){const e=this;return[new jr({key:nu,appendTransaction(o,r,i){if(!e.storage.enabled)return null;const n=e.storage.author,a=new Date().toISOString();if(!o.some(p=>p.docChanged&&!p.getMeta("trackChangesApplied")))return null;const l=i.tr;let d=!1;const m=i.schema.marks.trackInsert;return m?(o.forEach(p=>{p.docChanged&&p.steps.forEach(f=>{f.getMap().forEach((g,k,v,y)=>{if(y>v){const h=m.create({author:n,date:a});let x=!1;i.doc.nodesBetween(v,y,w=>{w.isText&&!w.marks.some(b=>b.type.name==="trackInsert")&&(x=!0)}),x&&(l.addMark(v,y,h),d=!0)}})})}),d?(l.setMeta("trackChangesApplied",!0),l):null):null}})]},addCommands(){return{toggleTrackChanges:()=>({editor:e})=>(e.storage.trackChangesManager.enabled=!e.storage.trackChangesManager.enabled,!0),isTrackChangesEnabled:()=>({editor:e})=>e.storage.trackChangesManager.enabled,setTrackAuthor:e=>({editor:o})=>(o.storage.trackChangesManager.author=e,!0),acceptChange:()=>({tr:e,state:o,dispatch:r})=>{const{from:i,to:n}=o.selection;let a=!1;return o.doc.nodesBetween(i,n,(s,l)=>{if(!s.isText)return;const d=s.marks,m=d.find(c=>c.type.name==="trackInsert");m&&(e.removeMark(l,l+s.nodeSize,m.type),a=!0),d.find(c=>c.type.name==="trackDelete")&&(e.delete(l,l+s.nodeSize),a=!0);const f=d.find(c=>c.type.name==="trackFormat");f&&(e.removeMark(l,l+s.nodeSize,f.type),a=!0)}),a&&r&&r(e),a},goToNextChange:()=>({state:e,commands:o})=>{const r=Sn(e.doc);if(!r.length)return!1;const{to:i}=e.selection,n=r.find(a=>a.from>i)||r[0];return o.setTextSelection({from:n.from,to:n.to})&&o.scrollIntoView()},goToPreviousChange:()=>({state:e,commands:o})=>{const r=Sn(e.doc);if(!r.length)return!1;const{from:i}=e.selection,n=[...r].reverse().find(a=>a.to<i)||r[r.length-1];return o.setTextSelection({from:n.from,to:n.to})&&o.scrollIntoView()},rejectChange:()=>({tr:e,state:o,dispatch:r})=>{const{from:i,to:n}=o.selection;let a=!1;return o.doc.nodesBetween(i,n,(s,l)=>{if(!s.isText)return;const d=s.marks;d.find(c=>c.type.name==="trackInsert")&&(e.delete(l,l+s.nodeSize),a=!0);const p=d.find(c=>c.type.name==="trackDelete");p&&(e.removeMark(l,l+s.nodeSize,p.type),a=!0);const f=d.find(c=>c.type.name==="trackFormat");f&&(e.removeMark(l,l+s.nodeSize,f.type),a=!0)}),a&&r&&r(e),a},acceptAllChanges:()=>({tr:e,state:o,dispatch:r})=>{let i=!1;const n=o.doc,a=[],s=[];n.descendants((l,d)=>{if(!l.isText)return;const m=l.marks,p=m.find(g=>g.type.name==="trackInsert");p&&s.push({from:d,to:d+l.nodeSize,type:p.type}),m.find(g=>g.type.name==="trackDelete")&&a.push({from:d,to:d+l.nodeSize});const c=m.find(g=>g.type.name==="trackFormat");c&&s.push({from:d,to:d+l.nodeSize,type:c.type})}),a.sort((l,d)=>d.from-l.from);for(const l of a)e.delete(l.from,l.to),i=!0;for(const l of s)e.removeMark(l.from,l.to,l.type),i=!0;return i&&r&&r(e),i},rejectAllChanges:()=>({tr:e,state:o,dispatch:r})=>{let i=!1;const n=o.doc,a=[],s=[];n.descendants((l,d)=>{if(!l.isText)return;const m=l.marks;m.find(g=>g.type.name==="trackInsert")&&a.push({from:d,to:d+l.nodeSize});const f=m.find(g=>g.type.name==="trackDelete");f&&s.push({from:d,to:d+l.nodeSize,type:f.type});const c=m.find(g=>g.type.name==="trackFormat");c&&s.push({from:d,to:d+l.nodeSize,type:c.type})}),a.sort((l,d)=>d.from-l.from);for(const l of a)e.delete(l.from,l.to),i=!0;for(const l of s)e.removeMark(l.from,l.to,l.type),i=!0;return i&&r&&r(e),i}}}}),au=qe.create({name:"pageNumberField",group:"inline",inline:!0,atom:!0,addAttributes(){return{fieldType:{default:"page",parseHTML:e=>e.getAttribute("data-field-type")||"page",renderHTML:e=>({"data-field-type":e.fieldType})},format:{default:"decimal",parseHTML:e=>e.getAttribute("data-format")||"decimal",renderHTML:e=>({"data-format":e.format})}}},parseHTML(){return[{tag:"span.page-number-field"}]},renderHTML({HTMLAttributes:e}){const r=(e["data-field-type"]||"page")==="page"?"#":"##";return["span",{...e,class:"page-number-field",contenteditable:"false",style:"background:#e8f0fe;padding:1px 4px;border-radius:2px;font-size:inherit;color:#444;cursor:default;"},r]},addCommands(){return{insertPageNumber:(e="decimal")=>({commands:o})=>o.insertContent({type:this.name,attrs:{fieldType:"page",format:e}}),insertTotalPages:(e="decimal")=>({commands:o})=>o.insertContent({type:this.name,attrs:{fieldType:"totalPages",format:e}})}}}),su=qe.create({name:"dateField",group:"inline",inline:!0,atom:!0,addAttributes(){return{format:{default:"korean",parseHTML:e=>e.getAttribute("data-date-format")||"korean",renderHTML:e=>({"data-date-format":e.format})}}},parseHTML(){return[{tag:"span.date-field"}]},renderHTML({HTMLAttributes:e}){const o=new Date,r=e["data-date-format"]||"korean";let i;switch(r){case"iso":i=o.toISOString().split("T")[0];break;case"us":i=`${o.getMonth()+1}/${o.getDate()}/${o.getFullYear()}`;break;default:i=`${o.getFullYear()}년 ${o.getMonth()+1}월 ${o.getDate()}일`}return["span",{...e,class:"date-field",contenteditable:"false",style:"background:#e8f0fe;padding:1px 4px;border-radius:2px;font-size:inherit;color:#444;cursor:default;"},i]},addCommands(){return{insertDateField:(e="korean")=>({commands:o})=>o.insertContent({type:this.name,attrs:{format:e}})}}}),lu=ue.create({name:"nonBreakingSpace",addCommands(){return{insertNonBreakingSpace:()=>({commands:e})=>e.insertContent(" ")}},addKeyboardShortcuts(){return{"Mod-Shift-Space":()=>this.editor.commands.insertNonBreakingSpace()}}}),du=ue.create({name:"lineNumbers",addStorage(){return{enabled:!1,startAt:1,countBy:1,restartEachPage:!0}},addCommands(){return{toggleLineNumbers:()=>({editor:e})=>(e.storage.lineNumbers.enabled=!e.storage.lineNumbers.enabled,!0),setLineNumberOptions:e=>({editor:o})=>(Object.assign(o.storage.lineNumbers,e),!0)}}}),xo="none",Li=["none","left","center","right","full"],Di=60,cu=1200;function qt(e){if(e==null)return null;const o=Number(e);return!Number.isFinite(o)||o<=0?null:Math.max(Di,Math.min(cu,Math.round(o)))}function cr(e){return Li.includes(e)?e:xo}function Cn(e){return Object.entries(e).filter(([,o])=>o!==""&&o!=null).map(([o,r])=>`${o}:${r}`).join(";")}function _i(e){const o=cr(e.align),r=qt(e.width),i=Number(e.rotation)||0,n=!!e.rounded,a=!!e.bordered,s=["yj-image",`yj-image-${o}`];n&&s.push("yj-image-rounded"),a&&s.push("yj-image-bordered");const l={};r&&(l.width=`${r}px`),o==="center"&&(l["text-align"]="center");const d={};return r&&(d.width="100%"),i&&(d.transform=`rotate(${i}deg)`),{align:o,width:r,rotation:i,rounded:n,bordered:a,figureClass:s.join(" "),figureStyle:Cn(l),imgStyle:Cn(d)}}const uu=qe.create({name:"image",group:"block",atom:!0,draggable:!0,selectable:!0,isolating:!0,addOptions(){return{allowBase64:!0,uploadEndpoint:"/api/media/upload"}},addAttributes(){const e=o=>{var r;return(o==null?void 0:o.tagName)==="IMG"?o:(r=o==null?void 0:o.querySelector)==null?void 0:r.call(o,"img")};return{src:{default:null,parseHTML:o=>{var r;return((r=e(o))==null?void 0:r.getAttribute("src"))||null}},alt:{default:null,parseHTML:o=>{var r;return((r=e(o))==null?void 0:r.getAttribute("alt"))||null}},title:{default:null,parseHTML:o=>{var r;return((r=e(o))==null?void 0:r.getAttribute("title"))||null}},width:{default:null,parseHTML:o=>{var a,s;const r=e(o)||o,i=r.getAttribute("width")||((a=r.style)==null?void 0:a.width)||((s=o.style)==null?void 0:s.width);if(!i)return null;const n=parseInt(String(i).replace(/[^0-9]/g,""),10);return Number.isFinite(n)?n:null},renderHTML:o=>{const r=qt(o.width);return r?{width:r}:{}}},align:{default:xo,parseHTML:o=>{var n;const r=(n=o.getAttribute)==null?void 0:n.call(o,"data-align");if(r)return r;const i=o.className||"";for(const a of Li)if(i.split(/\s+/).includes(`yj-image-${a}`))return a;return xo},renderHTML:o=>({"data-align":cr(o.align)})},caption:{default:"",parseHTML:o=>{var i;const r=(i=o.querySelector)==null?void 0:i.call(o,"figcaption");return r?(r.textContent||"").trim():""}},rotation:{default:0,rendered:!1},rounded:{default:!1,parseHTML:o=>(o.className||"").split(/\s+/).includes("yj-image-rounded"),rendered:!1},bordered:{default:!1,parseHTML:o=>(o.className||"").split(/\s+/).includes("yj-image-bordered"),rendered:!1}}},parseHTML(){return[{tag:"figure[data-yj-image]"},{tag:"figure.yj-image"},{tag:"img[src]",getAttrs:e=>{var o;return!this.options.allowBase64&&((o=e.getAttribute("src"))!=null&&o.startsWith("data:"))?!1:{src:e.getAttribute("src"),alt:e.getAttribute("alt"),title:e.getAttribute("title")}}}]},renderHTML({HTMLAttributes:e,node:o}){const r=o.attrs,i=_i(r),n=(r.caption||"").trim().length>0,a=n||i.align!==xo||i.width!=null||i.rotation!==0||i.rounded||i.bordered,s=Cr({src:e.src,alt:e.alt,title:e.title,loading:"lazy"},i.width?{width:i.width}:{},i.imgStyle?{style:i.imgStyle}:{});if(!a)return["img",s];const l={class:i.figureClass,"data-yj-image":"1","data-align":i.align};i.figureStyle&&(l.style=i.figureStyle);const d=[["img",s]];return n&&d.push(["figcaption",{},r.caption]),["figure",l,...d]},addCommands(){return{setImage:e=>({commands:o})=>o.insertContent({type:this.name,attrs:e}),updateImage:e=>({commands:o})=>o.updateAttributes(this.name,e),setImageAlign:e=>({commands:o})=>o.updateAttributes(this.name,{align:cr(e)}),setImageWidth:e=>({commands:o})=>o.updateAttributes(this.name,{width:qt(e)}),setImageCaption:e=>({commands:o})=>o.updateAttributes(this.name,{caption:String(e||"")}),rotateImage:(e=90)=>({commands:o,state:r})=>{var s;const i=nr(r),a=(((Number((s=i==null?void 0:i.attrs)==null?void 0:s.rotation)||0)+e)%360+360)%360;return o.updateAttributes(this.name,{rotation:a})},toggleImageRounded:()=>({commands:e,state:o})=>{var i;const r=nr(o);return e.updateAttributes(this.name,{rounded:!((i=r==null?void 0:r.attrs)!=null&&i.rounded)})},toggleImageBordered:()=>({commands:e,state:o})=>{var i;const r=nr(o);return e.updateAttributes(this.name,{bordered:!((i=r==null?void 0:r.attrs)!=null&&i.bordered)})}}},addNodeView(){return({node:e,editor:o,getPos:r})=>pu({node:e,editor:o,getPos:r})}});function nr(e){var r,i;const{selection:o}=e;return((i=(r=o==null?void 0:o.node)==null?void 0:r.type)==null?void 0:i.name)==="image"?o.node:null}function pu({node:e,editor:o,getPos:r}){const i=document.createElement("figure"),n=document.createElement("img"),a=document.createElement("figcaption"),s=fu();let l=e;function d(p){const f=_i(p.attrs);i.className=`${f.figureClass} yj-image-nodeview`,i.setAttribute("data-yj-image","1"),i.setAttribute("data-align",f.align),i.style.cssText=f.figureStyle,n.getAttribute("src")!==(p.attrs.src||"")&&(n.src=p.attrs.src||""),n.alt=p.attrs.alt||"",p.attrs.title?n.title=p.attrs.title:n.removeAttribute("title"),n.style.cssText=f.imgStyle,n.draggable=!1,f.width?n.setAttribute("width",String(f.width)):n.removeAttribute("width");const c=document.activeElement===a,g=(p.attrs.caption||"").trim();c||(g||o.isEditable?(a.style.display=g||i.classList.contains("is-selected")?"block":"none",a.textContent=g,a.dataset.placeholder="캡션을 입력하세요…"):a.style.display="none")}i.appendChild(n),i.appendChild(a);for(const p of s.elements)i.appendChild(p);i.contentEditable="false",a.contentEditable=o.isEditable?"true":"false",a.spellcheck=!1,a.addEventListener("focus",()=>i.classList.add("is-caption-editing")),a.addEventListener("blur",()=>{i.classList.remove("is-caption-editing");const p=(a.textContent||"").trim();if(p!==(l.attrs.caption||"").trim()){const f=typeof r=="function"?r():null;if(f!=null){const c=o.state.tr.setNodeMarkup(f,void 0,{...l.attrs,caption:p});o.view.dispatch(c)}}});const m=p=>{var c,g,k;if(p.target===a||a.contains(p.target)||(k=(g=(c=p.target)==null?void 0:c.classList)==null?void 0:g.contains)!=null&&k.call(g,"yj-image-handle"))return;p.preventDefault(),p.stopPropagation();const f=typeof r=="function"?r():null;f!=null&&(o.view.focus(),o.commands.setNodeSelection(f))};return i.addEventListener("mousedown",m),gu(s,{figure:i,img:n,onCommit:p=>{const f=typeof r=="function"?r():null;f!=null&&o.chain().focus().command(({tr:c})=>(c.setNodeMarkup(f,void 0,{...l.attrs,width:qt(p)}),!0)).run()}}),d(e),{dom:i,update(p){return p.type.name!==e.type.name?!1:(l=p,d(p),!0)},selectNode(){i.classList.add("is-selected"),d(l)},deselectNode(){i.classList.remove("is-selected"),d(l)},ignoreMutation(p){return!!(i.contains(p.target)&&p.target!==a||p.type==="attributes"&&p.target===a)},stopEvent(p){var f,c;return!!(p.target===a||a.contains(p.target)||(c=(f=p.target)==null?void 0:f.classList)!=null&&c.contains("yj-image-handle"))},destroy(){s.destroy()}}}function fu(){const o=["nw","ne","sw","se"].map(r=>{const i=document.createElement("span");return i.className=`yj-image-handle yj-image-handle-${r}`,i.dataset.position=r,i});return{elements:o,destroy(){for(const r of o)r.remove()}}}function gu(e,{figure:o,img:r,onCommit:i}){for(const a of e.elements)a.addEventListener("mousedown",n);function n(a){a.preventDefault(),a.stopPropagation();const s=a.clientX,l=r.getBoundingClientRect().width||r.naturalWidth||400,d=r.naturalHeight/Math.max(r.naturalWidth||1,1),m=a.currentTarget.dataset.position.includes("e")?1:-1;o.classList.add("is-resizing");let p=l;function f(g){const k=(g.clientX-s)*m;p=qt(l+k)||Di,o.style.width=`${p}px`,r.style.width="100%",r.style.height=d?`${p*d}px`:"auto"}function c(){document.removeEventListener("mousemove",f),document.removeEventListener("mouseup",c),o.classList.remove("is-resizing"),r.style.height="",i(p)}document.addEventListener("mousemove",f),document.addEventListener("mouseup",c)}}const mu=_o.create({name:"comment",excludes:"",inclusive:!1,addAttributes(){return{commentId:{default:null,parseHTML:e=>e.getAttribute("data-comment-id"),renderHTML:e=>e.commentId?{"data-comment-id":e.commentId}:{}}}},parseHTML(){return[{tag:"span[data-comment-id]"}]},renderHTML({HTMLAttributes:e}){return["span",Cr(e,{class:"comment-highlight"}),0]},addCommands(){return{setComment:e=>({commands:o,state:r})=>{const{from:i,to:n}=r.selection;return i===n?!1:o.setMark(this.name,{commentId:e})},unsetComment:e=>({tr:o,state:r,dispatch:i})=>{if(!i)return!0;const{doc:n}=r;return n.descendants((a,s)=>{if(!a.isText)return;a.marks.filter(d=>d.type.name==="comment"&&d.attrs.commentId===e).forEach(d=>{o.removeMark(s,s+a.nodeSize,d)})}),i(o),!0},unsetAllComments:()=>({tr:e,state:o,dispatch:r})=>{if(!r)return!0;const{doc:i}=o,n=o.schema.marks.comment;return n?(e.removeMark(0,i.content.size,n),r(e),!0):!1}}},addKeyboardShortcuts(){return{"Mod-Alt-m":()=>{const e=new CustomEvent("comment:insert");return window.dispatchEvent(e),!0}}}});function hu({onAutoSave:e}){return qa({extensions:[as.configure({heading:{levels:[1,2,3,4]},link:!1,underline:!1}),Ka,ss.configure({types:["heading","paragraph"]}),ls.configure({multicolor:!0}),Xa,Ya,Ja,Za,ds.configure({openOnClick:!1}),uu.configure({allowBase64:!0}),cs.configure({resizable:!0}),Qa,es,ts,us.configure({placeholder:"본문을 입력하세요..."}),os,rs,ns,ps.configure({nested:!0}),is,Oc,Bc,Hc,$c,Yc,Zc,Qc,Uc,Wc,Gc,Vc,qc,Kc,Xc,eu,Nl,mu,tu,ou,ru,iu,au,su,lu,du,_c],editable:!0,editorProps:{handleScrollToSelection:()=>!0},onUpdate:()=>e==null?void 0:e()})}const bu=20*1024*1024;function xu(e,o){return(o==null?void 0:o.alt)||(o==null?void 0:o.originalName)||(e==null?void 0:e.name)||"image"}function Tn(e,o,r){if(!e||e.isDestroyed)return!1;const{state:i}=e;let n=-1;if(i.doc.descendants((l,d)=>n>=0?!1:l.type.name==="image"&&l.attrs.src===o?(n=d,!1):!0),n<0)return!1;const a=i.doc.nodeAt(n);if(!a)return!1;const s=i.tr.setNodeMarkup(n,void 0,{...a.attrs,...r});return e.view.dispatch(s),!0}async function Mn(e,o,r){var a;if(!o||!((a=o.type)!=null&&a.startsWith("image/")))return;if(o.size>bu){de(`이미지가 너무 큽니다 (${(o.size/1024/1024).toFixed(1)}MB). 최대 20MB까지 업로드 가능합니다.`);return}const i=URL.createObjectURL(o),n=o.name||"image";e.chain().focus().setImage({src:i,alt:n}).run();try{const l=(await fe.upload("/media/upload",o)).data;if(!(l!=null&&l.url))throw new Error("no media url");const d=Tn(e,i,{src:l.url,alt:xu(o,l)});URL.revokeObjectURL(i),d&&(r==null||r(m=>m.thumbnailUrl?m:{...m,thumbnailUrl:l.url,ogImageUrl:m.ogImageUrl||l.url}))}catch(s){try{const l=await new Promise((d,m)=>{const p=new FileReader;p.onload=()=>d(p.result),p.onerror=m,p.readAsDataURL(o)});Tn(e,i,{src:l,alt:n}),URL.revokeObjectURL(i)}catch{URL.revokeObjectURL(i)}de(`이미지 업로드 실패: ${(s==null?void 0:s.message)||"네트워크 오류"} — 임시로 본문에 보존했습니다.`)}}function yu(e){let o=e.querySelector(":scope > .yj-image-drop-overlay");return o||(o=document.createElement("div"),o.className="yj-image-drop-overlay",o.setAttribute("aria-hidden","true"),o.innerHTML='<div class="yj-image-drop-overlay-inner">📷 사진을 여기에 놓으세요</div>',e.appendChild(o)),o}function ir(e){var r;const o=(r=e==null?void 0:e.querySelector)==null?void 0:r.call(e,":scope > .yj-image-drop-overlay");o&&o.remove()}function vu({editor:e,viewMode:o,docId:r,setDoc:i,setSaveStatus:n,refreshList:a,setZoom:s,setIsFullscreen:l,setRibbonCollapsed:d,hydrateFootnotes:m,hydrateDrawings:p,hydrateHeaderFooter:f}){u.useEffect(()=>{e&&e.setEditable(o==="edit")},[o,e]),u.useEffect(()=>{if(!e||e.isDestroyed)return;let c=null,g=0;const k=b=>{var I;return Array.from(((I=b.dataTransfer)==null?void 0:I.types)||[]).includes("Files")},v=b=>{k(b)&&(g+=1,c==null||c.classList.add("drag-over"),yu(c))},y=b=>{k(b)&&(b.preventDefault(),b.dataTransfer&&(b.dataTransfer.dropEffect="copy"),c==null||c.classList.add("drag-over"))},h=b=>{k(b)&&(g=Math.max(0,g-1),g===0&&(c==null||c.classList.remove("drag-over"),ir(c)))},x=b=>{var L,C,S;if(g=0,!k(b))return;b.preventDefault(),c==null||c.classList.remove("drag-over"),ir(c);const I=Array.from(((L=b.dataTransfer)==null?void 0:L.files)||[]),P=I.filter(R=>R.type.startsWith("image/"));if(!P.length){I.length&&de("이미지 파일만 본문에 삽입할 수 있습니다.");return}const A=(S=(C=e.view)==null?void 0:C.posAtCoords)==null?void 0:S.call(C,{left:b.clientX,top:b.clientY});(A==null?void 0:A.pos)!=null&&e.chain().focus().setTextSelection(A.pos).run(),(async()=>{for(const R of P)await Mn(e,R,i)})()},w=setTimeout(()=>{var b;try{c=(b=e.view)==null?void 0:b.dom}catch{return}c&&(c.addEventListener("dragenter",v),c.addEventListener("dragover",y),c.addEventListener("dragleave",h),c.addEventListener("drop",x))},0);return()=>{clearTimeout(w),c&&(c.removeEventListener("dragenter",v),c.removeEventListener("dragover",y),c.removeEventListener("dragleave",h),c.removeEventListener("drop",x),ir(c))}},[e,i]),u.useEffect(()=>{if(!e||e.isDestroyed)return;let c=null;const g=v=>{const y=v.clipboardData;if(!y)return;const h=Array.from(y.files||[]).filter(P=>P.type.startsWith("image/"));if(h.length>0){v.preventDefault(),h.forEach(P=>Mn(e,P,i));return}const x=y.getData("text/html"),w=y.getData("text/plain");if(!x&&!w)return;v.preventDefault();const I=(x?li(x):"")||si(w);I&&e.chain().focus().insertContent(I).run()},k=setTimeout(()=>{var v;try{c=(v=e.view)==null?void 0:v.dom}catch{return}c&&c.addEventListener("paste",g,!0)},0);return()=>{clearTimeout(k),c&&c.removeEventListener("paste",g,!0)}},[e,i]),u.useEffect(()=>{a()},[a]),u.useEffect(()=>{const c=g=>{var v;const k=(v=g.detail)==null?void 0:v.thumbnailUrl;k&&(i(y=>({...y,thumbnailUrl:k,ogImageUrl:y.ogImageUrl||k})),n("수정됨"))};return window.addEventListener("editor:thumbnail-url-change",c),()=>window.removeEventListener("editor:thumbnail-url-change",c)},[i,n]),u.useEffect(()=>{if(!e||r)return;const c=Cc();c&&c.html&&(e.commands.setContent(c.html),c.doc&&typeof c.doc=="object"?i(g=>({...g,...c.doc})):c.title&&i(g=>({...g,title:c.title})),c.footnotes&&(m==null||m(c.footnotes),p==null||p(c.footnotes.drawings||[]),f==null||f(c.footnotes)),n("복원됨"))},[e,r,i,n,m,p,f]),u.useEffect(()=>{const c=k=>{k.ctrlKey&&(k.preventDefault(),s(v=>{const y=k.deltaY>0?-Co:Co;return Math.max(jo,Math.min(So,v+y))}))},g=document.querySelector(".editor-canvas-scroll");return g&&g.addEventListener("wheel",c,{passive:!1}),()=>{g&&g.removeEventListener("wheel",c)}},[s]),u.useEffect(()=>{const c=()=>{const g=!!document.fullscreenElement;l(g),g&&d(!0)};return document.addEventListener("fullscreenchange",c),()=>document.removeEventListener("fullscreenchange",c)},[l,d])}function ku({margins:e,setMargins:o,orientation:r,setOrientation:i,pageSize:n,setPageSize:a,customMargins:s,setCustomMargins:l,headerFooterSettings:d,setHeaderFooterSettings:m,pageBorder:p,setPageBorder:f,watermarkText:c,setWatermarkText:g,pageColor:k,setPageColor:v,columns:y,setColumns:h,pageW:x,pageH:w,marginTop:b,marginBottom:I,marginLeft:P,marginRight:A,contentAreaHeight:L,gapH:C,PAGE_GAP:S,handleFootnoteDialogInsert:R,footnoteNumberFormat:j,setFootnoteNumberFormat:M,endnoteNumberFormat:N,setEndnoteNumberFormat:E,handleInsertFootnote:O,handleInsertEndnote:_,footnotes:T,setFootnotes:D,endnotes:F,setEndnotes:W,setFootnoteAreaHeight:z,drawings:U,handleInsertComment:K,handleDeleteActiveComment:$,handleDeleteAllComments:V,handleNextComment:G,handlePrevComment:B,commentStore:q,commentDispatch:Y,commentAuthor:ie,trackChangesEnabled:H,handleToggleTrackChanges:ne,showRuler:J,setShowRuler:ee,viewMode:be,setViewMode:Ee,zoom:xe,setZoom:ye,showNavPane:pe,setShowNavPane:ve,handleNew:ge,darkMode:tt,setDarkMode:ot,handleFitPageWidth:ke,handleToggleFullscreen:Ke,isFullscreen:De}){const ze=u.useMemo(()=>({margins:e,setMargins:o,orientation:r,setOrientation:i,pageSize:n,setPageSize:a,customMargins:s,setCustomMargins:l,headerFooterSettings:d,setHeaderFooterSettings:m}),[e,o,r,i,n,a,s,l,d,m]),Ie=u.useMemo(()=>({pageBorder:p,setPageBorder:f,watermarkText:c,setWatermarkText:g}),[p,f,c,g]),ae=u.useMemo(()=>({handleFootnoteDialogInsert:R,footnoteNumberFormat:j,setFootnoteNumberFormat:M,endnoteNumberFormat:N,setEndnoteNumberFormat:E}),[R,j,M,N,E]),St=u.useMemo(()=>({pageW:x,pageH:w,marginTop:b,marginBottom:I,marginLeft:P,marginRight:A,footnotes:T,footnoteNumberFormat:j,endnotes:F,endnoteNumberFormat:N,drawings:U}),[x,w,b,I,P,A,T,j,F,N,U]),rt=u.useMemo(()=>({pageColor:k,setPageColor:v,watermarkText:c,setWatermarkText:g}),[k,v,c,g]),me=u.useMemo(()=>({margins:e,setMargins:o,orientation:r,setOrientation:i,pageSize:n,setPageSize:a,columns:y,setColumns:h}),[e,o,r,i,n,a,y,h]),we=u.useMemo(()=>({onInsertFootnote:O,onInsertEndnote:_}),[O,_]),Ct=u.useMemo(()=>({onInsertComment:K,onDeleteComment:$,onDeleteAllComments:V,onPrevComment:B,onNextComment:G,commentStore:q,commentDispatch:Y,trackChangesEnabled:H,onToggleTrackChanges:ne}),[K,$,V,B,G,q,Y,H,ne]),oe=u.useMemo(()=>({showRuler:J,setShowRuler:ee,viewMode:be,setViewMode:Ee,zoom:xe,setZoom:ye,showNavPane:pe,setShowNavPane:ve,onNew:ge,darkMode:tt,setDarkMode:ot,onFitPageWidth:ke,onToggleFullscreen:Ke,isFullscreen:De}),[J,ee,be,Ee,xe,ye,pe,ve,ge,tt,ot,ke,Ke,De]),Tt=u.useMemo(()=>({pageW:x,pageH:w,marginTop:b,marginBottom:I,marginLeft:P,marginRight:A,contentAreaHeight:L,gapH:C,PAGE_GAP:S}),[x,w,b,I,P,A,L,C,S]),nt=u.useMemo(()=>({commentStore:q,commentDispatch:Y,commentAuthor:ie}),[q,Y,ie]),Mt=u.useMemo(()=>({footnotes:T,setFootnotes:D,endnotes:F,setEndnotes:W,setFootnoteAreaHeight:z,footnoteNumberFormat:j,endnoteNumberFormat:N}),[T,D,F,W,z,j,N]);return{dialogLayoutProps:ze,dialogPageProps:Ie,dialogFootnoteProps:ae,dialogPrintPreviewProps:St,ribbonDesignProps:rt,ribbonLayoutProps:me,ribbonReferencesProps:we,ribbonReviewProps:Ct,ribbonViewProps:oe,canvasPageLayout:Tt,canvasCommentProps:nt,canvasFootnoteProps:Mt}}function wu(){var Nr,Fr;const{id:e}=qi(),[o]=Ki(),r=u.useRef(null),i=u.useRef(null),n=u.useRef(null),a=u.useRef(null),s=u.useRef(!1),[l,d]=u.useState("edit"),[m,p]=u.useState(!1),[f,c]=u.useState(!1),[g,k]=u.useState(""),[v,y]=u.useState("home"),[h,x]=u.useState(100),[w,b]=u.useState(!0),[I,P]=u.useState(!1),[A,L]=u.useState(null),[C,S]=u.useState(!1),[R,j]=u.useState(!1),[M,N]=u.useState(!1),[E,O]=u.useState(!1),[_]=u.useState(!0),[T,D]=u.useState(""),[F,W]=u.useState(""),[z,U]=u.useState(1),[K,$]=u.useState(!1),[V,G]=u.useState(null),B=hu({onAutoSave:()=>{var te;return(te=n.current)==null?void 0:te.call(n)}}),q=Pc(B),Y=ac(),ie=u.useCallback(({headerText:te="",footerText:ut=""}={})=>{D(te),W(ut)},[]),H=u.useCallback(()=>{D(""),W("")},[]),{footnotes:ne,setFootnotes:J,endnotes:ee,setEndnotes:be,setFootnoteAreaHeight:Ee,footnoteNumberFormat:xe,setFootnoteNumberFormat:ye,endnoteNumberFormat:pe,setEndnoteNumberFormat:ve,handleInsertFootnote:ge,handleInsertEndnote:tt,handleFootnoteDialogInsert:ot}=q,ke=Tc(B,{footnotes:ne,endnotes:ee,footnoteNumberFormat:xe,endnoteNumberFormat:pe,drawings:Y.strokes,hydrateFootnotes:q.hydrateFootnotes,resetFootnotes:q.resetFootnotes,hydrateDrawings:Y.hydrateDrawings,resetDrawings:Y.resetDrawings,headerText:T,footerText:F,hydrateHeaderFooter:ie,resetHeaderFooter:H}),{doc:Ke,setDoc:De,docId:ze,documents:Ie,loading:ae,saveStatus:St,setSaveStatus:rt,loadDocument:me,handleSave:we,refreshList:Ct,scheduleAutoSave:oe,handlePublishBlog:Tt,handleDeleteDocument:nt,isPublishing:Mt}=ke;n.current=oe,u.useEffect(()=>{s.current=!1;const te=setTimeout(()=>{s.current=!0},500);return()=>clearTimeout(te)},[ze,B]),u.useEffect(()=>{var te;!B||B.isDestroyed||!s.current||(te=n.current)==null||te.call(n)},[B,ne,ee,xe,pe,Y.strokes,T,F]);const _e=Mc(B,ze),{commentStore:it,commentDispatch:Qt,commentAuthor:Et,showAuthorDialog:Re,handleInsertComment:zt,handleAuthorSave:eo,handleAuthorCancel:Fo,handleDeleteActiveComment:at,handleDeleteAllComments:st,handleNextComment:to,handlePrevComment:It,deleteAllComments:le}=_e,Oo=Ec(),{margins:Pt,setMargins:Bo,customMargins:lt,setCustomMargins:Ho,orientation:Ne,setOrientation:$o,pageSize:At,setPageSize:Uo,columns:Lt,setColumns:Wo,pageColor:Dt,setPageColor:Go,watermarkText:oo,setWatermarkText:ro,pageBorder:no,setPageBorder:io,headerFooterSettings:Vo,setHeaderFooterSettings:qo,pageW:Fe,pageH:Ko,marginTop:ao,marginBottom:_t,marginLeft:dt,marginRight:ct,contentAreaHeight:re,gapH:je,PAGE_GAP:Rt}=Oo,{handleExportDocx:Ri,handleExportPdf:Ni,handleExportHtml:Fi,handleExportMarkdown:Oi,handleExportHwpx:Bi,handleImportDocx:Hi}=Ac({editor:B,doc:Ke,setDoc:De,setSaveStatus:rt,editorCanvasRef:i,layoutOptions:{orientation:Ne,pageSize:At},footnoteState:{footnotes:ne,footnoteNumberFormat:xe,endnotes:ee,endnoteNumberFormat:pe},drawingState:Y});vu({editor:B,viewMode:l,docId:ze,setDoc:De,setSaveStatus:rt,refreshList:Ct,setZoom:x,setIsFullscreen:O,setRibbonCollapsed:j,hydrateFootnotes:q.hydrateFootnotes,hydrateDrawings:Y.hydrateDrawings,hydrateHeaderFooter:ie});const _r=u.useCallback(()=>{var te,ut,so;document.fullscreenElement?((so=document.exitFullscreen)==null||so.call(document),O(!1)):((ut=(te=document.documentElement).requestFullscreen)==null||ut.call(te),O(!0))},[]);zc(B,{onSave:()=>we(!1),onFind:()=>L("find"),onReplace:()=>L("replace"),onHyperlink:()=>G("hyperlink"),onFont:()=>G("font"),onPrint:()=>G("printpreview"),onComment:()=>zt(),onFullscreen:_r});const Rr=u.useCallback(()=>{var te;ke.handleNew(),q.resetFootnotes(),Y.resetDrawings(),le(),(te=r.current)==null||te.focus()},[ke,q,Y,le]),Xo=u.useCallback(()=>{var te;ke.handleNewBlog(),q.resetFootnotes(),Y.resetDrawings(),le(),(te=r.current)==null||te.focus()},[ke,q,Y,le]);u.useEffect(()=>{if(!B||B.isDestroyed)return;const te=e?`doc:${e}`:`mode:${o.get("mode")||""}`;if(a.current!==te){if(e){a.current=te,me(e);return}o.get("mode")==="blog"&&(a.current=te,Xo())}},[B,e,o,me,Xo]),Fc({editor:B,viewMode:l,darkMode:M,pageColor:Dt,pageW:Fe,contentAreaHeight:re,marginTop:ao,marginBottom:_t,marginLeft:dt,marginRight:ct,headerText:T,footerText:F,PAGE_GAP:Rt,editorCanvasRef:i,setDynamicPageCount:U});const $i=u.useCallback(()=>{const te=document.querySelector(".editor-canvas-scroll");if(!te)return;const ut=te.clientWidth-$l,so=Math.round(ut/Fe*100);x(Math.max(jo,Math.min(So,so)))},[Fe]),Ui=u.useCallback(()=>{$(te=>!te),B==null||B.commands.toggleTrackChanges()},[B]),Wi=((Nr=B==null?void 0:B.storage.characterCount)==null?void 0:Nr.characters())||0,Gi=((Fr=B==null?void 0:B.storage.characterCount)==null?void 0:Fr.words())||0,Vi=ku({margins:Pt,setMargins:Bo,orientation:Ne,setOrientation:$o,pageSize:At,setPageSize:Uo,customMargins:lt,setCustomMargins:Ho,headerFooterSettings:Vo,setHeaderFooterSettings:qo,pageBorder:no,setPageBorder:io,watermarkText:oo,setWatermarkText:ro,pageColor:Dt,setPageColor:Go,columns:Lt,setColumns:Wo,pageW:Fe,pageH:Ko,marginTop:ao,marginBottom:_t,marginLeft:dt,marginRight:ct,contentAreaHeight:re,gapH:je,PAGE_GAP:Rt,handleFootnoteDialogInsert:ot,footnoteNumberFormat:xe,setFootnoteNumberFormat:ye,endnoteNumberFormat:pe,setEndnoteNumberFormat:ve,handleInsertFootnote:ge,handleInsertEndnote:tt,footnotes:ne,setFootnotes:J,endnotes:ee,setEndnotes:be,setFootnoteAreaHeight:Ee,drawings:Y.strokes,handleInsertComment:zt,handleDeleteActiveComment:at,handleDeleteAllComments:st,handleNextComment:to,handlePrevComment:It,commentStore:it,commentDispatch:Qt,commentAuthor:Et,trackChangesEnabled:K,handleToggleTrackChanges:Ui,showRuler:w,setShowRuler:b,viewMode:l,setViewMode:d,zoom:h,setZoom:x,showNavPane:I,setShowNavPane:P,handleNew:Rr,darkMode:M,setDarkMode:N,handleFitPageWidth:$i,handleToggleFullscreen:_r,isFullscreen:E});return t.jsx(nc,{editor:B,titleRef:r,editorCanvasRef:i,doc:Ke,setDoc:De,docId:ze,documents:Ie,loading:ae,saveStatus:St,handleSave:we,loadDocument:me,handleNew:Rr,handleNewBlog:Xo,handleDeleteDocument:nt,handlePublishBlog:Tt,isPublishing:Mt,showAuthorDialog:Re,handleAuthorSave:eo,handleAuthorCancel:Fo,handleInsertComment:zt,commentStore:it,showBackstage:C,setShowBackstage:S,handleExportDocx:Ri,handleExportPdf:Ni,handleExportHtml:Fi,handleExportMarkdown:Oi,handleExportHwpx:Bi,handleImportDocx:Hi,dialogOpen:V,setDialogOpen:G,sidebarCollapsed:f,setSidebarCollapsed:c,sidebarSearch:g,setSidebarSearch:k,viewMode:l,setViewMode:d,zoom:h,setZoom:x,showRuler:w,showNavPane:I,setShowNavPane:P,darkMode:M,setDarkMode:N,activeTab:v,setActiveTab:y,ribbonCollapsed:R,setRibbonCollapsed:j,findBarMode:A,setFindBarMode:L,pageW:Fe,marginLeft:dt,marginRight:ct,headerText:T,setHeaderText:D,footerText:F,setFooterText:W,watermarkText:oo,pageColor:Dt,showHeaderFooter:_,dynamicPageCount:z,wordCount:Gi,charCount:Wi,metaOpen:m,setMetaOpen:p,memoProps:Vi,drawingState:Y})}const Du=Object.freeze(Object.defineProperty({__proto__:null,default:wu},Symbol.toStringTag,{value:"Module"}));export{ar as C,Bs as D,Du as E,Nt as G,bt as R,Pu as a,_d as b,Lu as c,jc as d,Le as e,Ro as f,Hs as g,X as h,Ar as l,Rd as p,Au as r,de as s,ui as u};
