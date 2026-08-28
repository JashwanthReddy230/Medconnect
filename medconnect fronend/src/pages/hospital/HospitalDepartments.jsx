import { useState } from 'react'
import { PlusIcon, TrashIcon, PencilSquareIcon, BuildingOffice2Icon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { hospitalService } from '@/api/services'
import { Modal, EmptyState } from '@/components/common/index.jsx'
import { Input, TextArea } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const MOCK_DEPTS = [
  { _id:'1', name:'Cardiology',    head:'Dr. Sarah Chen',   doctorCount:8,  description:'Heart and cardiovascular care.',       status:'active'   },
  { _id:'2', name:'Neurology',     head:'Dr. Mark Rivera',  doctorCount:5,  description:'Brain and nervous system disorders.',   status:'active'   },
  { _id:'3', name:'Dermatology',   head:'Dr. Priya Patel',  doctorCount:4,  description:'Skin, hair, and nail conditions.',      status:'active'   },
  { _id:'4', name:'Orthopedics',   head:'Dr. James Wilson', doctorCount:6,  description:'Bones, joints, and musculoskeletal.',   status:'active'   },
  { _id:'5', name:'Pediatrics',    head:'Dr. Emma Lee',     doctorCount:7,  description:'Medical care for children and infants.',status:'active'   },
  { _id:'6', name:'Oncology',      head:'Dr. David Kim',    doctorCount:3,  description:'Cancer diagnosis and treatment.',       status:'inactive' },
]

export default function HospitalDepartments() {
  const [depts,    setDepts]    = useState(MOCK_DEPTS)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const openAdd  = () => { setEditing(null); reset(); setModal(true) }
  const openEdit = (dept) => {
    setEditing(dept)
    setValue('name', dept.name); setValue('head', dept.head)
    setValue('description', dept.description); setValue('status', dept.status)
    setModal(true)
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (editing) {
        await hospitalService.addDepartment({ ...data, _id: editing._id })
        setDepts((p) => p.map((d) => d._id === editing._id ? { ...d, ...data } : d))
        toast.success('Department updated!')
      } else {
        await hospitalService.addDepartment(data)
        setDepts((p) => [...p, { _id: Date.now().toString(), doctorCount: 0, ...data }])
        toast.success('Department added!')
      }
      setModal(false)
      reset()
    } catch { toast.error('Failed to save.') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await hospitalService.deleteDepartment(id)
      setDepts((p) => p.filter((d) => d._id !== id))
      toast.success('Department removed.')
    } catch { toast.error('Failed to delete.') }
    finally { setDeleting(null) }
  }

  const active   = depts.filter((d) => d.status === 'active').length
  const inactive = depts.filter((d) => d.status === 'inactive').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-sub">{active} active · {inactive} inactive</p>
        </div>
        <Button onClick={openAdd} icon={<PlusIcon className="w-4 h-4" />}>Add department</Button>
      </div>

      {depts.length === 0 ? (
        <EmptyState icon={<BuildingOffice2Icon className="w-8 h-8" />} title="No departments yet"
          description="Add your first department to organize your medical staff."
          action={<Button onClick={openAdd} icon={<PlusIcon className="w-4 h-4" />}>Add department</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map((dept) => (
            <div key={dept._id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <BuildingOffice2Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{dept.name}</h3>
                    <span className={clsx('badge text-[10px] mt-0.5', dept.status === 'active' ? 'badge-success' : 'badge-neutral')}>
                      {dept.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(dept)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-muted-light dark:hover:bg-muted-dark transition-colors">
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(dept._id)} disabled={deleting === dept._id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    {deleting === dept._id
                      ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                      : <TrashIcon className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{dept.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-border-light dark:border-border-dark pt-2">
                <span>{dept.doctorCount} doctors</span>
                {dept.head && <span>Head: {dept.head}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); reset() }}
        title={editing ? 'Edit Department' : 'Add Department'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Department name" required placeholder="e.g. Cardiology"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })} />
          <Input label="Department head (optional)" placeholder="Dr. Full Name"
            {...register('head')} />
          <TextArea label="Description" rows={2} placeholder="Brief description of services…"
            {...register('description')} />
          <div>
            <label className="label">Status</label>
            <div className="flex gap-3">
              {['active','inactive'].map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={s} {...register('status')} defaultChecked={s==='active'} className="accent-primary-600" />
                  <span className="text-sm capitalize text-slate-700 dark:text-slate-200">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setModal(false); reset() }} className="btn btn-secondary flex-1">Cancel</button>
            <Button type="submit" loading={loading} className="flex-1" icon={<CheckCircleIcon className="w-4 h-4" />}>
              {editing ? 'Save changes' : 'Add department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
