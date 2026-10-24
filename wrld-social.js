/* Fleki's Wrld social client: Auth + TOTP 2FA + public chat + friendships + DMs + pins + blocks.
   Connect a separate Supabase project in wrld-config.js and apply supabase/wrld-social.sql.
   All privileged writes are enforced by Postgres RLS, not by these UI checks. */
const cRoot = document.getElementById('wrld-community-root');
const nRoot = document.getElementById('wrld-notifications-root');
const state = {db:null,user:null,profile:null,aal:'aal1',tab:'global',signup:false,peer:null,
  messages:[],friends:[],blocks:[],pins:new Set(),people:new Map(),notices:[],
  enrollment:null,authNote:'',draft:'',directory:[],directoryQuery:'',channel:null,mode:'login'};
const e = x => String(x ?? '').replace(/[&<>"']/g, a => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[a]));
const dt = str => {const d=new Date(str);return Number.isNaN(d.getTime())?'':d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});};
const name = id => {const p=state.people.get(id);return p?(p.display_name||p.username):'Member';};
const nick = id => {const p=state.people.get(id);return p?'@'+p.username:'Member';};
const initial = id => (name(id).trim()[0]||'?').toUpperCase();
const me = () => state.user?.id;
const ready = () => !!state.db;
const is2fa = () => state.aal === 'aal2';
const blocked = id => state.blocks.some(b=>b.blocked_id===id);
const friendWith = id => state.friends.find(f=>f.status==='accepted'&&(f.sender_id===id||f.receiver_id===id));
const btn = (label,act,cls='') => '<button type="button" class="social-mini '+cls+'" data-social="'+act+'">'+label+'</button>';
let feedbackTimer=null;
function feedback(msg,fail=false){
  for(const root of [cRoot,nRoot]){const el=root?.querySelector('.social-feedback');if(el){el.textContent=msg;el.classList.toggle('error',fail);}}
  clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{document.querySelectorAll('.social-feedback').forEach(el=>el.textContent='');},7500);
}
function errorOf(err){return err?.message||'Something went wrong. Please try again.';}
function ensure2fa(){if(is2fa())return true;state.tab='security';renderCommunity();feedback('Set up or verify your authenticator before messaging, pinning or adding friends.',true);return false;}
function profileChip(id){return '<span class="social-avatar" aria-hidden="true">'+e(initial(id))+'</span>';}
function featureCards(){return '<div class="social-feature-grid">'+[
 ['🌐 Global chat','A shared conversation space for everyone with an account.'],
 ['👥 Friends and DMs','Find members, send friend requests and message friends privately.'],
 ['🛡️ Mandatory 2FA','An authenticator code is required for every message and friend request.'],
 ['🔒 Safety controls','Block members, manage your personal pinned messages and get notifications.']
 ].map(x=>'<article class="social-feature"><h4>'+x[0]+'</h4><p>'+x[1]+'</p></article>').join('')+'</div>';}
