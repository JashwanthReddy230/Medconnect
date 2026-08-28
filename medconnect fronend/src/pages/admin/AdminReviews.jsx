import { useState, useEffect } from 'react'
import { StarIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, FlagIcon } from '@heroicons/react/24/outline'
import { reviewService } from '@/api/services'
import { Avatar, StarRating, Pagination } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { formatRelative } from '@/utils/formatters'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminReviews() {
  const [reviews,  setReviews]  = useState([])
  const [query,    setQuery]    = useState('')
  const [filter,   setFilter]   = useState('all')
  const [loading,  setLoading]  = useState({})
  const [fetching, setFetching] = useState(true)
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 8)

  useEffect(() => {
    let cancelled = false
    setFetching(true)
    reviewService.getAllAdmin()
      .then((res) => {
        if (!cancelled) setReviews(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
      .finally(() => {
        if (!cancelled) setFetching(false)
      })
    return () => { cancelled = true }
  }, [])

  const filtered = reviews.filter((r) => {
    const commentText = r.comment || ''
    const targetText = (r.targetType || '') + ' ' + (r.reviewerRole || '')
    const matchQ = !debouncedQ || commentText.toLowerCase().includes(debouncedQ.toLowerCase()) || targetText.toLowerCase().includes(debouncedQ.toLowerCase())
    if (filter === 'flagged')    return matchQ && r.isFlagged
    if (filter === 'unmoderated') return matchQ && !r.isModerated
    if (filter === 'low')        return matchQ && r.rating <= 2
    return matchQ
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  const handleApprove = async (id) => {
    setLoading((p) => ({ ...p, [id]: 'approve' }))
    try {
      await reviewService.moderate(id, 'approve')
      setReviews((p) => p.map((r) => r._id === id ? { ...r, isModerated: true, isFlagged: false } : r))
      toast.success('Review approved.')
    } catch { toast.error('Failed.') }
    finally { setLoading((p) => ({ ...p, [id]: null })) }
  }

  const handleDelete = async (id) => {
    setLoading((p) => ({ ...p, [id]: 'delete' }))
    try {
      await reviewService.delete(id)
      setReviews((p) => p.filter((r) => r._id !== id))
      toast.success('Review removed.')
    } catch { toast.error('Failed.') }
    finally { setLoading((p) => ({ ...p, [id]: null })) }
  }

  const FILTERS = [
    { value:'all',         label:'All reviews'      },
    { value:'flagged',     label:`Flagged (${reviews.filter(r=>r.isFlagged).length})`      },
    { value:'unmoderated', label:`Unmoderated (${reviews.filter(r=>!r.isModerated).length})` },
    { value:'low',         label:'Low ratings (≤2)' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Review Moderation</h1>
        <p className="page-sub">Monitor and moderate patient reviews</p>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setFilter(f.value); goTo(1) }}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                filter === f.value
                  ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >{f.label}</button>
          ))}
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); goTo(1) }}
            placeholder="Search by doctor or review content…" className="input pl-9" />
        </div>
      </div>

      <div className="space-y-3">
        {fetching ? (
          <div className="card py-12 text-center text-sm text-slate-400">Loading reviews…</div>
        ) : (
          paginated.map((review) => {
            const reviewId = review.id || review._id
            const state = loading[reviewId]
            const reviewerRole = review.reviewerRole || 'USER'
            const targetType = review.targetType || 'DOCTOR'
            const patName = review.patientName || `Reviewer #${review.reviewerId || reviewId}`
            const docName = review.targetType ? `${review.targetType}${review.targetId ? ` #${review.targetId}` : ''}` : (review.doctorName || 'Doctor')
            return (
              <div key={reviewId} className={clsx(
                'card p-4 space-y-3',
                review.isFlagged && 'border-l-4 border-l-red-400',
                !review.isModerated && !review.isFlagged && 'border-l-4 border-l-amber-400'
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={patName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{patName}</p>
                      <p className="text-xs text-primary-600 dark:text-primary-400">for {docName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {review.isFlagged    && <span className="badge-danger flex items-center gap-1"><FlagIcon className="w-3 h-3"/>Flagged</span>}
                    {!review.isModerated && !review.isFlagged && <span className="badge-warning">Pending</span>}
                    {review.isModerated  && !review.isFlagged && <span className="badge-success">Approved</span>}
                    {review.createdAt && <span className="text-xs text-slate-400">{formatRelative(review.createdAt)}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating || 5} size="sm" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{review.rating || 5}/5</span>
                </div>

                {review.comment && <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{review.comment}"</p>}

                <div className="flex items-center gap-2 pt-1 border-t border-border-light dark:border-border-dark">
                  {(!review.isModerated || review.isFlagged) && (
                    <Button size="sm" loading={state==='approve'} onClick={() => handleApprove(reviewId)}
                      icon={<CheckCircleIcon className="w-3.5 h-3.5" />} className="text-xs">
                      Approve
                    </Button>
                  )}
                  <Button size="sm" variant="danger" loading={state==='delete'} onClick={() => handleDelete(reviewId)}
                    icon={<XCircleIcon className="w-3.5 h-3.5" />} className="text-xs">
                    Remove
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {!fetching && paginated.length === 0 && <div className="card py-12 text-center text-sm text-slate-400">No reviews match your filters.</div>}
      <Pagination page={page} totalPages={totalPages} onPageChange={goTo} pageSize={limit} onPageSizeChange={changeLimit} total={filtered.length} />
    </div>
  )
}
