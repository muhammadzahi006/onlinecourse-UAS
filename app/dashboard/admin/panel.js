'use client';
import {useState} from 'react';

export function AdminPanel({initialCategories,initialUsers,courses}){
  const[categories,setCategories]=useState(initialCategories);
  const[users,setUsers]=useState(initialUsers);
  const[categoryName,setCategoryName]=useState('');
  const[categorySlug,setCategorySlug]=useState('');
  const[editing,setEditing]=useState({});
  const[message,setMessage]=useState('');
  const[error,setError]=useState('');
  const[busy,setBusy]=useState('');
  async function request(path,method,body){
    const response=await fetch(path,{method,headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Perubahan belum berhasil.');
    return result;
  }
  async function createCategory(event){
    event.preventDefault();setBusy('category-new');setError('');setMessage('');
    try{const {category}=await request('/api/admin/categories','POST',{name:categoryName,slug:categorySlug});setCategories([...categories,{...category,count:0}].sort((a,b)=>a.name.localeCompare(b.name)));setCategoryName('');setCategorySlug('');setMessage('Kategori berhasil ditambahkan.');}
    catch(e){setError(e.message);}finally{setBusy('');}
  }
  async function updateCategory(id){
    setBusy(id);setError('');setMessage('');
    try{const {category}=await request(`/api/admin/categories/${id}`,'PATCH',editing[id]||{});setCategories(categories.map(c=>c.id===id?{...c,...category}:c));setMessage('Kategori berhasil diperbarui.');}
    catch(e){setError(e.message);}finally{setBusy('');}
  }
  async function deleteCategory(id){
    setBusy(id);setError('');setMessage('');
    try{await request(`/api/admin/categories/${id}`,'DELETE');setCategories(categories.filter(c=>c.id!==id));setMessage('Kategori berhasil dihapus.');}
    catch(e){setError(e.message);}finally{setBusy('');}
  }
  async function updateRole(userId,role){
    setBusy(userId);setError('');setMessage('');
    try{const {profile}=await request(`/api/admin/users/${userId}`,'PATCH',{role});setUsers(users.map(u=>u.id===userId?{...u,...profile}:u));setMessage('Role pengguna berhasil diperbarui.');}
    catch(e){setError(e.message);}finally{setBusy('');}
  }
  return <div className="admin-panel">
    <section className="instructor-roster">
      <div className="admin-section-head"><div><div className="eyebrow"><span className="eyebrow-line"/> ROLE DAN AKUN</div><h2>Pengguna</h2></div><span className="admin-count">{users.length} akun</span></div>
      <div className="admin-user-list">{users.map(user=><div className="admin-user-row" key={user.id}>
        <span className="profile-chip">{user.fullName.slice(0,1).toUpperCase()}</span>
        <div className="admin-user-name"><strong>{user.fullName}</strong><small className="admin-user-email">{user.email||'Email belum tersedia'}</small><small>{user.createdAt?new Intl.DateTimeFormat('id-ID').format(new Date(user.createdAt)):''}</small></div>
        <select aria-label={`Role ${user.fullName}`} value={user.role} disabled={busy===user.id} onChange={e=>updateRole(user.id,e.target.value)}><option value="STUDENT">Peserta</option><option value="INSTRUCTOR">Pengajar</option><option value="ADMIN">Admin</option></select>
      </div>)}</div>
      <p className="admin-hint">Email ditampilkan untuk membantu admin mengenali akun. Password tidak dapat dilihat; Supabase hanya menyimpan hash password.</p>
    </section>
    <section className="instructor-roster">
      <div className="admin-section-head"><div><div className="eyebrow"><span className="eyebrow-line"/> KATEGORI KATALOG</div><h2>Kategori</h2></div><span className="admin-count">{categories.length} kategori</span></div>
      <form className="admin-category-create" onSubmit={createCategory}><input value={categoryName} onChange={e=>setCategoryName(e.target.value)} required minLength={2} maxLength={80} placeholder="Nama kategori"/><input value={categorySlug} onChange={e=>setCategorySlug(e.target.value)} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} placeholder="slug-kategori"/><button disabled={busy==='category-new'}>{busy==='category-new'?'Menyimpan…':'Tambah kategori'}</button></form>
      <div className="admin-category-list">{categories.map(category=>{const edit=editing[category.id]||{name:category.name,slug:category.slug};return <div className="admin-category-row" key={category.id}><input aria-label={`Nama ${category.name}`} value={edit.name} maxLength={80} onChange={e=>setEditing({...editing,[category.id]:{...edit,name:e.target.value}})}/><input aria-label={`Slug ${category.name}`} value={edit.slug} maxLength={100} onChange={e=>setEditing({...editing,[category.id]:{...edit,slug:e.target.value}})}/><span className="admin-count">{category.count} kursus</span><button disabled={busy===category.id} onClick={()=>updateCategory(category.id)}>Simpan</button><button className="admin-delete" disabled={busy===category.id||category.count>0} title={category.count>0?'Kategori masih digunakan kursus':''} onClick={()=>deleteCategory(category.id)}>Hapus</button></div>})}</div>
    </section>
    <section className="instructor-roster">
      <div className="admin-section-head"><div><div className="eyebrow"><span className="eyebrow-line"/> STATUS PUBLIKASI</div><h2>Kursus</h2></div><a className="text-link" href="/dashboard">Kelola kursus →</a></div>
      <div className="admin-category-list">{courses.map(course=><div className="admin-course-row" key={course.id}><strong>{course.title}</strong><span className={`course-status status-${course.status.toLowerCase()}`}>{course.status==='PUBLISHED'?'Terbit':course.status==='DRAFT'?'Draft':'Arsip'}</span><a href={`/dashboard/kursus/${course.id}`}>Buka ↗</a></div>)}</div>
    </section>
    {(error||message)&&<p className={error?'auth-error':'admin-success'} role="status">{error||message}</p>}
  </div>;
}