function renderDisconnected(root,title){
 root.innerHTML='<div class="social-wrap"><div class="social-bar"><div class="social-id"><span class="social-avatar">✦</span><div><strong>'+title+'</strong><small>Account system prepared · Backend not connected</small></div></div><span class="social-status">Setup required</span></div><div class="social-card"><h3>A real community, not a fake demo.</h3><p>The interface and security rules are prepared. This site still needs its own Supabase project before registration, messaging and notifications can work for real. Existing XONI and AURVEX databases are not reused.</p><div class="social-message warn">No credentials, messages or accounts are stored on GitHub Pages. The dedicated backend must be connected first.</div><div style="height:16px"></div>'+featureCards()+'</div><div class="social-feedback" role="status"></div></div>';
}
function renderAuth(){
 cRoot.innerHTML='<div class="social-wrap"><div class="social-bar"><div class="social-id"><span class="social-avatar">✦</span><div><strong>Join Fleki’s Wrld</strong><small>One account for your community space</small></div></div><span class="social-status">2FA required to interact</span></div><div class="social-split"><section class="social-card"><div class="overline">YOUR ACCOUNT</div><h3>'+ (state.signup?'Create an account':'Welcome back')+'</h3><p>'+ (state.signup?'Sign up with an email and password. Confirm your email if asked, then turn on 2FA to start chatting.':'Sign in to see messages, friends and personal notifications.') +'</p><form id="wrld-auth-form" class="social-form"><label>Email<input class="social-input" name="email" type="email" required autocomplete="email"></label><label>Password<input class="social-input" name="password" type="password" minlength="8" required autocomplete="'+(state.signup?'new-password':'current-password')+'"></label><button class="btn primary" type="submit">'+(state.signup?'Create account':'Sign in')+' →</button></form><div style="height:14px"></div><button class="social-action" data-social="switch-auth">'+(state.signup?'Already have an account? Sign in':'New here? Create an account')+'</button><p class="social-help">'+e(state.authNote)+'</p><div class="social-feedback" role="status" aria-live="polite"></div></section><div class="social-card"><div class="overline">EVERYONE BELONGS</div><h3>Connect with more confidence.</h3><p>Read the community after signing in. To send messages, add friends or pin messages, verify a second factor using an authenticator app.</p>'+featureCards()+'</div></div></div>';
}
function renderTop(){
 return '<div class="social-bar"><div class="social-id">'+profileChip(me())+'<div><strong>'+e(state.profile?.display_name||'Traveler')+'</strong><small>'+e(state.profile?'@'+state.profile.username:'Signed in')+'</small></div></div><div class="social-controls"><span class="social-status">'+(is2fa()?'✓ 2FA verified':'⚠ 2FA required')+'</span>'+btn('Account','profile')+btn('Sign out','signout')+'</div></div>';
}
function renderTabs(){const tabs=[['global','Global chat'],['friends','Friends & DMs'],['profile','My profile'],['security','2FA security']];
 return '<div class="social-tabs" role="tablist" aria-label="Community"><!---->'+tabs.map(t=>'<button class="social-tab '+(state.tab===t[0]?'active':'')+'" role="tab" aria-selected="'+(state.tab===t[0])+'" data-social="tab:'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
}
function messageView(){
 let peer=state.peer, title=peer?'Chat with '+e(name(peer)):'Global chat';
 let list=state.messages.map(m=>({ ...m, pinned:state.pins.has(m.id)})).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||(new Date(a.created_at)-new Date(b.created_at)));
 let messageRows=list.map(m=>'<article class="social-chat-item '+(m.author_id===me()?'mine':'')+'">'+
 '<div class="social-chat-meta"><strong>'+e(name(m.author_id))+'</strong><time>'+e(dt(m.created_at))+'</time>'+(m.pinned?'<span class="social-pinned">📌 Pinned</span>':'')+'</div>'+
 '<p>'+e(m.body)+'</p><div class="social-chat-actions">'+
 '<button class="social-action" data-social="pin:'+m.id+'">'+(m.pinned?'Unpin':'📌 Pin')+'</button>'+
 (m.author_id===me()?'<button class="social-action" data-social="delete-msg:'+m.id+'">Delete</button>':'')+
 (m.author_id!==me()&&!blocked(m.author_id)?'<button class="social-action" data-social="block:'+m.author_id+'">Block member</button>':'')+'</div></article>').join('');
 return '<div class="social-chat-top"><div><h3>'+title+'</h3><p>'+(peer?'Private conversation between friends':'The public room for the whole community')+'</p></div>'+(peer?btn('← Back to friends','dm-back'):'<span class="chip">Shared channel</span>')+'</div>'+
 '<div class="social-chat-list" id="social-messages" role="log" aria-live="polite">'+(messageRows||'<p class="social-muted">No messages yet. Be the first to start a conversation.</p>')+'</div>'+
 (!is2fa()?'<div class="social-message warn">🔐 Enable or verify 2FA before sending a message.</div><div style="height:10px"></div>':'')+
 '<form id="wrld-compose" class="social-compose"><textarea name="body" id="social-compose-body" class="social-textarea" maxlength="2000" placeholder="'+(peer?'Message your friend...':'Say hello to the world...')+'" required>'+e(state.draft)+'</textarea><button class="btn primary" type="submit">Send ↗</button></form><div class="social-feedback" role="status" aria-live="polite"></div>';
}
function friendshipActions(id){
 const f=state.friends.find(row=>row.sender_id===id||row.receiver_id===id);
 if(blocked(id))return btn('Unblock','unblock:'+id);
 if(!f)return btn('Add friend','add:'+id)+(btn('Block','block:'+id,'danger'));
 if(f.status==='accepted')return btn('Message','dm:'+id)+btn('Remove','remove-friend:'+f.id)+btn('Block','block:'+id,'danger');
 if(f.status==='pending'&&f.receiver_id===me())return btn('Accept','accept:'+f.id)+btn('Decline','decline:'+f.id);
 if(f.status==='pending')return '<span class="chip">Request sent</span>'+btn('Cancel','remove-friend:'+f.id);
 return btn('Clear declined request','remove-friend:'+f.id);
}
function personCard(id){const p=state.people.get(id);if(!p||id===me())return '';
 return '<div class="social-person"><div class="social-person-info">'+profileChip(id)+'<div><strong>'+e(p.display_name||p.username)+'</strong><small>'+e('@'+p.username)+'</small></div></div><div class="social-person-actions">'+friendshipActions(id)+'</div></div>';
}
function friendsView(){
 const related=state.friends.filter(f=>f.status!=='declined');const peers=[...new Set(related.map(f=>f.sender_id===me()?f.receiver_id:f.sender_id))].filter(id=>!blocked(id));
 const found=state.directory.filter(x=>x.user_id!==me()&&!blocked(x.user_id));
 return '<div class="social-chat-top"><div><h3>Friends and people</h3><p>Find members, accept requests and start private conversations.</p></div><span class="chip">2FA required for friend requests</span></div>'+
 '<label class="social-help" for="social-people-query">Find a member by username</label><input id="social-people-query" class="social-input" value="'+e(state.directoryQuery)+'" placeholder="Search usernames..." maxlength="24">'+
 '<div class="social-small-list" id="social-search-results">'+(state.directoryQuery?(found.map(x=>personCard(x.user_id)).join('')||'<p class="social-muted">No members found.</p>'):'<p class="social-muted">Enter a username to find someone.</p>')+'</div>'+
 '<h4 class="social-section-title">Your friends and requests</h4><div class="social-small-list">'+(peers.map(personCard).join('')||'<p class="social-muted">No friends or requests yet.</p>')+'</div>'+
 '<h4 class="social-section-title">Blocked accounts</h4><div class="social-small-list">'+(state.blocks.map(b=>personCard(b.blocked_id)).join('')||'<p class="social-muted">Your block list is empty.</p>')+'</div>'+
 '<div class="social-feedback" role="status" aria-live="polite"></div>';
}
function profileView(){const p=state.profile||{};
 return '<div class="overline">YOUR SPACE</div><h3>Edit your profile</h3><p class="social-muted">Only your nickname, display name and bio are shown to other members. Your email stays private.</p>'+
 '<form class="social-form" id="wrld-profile-form"><label>Username<input class="social-input" name="username" pattern="[a-z0-9_]{3,24}" maxlength="24" required value="'+e(p.username||'')+'"></label>'+
 '<label>Display name<input class="social-input" name="display_name" maxlength="45" required value="'+e(p.display_name||'')+'"></label>'+
 '<label>About you<textarea class="social-textarea" name="bio" maxlength="350">'+e(p.bio||'')+'</textarea></label><button class="btn primary" type="submit">Save profile</button></form>'+
 '<div class="social-feedback" role="status" aria-live="polite"></div>';
}
function securityView(){
 const en=state.enrollment;
 let qr=en?.totp?.qr_code;
 return '<div class="overline">ACCOUNT SECURITY</div><h3>Two-factor authentication</h3>'+
 '<p class="social-muted">Fleki’s Wrld requires time-based one-time passwords (TOTP) to send any message, add friends or pin a message. Your authenticator verifies codes through the authentication provider.</p>'+
 '<div class="social-message '+(is2fa()?'':'warn')+'">'+(is2fa()?'✓ This session is verified with 2FA. You can now interact.':'⚠ This session is not verified with 2FA. Reading remains available.')+'</div>'+
 (is2fa()?'<p class="social-help">Keep access to your authenticator. Add a backup authenticator in your account settings when the backend supports it.</p>':
 en?'<div class="social-divider"></div><p class="social-muted">Scan this code in your authenticator app, or enter the secret manually. Never share the secret.</p>'+
 (qr&&/^data:image\/svg\+xml[;,]/.test(qr)?'<img class="social-mfa-qr" src="'+e(qr)+'" alt="2FA authenticator QR code">':'')+
 '<div class="social-mfa-secret">'+e(en.totp?.secret||'')+'</div><form class="social-form" id="wrld-2fa-form"><label>6-digit authenticator code<input name="code" class="social-input" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required></label><button type="submit" class="btn primary">Confirm 2FA</button></form>':
 '<div class="social-divider"></div><p class="social-muted">If you already have 2FA enabled, enter your code. Otherwise set up a new authenticator.</p><div class="actions">'+btn('Set up authenticator','enroll')+'</div><form class="social-form" id="wrld-2fa-form"><label>Authenticator code<input name="code" class="social-input" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required></label><button class="btn primary" type="submit">Verify existing 2FA</button></form>')+
 '<div class="social-feedback" role="status" aria-live="polite"></div>';
}
function renderCommunity(){
 if(!cRoot)return;
 if(!ready())return renderDisconnected(cRoot,'Fleki’s Wrld Community');
 if(!state.user)return renderAuth();
 cRoot.innerHTML='<div class="social-wrap">'+renderTop()+renderTabs()+'<section class="social-layout">'+
 (state.tab==='global'?messageView():state.tab==='friends'?(state.peer?messageView():friendsView()):state.tab==='profile'?profileView():securityView())+
 '</section></div>';
 const list=cRoot.querySelector('#social-messages');if(list)list.scrollTop=list.scrollHeight;
}
function renderNotices(){
 if(!nRoot)return;
 if(!ready())return renderDisconnected(nRoot,'Your notifications');
 if(!state.user){nRoot.innerHTML='<div class="social-card"><h3>Sign in to see notifications</h3><p>Friend requests, accepted friendships and private messages will show up here.</p><button class="btn primary" data-social="sign-in-community">Go to Community →</button></div>';return;}
 nRoot.innerHTML='<div class="social-wrap"><div class="social-bar"><div class="social-id">'+profileChip(me())+'<div><strong>Notification center</strong><small>'+state.notices.filter(n=>!n.is_read).length+' unread updates</small></div></div>'+btn('Mark all read','read-all')+'</div><div>'+
 (state.notices.map(n=>'<article class="social-notice '+(n.is_read?'':'unread')+'"><div><strong>'+e(n.title)+'</strong><p>'+e(n.actor_id?name(n.actor_id):'System')+'</p><time>'+e(dt(n.created_at))+'</time></div><div class="social-notice-actions">'+(!n.is_read?btn('Mark read','read:'+n.id):'')+btn(n.kind==='direct_message'?'Open chat':'View friends','notice-open:'+n.kind+':'+(n.actor_id||''))+'</div></article>').join('')||'<div class="social-card"><h3>All caught up ✦</h3><p>No notifications yet. New friend requests and private messages will appear here.</p></div>')+
 '</div><div class="social-feedback" role="status" aria-live="polite"></div></div>';
 const badge=document.querySelector('[data-go="notifications"]');
 if(badge){badge.querySelector('.social-unread')?.remove();if(state.notices.some(n=>!n.is_read))badge.insertAdjacentHTML('beforeend','<span class="social-unread" aria-label="Unread notifications"></span>');}
}
async function expect(result){if(result.error)throw result.error;return result.data;}
async function loadPeople(ids){
 if(!ready()||!state.user)return;
 const fresh=[...new Set(ids.filter(Boolean))].filter(id=>!state.people.has(id));
 for(let i=0;i<fresh.length;i+=50){
  const data=await expect(await state.db.from('wrld_profiles').select('user_id,username,display_name,bio').in('user_id',fresh.slice(i,i+50)));
  for(const p of data||[])state.people.set(p.user_id,p);
 }
}
async function loadFriends(){if(!state.user)return;const uid=me();
 const data=await expect(await state.db.from('wrld_friends').select('id,sender_id,receiver_id,status,created_at').or('sender_id.eq.'+uid+',receiver_id.eq.'+uid).order('created_at',{ascending:false}));
 state.friends=data||[];await loadPeople(state.friends.flatMap(f=>[f.sender_id,f.receiver_id]));}
