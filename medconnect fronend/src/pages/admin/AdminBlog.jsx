import { useState } from 'react'
import { PlusIcon, PencilSquareIcon, TrashIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { blogService } from '@/api/services'
import { Modal, Pagination, EmptyState, Badge } from '@/components/common/index.jsx'
import { Input, TextArea, Select } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import { usePagination } from '@/hooks/index.js'
import { formatDate, slugify } from '@/utils/formatters'
import { useForm } from 'react-hook-form'
import { validators } from '@/utils/validators'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORIES = ['General Health','Cardiology','Nutrition','Mental Health','Pediatrics','Dermatology','Orthopedics','Women\'s Health'].map(v=>({value:v,label:v}))

const MOCK_POSTS = [
  { _id:'1', title:'10 Signs You Should See a Cardiologist', category:'Cardiology', isPublished:true,  author:'Admin', createdAt:new Date(Date.now()-86400000).toISOString(),   tags:['heart','checkup'] },
  { _id:'2', title:'How to Manage Stress in Daily Life',     category:'Mental Health',isPublished:true,  author:'Admin', createdAt:new Date(Date.now()-172800000).toISOString(),  tags:['stress','wellness'] },
  { _id:'3', title:'Complete Guide to Healthy Eating',       category:'Nutrition',    isPublished:false, author:'Admin', createdAt:new Date(Date.now()-259200000).toISOString(),  tags:['diet','nutrition'] },
  { _id:'4', title:'Childhood Vaccines: What Parents Should Know', category:'Pediatrics', isPublished:true, author:'Admin', createdAt:new Date(Date.now()-345600000).toISOString(), tags:['kids','vaccines'] },
  { _id:'5', title:'Understanding Back Pain and Treatment',  category:'Orthopedics',  isPublished:false, author:'Admin', createdAt:new Date(Date.now()-432000000).toISOString(),  tags:['pain','spine'] },
]

export default function AdminBlog() {
  const [posts,    setPosts]    = useState(MOCK_POSTS)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [loading,  setLoading]  = useState({})
  const { page, limit, goTo, changeLimit } = usePagination(1, 5)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const openAdd  = () => { setEditing(null); reset(); setModal(true) }
  const openEdit = (post) => {
    setEditing(post)
    setValue('title',   post.title)
    setValue('category',post.category)
    setValue('tags',    post.tags.join(', '))
    setModal(true)
  }

  const onSubmit = async (data) => {
    setLoading((p) => ({ ...p, form: true }))
    try {
      const payload = { ...data, tags: data.tags.split(',').map(t=>t.trim()).filter(Boolean), slug: slugify(data.title) }
      if (editing) {
        await blogService.update(editing._id, payload)
        setPosts((p) => p.map((post) => post._id === editing._id ? { ...post, ...payload } : post))
        toast.success('Post updated!')
      } else {
        await blogService.create(payload)
        setPosts((p) => [{ _id: Date.now().toString(), isPublished: false, author: 'Admin', createdAt: new Date().toISOString(), ...payload }, ...p])
        toast.success('Post created!')
      }
      setModal(false); reset()
    } catch { toast.error('Failed to save.') }
    finally { setLoading((p) => ({ ...p, form: false })) }
  }

  const handleTogglePublish = async (post) => {
    setLoading((p) => ({ ...p, [post._id]: true }))
    try {
      if (post.isPublished) await blogService.unpublish(post._id)
      else                  await blogService.publish(post._id)
      setPosts((p) => p.map((po) => po._id === post._id ? { ...po, isPublished: !po.isPublished } : po))
      toast.success(post.isPublished ? 'Post unpublished.' : 'Post published!')
    } catch { toast.error('Failed.') }
    finally { setLoading((p) => ({ ...p, [post._id]: false })) }
  }

  const handleDelete = async (id) => {
    setLoading((p) => ({ ...p, [id]: 'delete' }))
    try {
      await blogService.delete(id)
      setPosts((p) => p.filter((post) => post._id !== id))
      toast.success('Post deleted.')
    } catch { toast.error('Failed to delete.') }
    finally { setLoading((p) => ({ ...p, [id]: false })) }
  }

  const totalPages = Math.ceil(posts.length / limit)
  const paginated  = posts.slice((page-1)*limit, page*limit)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Blog Management</h1>
          <p className="page-sub">{posts.filter(p=>p.isPublished).length} published · {posts.filter(p=>!p.isPublished).length} drafts</p>
        </div>
        <Button onClick={openAdd} icon={<PlusIcon className="w-4 h-4" />}>New post</Button>
      </div>

      {paginated.length === 0 ? (
        <EmptyState icon={<DocumentTextIcon className="w-8 h-8" />} title="No blog posts" description="Create your first health article." action={<Button onClick={openAdd}>Create post</Button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Tags</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((post) => (
                  <tr key={post._id}>
                    <td>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 max-w-[260px] truncate">{post.title}</p>
                      <p className="text-xs text-slate-400">by {post.author}</p>
                    </td>
                    <td><span className="badge-info text-xs">{post.category}</span></td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0,2).map((t) => <span key={t} className="badge-neutral text-[10px]">{t}</span>)}
                        {post.tags.length > 2 && <span className="text-xs text-slate-400">+{post.tags.length-2}</span>}
                      </div>
                    </td>
                    <td><span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span></td>
                    <td>
                      <span className={post.isPublished ? 'badge-success' : 'badge-warning'}>
                        {post.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(post)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-muted-light dark:hover:bg-muted-dark transition-colors">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <Button size="sm" loading={!!loading[post._id] && loading[post._id] !== 'delete'}
                          onClick={() => handleTogglePublish(post)}
                          variant={post.isPublished ? 'secondary' : 'primary'}
                          className="text-xs">
                          {post.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                        <button onClick={() => handleDelete(post._id)} disabled={loading[post._id]==='delete'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          {loading[post._id]==='delete'
                            ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block"/>
                            : <TrashIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={goTo} pageSize={limit} onPageSizeChange={changeLimit} total={posts.length} />
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); reset() }} title={editing ? 'Edit Post' : 'New Blog Post'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Title" required placeholder="Article title…" error={errors.title?.message}
            {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Too short' } })} />
          <Select label="Category" required options={CATEGORIES} placeholder="Select category" error={errors.category?.message}
            {...register('category', { required: 'Category is required' })} />
          <TextArea label="Content" required rows={6} placeholder="Write your article here…" error={errors.content?.message}
            {...register('content', validators.textArea(50, 10000))} />
          <Input label="Tags (comma-separated)" placeholder="health, tips, wellness" {...register('tags')} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setModal(false); reset() }} className="btn btn-secondary flex-1">Cancel</button>
            <Button type="submit" loading={!!loading.form} className="flex-1">
              {editing ? 'Save changes' : 'Create post'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
