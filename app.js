let state={settings:{business_name:"UMKM Saya",whatsapp:""},transactions:[],orders:[],products:[],customers:[]};

const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const dateFmt=s=>s?new Date(s).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"}):"-";

function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2500)}
function showPage(id){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===id));if(id==="dashboard")renderDashboard();if(id==="kas")renderTransactions();if(id==="order")renderOrders();if(id==="products")renderProducts();if(id==="customers")renderCustomers()}
document.querySelectorAll(".nav").forEach(x=>x.onclick=()=>showPage(x.dataset.page));
document.getElementById("refreshBtn").onclick=loadData;

async function api(action,payload={}){
  if(API_URL.includes("PASTE_")) {toast("Isi API_URL di config.js terlebih dahulu");throw new Error("API URL belum diisi")}
  const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,store_id:STORE_ID,...payload})});
  const data=await res.json();if(!data.ok)throw new Error(data.error||"Terjadi kesalahan");return data;
}

async function loadData(){
  try{
    const d=await api("getAll");
    state={...state,...d.data};
    document.getElementById("businessName").textContent=state.settings.business_name||"UMKM";
    document.getElementById("todayText").textContent=new Date().toLocaleDateString("id-ID",{dateStyle:"full"});
    renderDashboard();renderTransactions();renderOrders();renderProducts();renderCustomers();loadSettings();
  }catch(e){console.error(e);toast(e.message)}
}
function renderDashboard(){
 const inc=state.transactions.filter(x=>x.type==="income").reduce((a,x)=>a+Number(x.amount||0),0);
 const exp=state.transactions.filter(x=>x.type==="expense").reduce((a,x)=>a+Number(x.amount||0),0);
 document.getElementById("totalIncome").textContent=rupiah(inc);document.getElementById("totalExpense").textContent=rupiah(exp);document.getElementById("totalProfit").textContent=rupiah(inc-exp);document.getElementById("totalOrders").textContent=state.orders.length;
 const arr=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
 document.getElementById("recentTransactions").innerHTML=arr.length?arr.map(transactionHTML).join(""):`<div class="empty">Belum ada transaksi.</div>`;
}
function transactionHTML(x){return `<div class="list-item"><div><div class="item-title">${esc(x.description||x.category||"Transaksi")}</div><div class="item-sub">${esc(x.category||"")} · ${dateFmt(x.date)}</div></div><div class="amount ${x.type==="income"?"plus":"minus"}">${x.type==="income"?"+":"-"} ${rupiah(x.amount)}</div></div>`}
function renderTransactions(){
 const filter=document.getElementById("kasFilter")?.value||"all",q=(document.getElementById("kasSearch")?.value||"").toLowerCase();
 let arr=[...state.transactions].filter(x=>(filter==="all"||x.type===filter)&&JSON.stringify(x).toLowerCase().includes(q)).sort((a,b)=>new Date(b.date)-new Date(a.date));
 document.getElementById("transactionList").innerHTML=arr.length?arr.map(x=>transactionHTML(x)+`<div class="list-item" style="margin-top:-1px"><div></div><button class="small-btn danger" onclick="deleteTransaction('${esc(x.id)}')">Hapus</button></div>`).join(""):`<div class="empty">Belum ada transaksi.</div>`;
}
async function deleteTransaction(id){if(!confirm("Hapus transaksi ini?"))return;try{await api("deleteTransaction",{id});toast("Transaksi dihapus");await loadData()}catch(e){toast(e.message)}}
function openTransactionModal(){
 document.getElementById("modalContent").innerHTML=`<h2>Tambah Transaksi</h2><form class="form" onsubmit="submitTransaction(event)">
 <div class="form-row"><label>Jenis<select id="tType"><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></label>
 <label>Nominal<input id="tAmount" type="number" min="0" required placeholder="50000"></label></div>
 <label>Kategori<input id="tCategory" required placeholder="Penjualan / Bahan / Operasional"></label>
 <label>Keterangan<input id="tDesc" placeholder="Contoh: Penjualan roti"></label>
 <label>Tanggal<input id="tDate" type="datetime-local" required></label>
 <button class="primary">Simpan</button></form>`;
 document.getElementById("tDate").value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);openModal();
}
async function submitTransaction(e){e.preventDefault();try{await api("addTransaction",{transaction:{type:tType.value,amount:Number(tAmount.value),category:tCategory.value,description:tDesc.value,date:new Date(tDate.value).toISOString()}});closeModal();toast("Transaksi tersimpan");await loadData()}catch(e){toast(e.message)}}

function renderProducts(){
 document.getElementById("productList").innerHTML=state.products.length?state.products.map(p=>`<div class="product-card"><h3>${esc(p.name)}</h3><p>${rupiah(p.price)}</p><div class="item-sub">Stok: ${Number(p.stock||0)}</div><div class="product-actions"><button class="small-btn" onclick="editProduct('${esc(p.id)}')">Edit</button><button class="small-btn danger" onclick="deleteProduct('${esc(p.id)}')">Hapus</button></div></div>`).join(""):`<div class="empty">Belum ada produk.</div>`;
}
function openProductModal(p=null){
 document.getElementById("modalContent").innerHTML=`<h2>${p?"Edit":"Tambah"} Produk</h2><form class="form" onsubmit="submitProduct(event,'${p?.id||""}')">
 <label>Nama Produk<input id="pName" required value="${esc(p?.name||"")}" placeholder="Contoh: Roti Maryam Original"></label>
 <div class="form-row"><label>Harga<input id="pPrice" type="number" min="0" required value="${p?.price||""}"></label><label>Stok<input id="pStock" type="number" min="0" value="${p?.stock||0}"></label></div>
 <label>Status<select id="pActive"><option value="true" ${p?.active!==false?"selected":""}>Aktif</option><option value="false" ${p?.active===false?"selected":""}>Nonaktif</option></select></label>
 <button class="primary">Simpan</button></form>`;openModal();
}
function editProduct(id){openProductModal(state.products.find(x=>x.id===id))}
async function submitProduct(e,id){e.preventDefault();try{await api(id?"updateProduct":"addProduct",{id,product:{name:pName.value,price:Number(pPrice.value),stock:Number(pStock.value),active:pActive.value==="true"}});closeModal();toast("Produk tersimpan");await loadData()}catch(e){toast(e.message)}}
async function deleteProduct(id){if(!confirm("Hapus produk?"))return;try{await api("deleteProduct",{id});await loadData();toast("Produk dihapus")}catch(e){toast(e.message)}}