async function loadBlocks(){if(!state.user)return;const data=await expect(await state.db.from('wrld_blocks').select('blocker_id,blocked_id').eq('blocker_id',me()));state.blocks=data||[];await loadPeople(state.blocks.map(b=>b.blocked_id));}
async function loadMessages(){if(!state.user)return;
 let query=state.db.from('wrld_messages').select('id,author_id,recipient_id,body,created_at').order('created_at',{ascending:false}).limit(75);
 if(state.peer)query=query.or('and(author_id.eq.'+me()+',recipient_id.eq.'+state.peer+'),and(author_id.eq.'+state.peer+',recipient_id.eq.'+me()+')');
 else query=query.is('recipient_id',null);
 const data=await expect(await query);state.messages=(data||[]).reverse();
 await loadPeople(state.messages.map(m=>m.author_id));
 const ids=state.messages.map(m=>m.id);if(!ids.length){state.pins=new Set();return;}
 const pins=await expect(await state.db.from('wrld_pins').select('message_id').eq('user_id',me()).in('message_id',ids));
 state.pins=new Set((pins||[]).map(p=>p.message_id));
}
async function loadNotices(){if(!state.user)return;const data=await expect(await state.db.from('wrld_notifications').select('id,recipient_id,actor_id,kind,title,is_read,created_at').eq('recipient_id',me()).order('created_at',{ascending:false}).limit(60));
 state.notices=data||[];await loadPeople(state.notices.map(n=>n.actor_id));}
