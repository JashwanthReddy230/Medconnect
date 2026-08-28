import { useState, useEffect } from 'react'
import { Modal } from '@/components/common/index.jsx'
import Button from '@/components/common/Button.jsx'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { reviewService } from '@/api/services'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const RATING_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
}

export default function ReviewModal({
  open,
  onClose,
  reviewerId,
  reviewerRole = 'USER', // USER, DOCTOR, HOSPITAL
  doctorInfo,            // { id, name }
  hospitalInfo,          // { id, name }
  appointmentId,
  paymentId,
  onSubmitted,
}) {
  const isPatient = reviewerRole === 'USER' || reviewerRole === 'PATIENT'

  // Patient can pick target: 'DOCTOR' | 'HOSPITAL' | 'MEDCONNECT'
  // Doctor / Hospital user target is fixed to 'MEDCONNECT'
  const [selectedTarget, setSelectedTarget] = useState(isPatient ? 'DOCTOR' : 'MEDCONNECT')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTarget(isPatient ? 'DOCTOR' : 'MEDCONNECT')
      setRating(0)
      setHoverRating(0)
      setComment('')
      setSubmitting(false)
    }
  }, [open, isPatient])

  if (!open) return null

  // Get active targetId
  let targetId = null
  if (selectedTarget === 'DOCTOR') targetId = doctorInfo?.id || null
  if (selectedTarget === 'HOSPITAL') targetId = hospitalInfo?.id || null

  const activeDisplayRating = hoverRating || rating

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) {
      toast.error('Please select a rating (1 to 5 stars).')
      return
    }

    setSubmitting(true)

    const payload = {
      rating,
      comment: comment.trim(),
      reviewerId,
      reviewerRole: reviewerRole.toUpperCase(),
      targetType: selectedTarget,
      targetId: selectedTarget === 'MEDCONNECT' ? null : (targetId ? parseInt(targetId, 10) : null),
      appointmentId: appointmentId ? parseInt(appointmentId, 10) : null,
      paymentId: paymentId ? parseInt(paymentId, 10) : null,
    }

    try {
      await reviewService.create(payload)
      toast.success('Thank you for your feedback!')
      if (onSubmitted) onSubmitted()
      onClose()
    } catch (err) {
      console.error('Review submit error:', err)
      const errorMsg = err?.response?.data?.message || 'Failed to submit review. You may have already reviewed this recently.'
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Optional Feedback & Review" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Target Selector (Only for Patients) */}
        {isPatient && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select What You Are Reviewing
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setSelectedTarget('DOCTOR'); setRating(0); }}
                className={clsx(
                  'py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center',
                  selectedTarget === 'DOCTOR'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                )}
              >
                Doctor {doctorInfo?.name ? `(${doctorInfo.name.split(' ')[0]})` : ''}
              </button>

              <button
                type="button"
                onClick={() => { setSelectedTarget('HOSPITAL'); setRating(0); }}
                className={clsx(
                  'py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center',
                  selectedTarget === 'HOSPITAL'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                )}
              >
                Hospital
              </button>

              <button
                type="button"
                onClick={() => { setSelectedTarget('MEDCONNECT'); setRating(0); }}
                className={clsx(
                  'py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center',
                  selectedTarget === 'MEDCONNECT'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                )}
              >
                MedConnect
              </button>
            </div>
          </div>
        )}

        {/* Header indicator */}
        {!isPatient && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Share your experience with MedConnect Website to help us improve our service.
          </p>
        )}

        {/* 1 to 5 Interactive Star Rating */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Select your rating
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 text-amber-400 hover:scale-125 transition-transform duration-150 focus:outline-none"
                aria-label={`Rate ${star} stars`}
              >
                {star <= activeDisplayRating ? (
                  <StarIcon className="w-8 h-8 drop-shadow-sm" />
                ) : (
                  <StarOutline className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                )}
              </button>
            ))}
          </div>

          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 h-5 mt-2">
            {activeDisplayRating ? `${activeDisplayRating} / 5 — ${RATING_LABELS[activeDisplayRating]}` : ''}
          </span>
        </div>

        {/* Comment Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Write your comments (Optional)
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked or what could be improved..."
            className="input w-full resize-none text-sm"
            maxLength={1000}
          />
        </div>

        {/* Modal Buttons: Submit & Skip */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-xs px-4"
            disabled={submitting}
          >
            Skip
          </button>
          <Button
            type="submit"
            loading={submitting}
            disabled={!rating || submitting}
            className="btn-sm"
          >
            Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  )
}