function renderOrders(){
 const arr=[...state.orders].sort((a,b)=>new Date(b.date)-new Date(a.date));
 document.getElementById("orderList").innerHTML=arr.length?arr.map(o=>`<div class="list-item"><div><div class="item-title">${esc(o.customer_name||"Pelanggan")}</div><div class="item-sub">${esc(o.order_no)} · ${dateFmt(o.date)} · ${esc(o.status||"baru")}</div><div class="item-sub">${esc(o.items_summary||"")}</div></div><div><div class="amount">${rupiah(o.total)}</div><button class="small-btn" onclick="sendOrderWA('${esc(o.id)}')">WhatsApp</button></div></div>`).join(""):`<div class="empty">Belum ada order.</div>`;
}
function openOrderModal(){
 const opts=state.products.filter(p=>p.active!==false).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} — ${rupiah(p.price)}</option>`).join("");
 document.getElementById("modalContent").innerHTML=`<h2>Order Baru</h2><form class="form" onsubmit="submitOrder(event)">
 <label>Nama Pelanggan<input id="oCustomer" required placeholder="Nama pelanggan"></label>
 <label>No. WhatsApp<input id="oPhone" placeholder="628123456789"></label>
 <label>Produk<select id="oProduct">${opts||'<option value="">Belum ada produk</option>'}</select></label>
 <div class="form-row"><label>Qty<input id="oQty" type="number" min="1" value="1" required></label><label>Catatan<input id="oNote" placeholder="Level pedas, alamat, dll"></label></div>
 <button class="primary" ${opts?"":"disabled"}>Simpan Order</button></form>`;openModal();
}
async function submitOrder(e){e.preventDefault();const p=state.products.find(x=>x.id===oProduct.value);try{await api("addOrder",{order:{customer_name:oCustomer.value,phone:oPhone.value,items:[{product_id:p.id,name:p.name,qty:Number(oQty.value),price:Number(p.price)}],note:oNote.value,total:Number(p.price)*Number(oQty.value),date:new Date().toISOString()}});closeModal();toast("Order dibuat");await loadData()}catch(e){toast(e.message)}}
function sendOrderWA(id){
 const o=state.orders.find(x=>x.id===id);if(!o)return;
 let phone=(o.phone||state.settings.whatsapp||"").replace(/\D/g,"");if(phone.startsWith("0"))phone="62"+phone.slice(1);
 let msg=`Halo ${o.customer_name||"Kak"}, berikut detail order dari ${state.settings.business_name}:%0A%0A${o.items_summary||""}%0A%0ATotal: ${rupiah(o.total)}%0A${o.note?`Catatan: ${o.note}%0A`:""}%0ATerima kasih 🙏`;
 window.open(`https://wa.me/${phone}?text=${msg}`,"_blank");
}

function renderCustomers(){document.getElementById("customerList").innerHTML=state.customers.length?state.customers.map(c=>`<div class="list-item"><div><div class="item-title">${esc(c.name)}</div><div class="item-sub">${esc(c.phone||"-")} ${c.note?"· "+esc(c.note):""}</div></div><button class="small-btn danger" onclick="deleteCustomer('${esc(c.id)}')">Hapus</button></div>`).join(""):`<div class="empty">Belum ada pelanggan.</div>`}
function openCustomerModal(){document.getElementById("modalContent").innerHTML=`<h2>Tambah Pelanggan</h2><form class="form" onsubmit="submitCustomer(event)"><label>Nama<input id="cName" required></label><label>No. WhatsApp<input id="cPhone" placeholder="628..."></label><label>Catatan<input id="cNote"></label><button class="primary">Simpan</button></form>`;openModal()}
async function submitCustomer(e){e.preventDefault();try{await api("addCustomer",{customer:{name:cName.value,phone:cPhone.value,note:cNote.value}});closeModal();await loadData();toast("Pelanggan tersimpan")}catch(e){toast(e.message)}}
async function deleteCustomer(id){if(!confirm("Hapus pelanggan?"))return;try{await api("deleteCustomer",{id});await loadData();toast("Pelanggan dihapus")}catch(e){toast(e.message)}}

function loadSettings(){settingBusiness.value=state.settings.business_name||"";settingPhone.value=state.settings.whatsapp||""}
async function saveSettings(){try{await api("saveSettings",{settings:{business_name:settingBusiness.value,whatsapp:settingPhone.value}});await loadData();toast("Pengaturan tersimpan")}catch(e){toast(e.message)}}
function openModal(){document.getElementById("modal").classList.remove("hidden")}function closeModal(){document.getElementById("modal").classList.add("hidden")}
loadData();