async function lookupPeople(){
 if(!state.user)return;
 const q=state.directoryQuery.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
 if(!q){state.directory=[];renderCommunity();return;}
 const data=await expect(await state.db.from('wrld_profiles').select('user_id,username,display_name,bio').ilike('username',q+'%').limit(15));
 state.directory=data||[];for(const p of state.directory)state.people.set(p.user_id,p);renderCommunity();
}
let findTimer=null;
async function refreshIdentity(){
 if(!ready())return;
 try{
  const userData=await expect(await state.db.auth.getUser());
  const user=userData?.user||null, changed=me()!==user?.id;
  state.user=user;
  if(!user){state.profile=null;state.aal='aal1';state.friends=[];state.blocks=[];state.messages=[];state.notices=[];state.enrollment=null;state.peer=null;stopRealtime();renderCommunity();renderNotices();return;}
  const aal=await expect(await state.db.auth.mfa.getAuthenticatorAssuranceLevel());state.aal=aal?.currentLevel||'aal1';
  const p=await expect(await state.db.from('wrld_profiles').select('user_id,username,display_name,bio').eq('user_id',user.id).maybeSingle());
  state.profile=p;if(p)state.people.set(p.user_id,p);
  if(changed){state.tab='global';state.peer=null;state.people.clear();if(p)state.people.set(p.user_id,p);}
  await Promise.all([loadFriends(),loadBlocks(),loadNotices()]);
  if(state.tab==='global'||state.peer)await loadMessages();
  if(changed)connectRealtime();renderCommunity();renderNotices();
 }catch(ex){console.error('Wrld auth refresh:',ex);feedback(errorOf(ex),true);renderCommunity();renderNotices();}
}
function stopRealtime(){if(state.channel){state.db?.removeChannel(state.channel);state.channel=null;}}
function connectRealtime(){
 stopRealtime();if(!ready()||!state.user)return;
 state.channel=state.db.channel('fleki-wrld-social-'+me())
 .on('postgres_changes',{event:'*',schema:'public',table:'wrld_messages'},async()=>{try{if(state.tab==='global'||state.peer){await loadMessages();renderCommunity();}}catch(ex){console.warn(ex)}})
 .on('postgres_changes',{event:'*',schema:'public',table:'wrld_friends'},async()=>{try{await loadFriends();renderCommunity();}catch(ex){console.warn(ex)}})
 .on('postgres_changes',{event:'*',schema:'public',table:'wrld_notifications'},async()=>{try{await loadNotices();renderNotices();}catch(ex){console.warn(ex)}})
 .subscribe();
}
async function signInOrUp(form){
 const data=new FormData(form);const email=String(data.get('email')||'').trim(),password=String(data.get('password')||'');
 const res=state.signup?await state.db.auth.signUp({email,password}):await state.db.auth.signInWithPassword({email,password});
 await expect(res);
 state.authNote=state.signup?'Account submitted. Check your email if verification is required.':'Signed in. Set up or verify your 2FA.';
 form.reset();await refreshIdentity();if(!state.user){renderAuth();feedback(state.authNote);}
}
async function setupMfa(){
 const factors=await expect(await state.db.auth.mfa.listFactors());const active=(factors?.totp||[]).find(f=>f.status==='verified');
 if(active){state.tab='security';renderCommunity();feedback('2FA already enrolled. Enter a current code to verify this session.');return;}
 state.enrollment=await expect(await state.db.auth.mfa.enroll({factorType:'totp',friendlyName:"Fleki's Wrld"}));
 renderCommunity();feedback('Scan the QR code and verify with your 6-digit code.');
}
async function verifyMfa(code){
 let factorId=state.enrollment?.id;
 if(!factorId){const factors=await expect(await state.db.auth.mfa.listFactors());factorId=(factors?.totp||[]).find(f=>f.status==='verified')?.id;}
 if(!factorId)throw Error('Set up your authenticator first.');
 await expect(await state.db.auth.mfa.challengeAndVerify({factorId,code}));
 state.enrollment=null;await refreshIdentity();state.tab='security';renderCommunity();feedback('2FA verified. You can now send messages and friend requests.');
}
async function sendMessage(form){if(!ensure2fa())return;
 const body=String(new FormData(form).get('body')||'').trim();if(!body||body.length>2000)return;
 if(state.peer&&!friendWith(state.peer))throw Error('Private messages require an accepted friendship.');
 await expect(await state.db.from('wrld_messages').insert({author_id:me(),recipient_id:state.peer||null,body}));
 state.draft='';await loadMessages();renderCommunity();feedback('Message sent.');
}
async function saveProfile(form){const formData=new FormData(form);
 const username=String(formData.get('username')||'').toLowerCase().trim();
 if(!/^[a-z0-9_]{3,24}$/.test(username))throw Error('Username must be 3–24 letters, numbers or underscores.');
 const payload={username,display_name:String(formData.get('display_name')||'').trim(),bio:String(formData.get('bio')||'').trim()};
 await expect(await state.db.from('wrld_profiles').update(payload).eq('user_id',me()));
 state.people.delete(me());await refreshIdentity();feedback('Profile updated.');
}
async function socialAction(action){
 const parts=action.split(':'),type=parts[0],id=parts[1];
 if(type==='switch-auth'){state.signup=!state.signup;state.authNote='';renderCommunity();return;}
 if(type==='sign-in-community'){document.querySelector('[data-go="chat"]')?.click();return;}
 if(type==='signout'){await expect(await state.db.auth.signOut());return;}
 if(type==='tab'){state.tab=id;state.peer=null;state.draft='';if(id==='global')await loadMessages();renderCommunity();return;}
 if(type==='profile'){state.tab='profile';state.peer=null;renderCommunity();return;}
 if(type==='dm-back'){state.peer=null;state.tab='friends';state.draft='';renderCommunity();return;}
 if(type==='enroll'){await setupMfa();return;}
 if(type==='notice-open'){const kind=id,actor=parts[2];state.tab='friends';state.peer=(kind==='direct_message'&&actor)?actor:null;state.draft='';if(state.peer)await loadMessages();renderCommunity();document.querySelector('[data-go="chat"]')?.click();return;}
 if(type==='read-all'){await expect(await state.db.from('wrld_notifications').update({is_read:true}).eq('recipient_id',me()).eq('is_read',false));await loadNotices();renderNotices();return;}
 if(type==='read'){await expect(await state.db.from('wrld_notifications').update({is_read:true}).eq('id',id).eq('recipient_id',me()));await loadNotices();renderNotices();return;}
 if(type==='dm'){if(blocked(id))throw Error('Unblock this user first.');state.peer=id;state.tab='friends';state.draft='';await loadMessages();renderCommunity();return;}
 if(type==='add'){if(!ensure2fa())return;await expect(await state.db.from('wrld_friends').insert({sender_id:me(),receiver_id:id}));await loadFriends();renderCommunity();feedback('Friend request sent.');return;}
 if(type==='accept'||type==='decline'){if(!ensure2fa())return;await expect(await state.db.from('wrld_friends').update({status:type==='accept'?'accepted':'declined'}).eq('id',id));await loadFriends();renderCommunity();feedback('Request updated.');return;}
 if(type==='remove-friend'){await expect(await state.db.from('wrld_friends').delete().eq('id',id));await loadFriends();state.peer=null;renderCommunity();return;}
 if(type==='block'){await expect(await state.db.from('wrld_blocks').insert({blocker_id:me(),blocked_id:id}));const f=state.friends.find(f=>f.sender_id===id||f.receiver_id===id);if(f)await state.db.from('wrld_friends').delete().eq('id',f.id);await Promise.all([loadBlocks(),loadFriends()]);if(state.peer===id)state.peer=null;renderCommunity();feedback('Member blocked.');return;}
 if(type==='unblock'){await expect(await state.db.from('wrld_blocks').delete().eq('blocker_id',me()).eq('blocked_id',id));await loadBlocks();renderCommunity();feedback('Member unblocked.');return;}
 if(type==='pin'){if(!ensure2fa())return;const n=Number(id);if(state.pins.has(n))await expect(await state.db.from('wrld_pins').delete().eq('user_id',me()).eq('message_id',n));else await expect(await state.db.from('wrld_pins').insert({user_id:me(),message_id:n}));await loadMessages();renderCommunity();return;}
 if(type==='delete-msg'){await expect(await state.db.from('wrld_messages').delete().eq('author_id',me()).eq('id',Number(id)));await loadMessages();renderCommunity();return;}
}
document.addEventListener('click',async event=>{
 const b=event.target.closest('[data-social]');if(!b)return;
 event.preventDefault();if(b.disabled)return;b.disabled=true;
 try{await socialAction(b.dataset.social);}catch(ex){feedback(errorOf(ex),true);console.warn(ex);}finally{if(b.isConnected)b.disabled=false;}
});
document.addEventListener('submit',async event=>{
 const form=event.target;if(!['wrld-auth-form','wrld-compose','wrld-profile-form','wrld-2fa-form'].includes(form.id))return;
 event.preventDefault();const submit=form.querySelector('[type="submit"]');if(submit)submit.disabled=true;
 try{
  if(form.id==='wrld-auth-form')await signInOrUp(form);
  if(form.id==='wrld-compose')await sendMessage(form);
  if(form.id==='wrld-profile-form')await saveProfile(form);
  if(form.id==='wrld-2fa-form')await verifyMfa(String(new FormData(form).get('code')||'').trim());
 }catch(ex){feedback(errorOf(ex),true);console.warn(ex);}finally{if(submit?.isConnected)submit.disabled=false;}
});
document.addEventListener('input',event=>{
 if(event.target.id==='social-compose-body')state.draft=event.target.value;
 if(event.target.id==='social-people-query'){state.directoryQuery=event.target.value;clearTimeout(findTimer);findTimer=setTimeout(()=>lookupPeople().catch(err=>feedback(errorOf(err),true)),330);}
});
window.addEventListener('wrld:profile',()=>{state.tab='profile';state.peer=null;renderCommunity();});
async function boot(){
 renderCommunity();renderNotices();
 const conf=window.WRLD_SOCIAL_CONFIG||{};
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(conf.url||'')||!conf.publishableKey)return;
 try{
  const imported=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
  state.db=imported.createClient(conf.url,conf.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  state.db.auth.onAuthStateChange((_event,_session)=>{setTimeout(()=>refreshIdentity(),0);});
  await refreshIdentity();
 }catch(ex){console.warn('Fleki Wrld social backend:',ex);state.db=null;renderCommunity();renderNotices();}
}
boot();
