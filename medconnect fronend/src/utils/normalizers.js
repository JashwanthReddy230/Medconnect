/**
 * normalizers.js
 * Maps backend DTO shapes → frontend component-expected shapes.
 *
 * Backend → Frontend mappings:
 *  - AppointmentStatus: SCHEDULED → confirmed | COMPLETED → completed | CANCELLED → cancelled
 *  - DoctorResponse: doctorName → fullName/name
 *  - PatientResponse: fullName → firstName + lastName
 *  - HospitalResponse: straightforward but slim fields
 */

// ── Appointment ───────────────────────────────────────────────────────────────
// Backend AppointmentResponse:
//   { appointmentNumber, patientName, doctorName, hospitalName,
//     appointmentDate (LocalDate), appointmentTime (LocalTime), status }
// Status enum: SCHEDULED | COMPLETED | CANCELLED
const APPOINTMENT_STATUS_MAP = {
  SCHEDULED:  'confirmed',
  CONFIRMED:  'confirmed',
  ACCEPTED:   'confirmed',
  APPROVED:   'confirmed',
  COMPLETED:  'completed',
  DONE:       'completed',
  CANCELLED:  'cancelled',
  CANCELED:   'cancelled',
  REJECTED:   'cancelled',
  PENDING:    'pending',

  scheduled:  'confirmed',
  confirmed:  'confirmed',
  accepted:   'confirmed',
  approved:   'confirmed',
  completed:  'completed',
  done:       'completed',
  cancelled:  'cancelled',
  canceled:   'cancelled',
  rejected:   'cancelled',
  pending:    'pending',
}

export function normalizeAppointment(a, indexFallback = 0) {
  if (!a) return null
  // appointmentDate is a LocalDate string 'yyyy-MM-dd'
  // appointmentTime is a LocalTime string 'HH:mm:ss'
  const dateStr = a.appointmentDate
    ? (typeof a.appointmentDate === 'string' ? a.appointmentDate : String(a.appointmentDate))
    : null
  const timeStr = a.appointmentTime
    ? (typeof a.appointmentTime === 'string' ? a.appointmentTime.slice(0, 5) : String(a.appointmentTime))
    : null

  // Build an ISO-like date string for formatAppointmentDate util
  const isoDate = dateStr ? `${dateStr}T${timeStr || '00:00'}:00` : null

  // Use appointmentNumber as id, fall back to index-based string
  const id = a.id ?? a.appointmentId ?? a.appointmentNumber ?? String(indexFallback + 1)

  // Preserve placeholder names as-is (do NOT reformat) so enrichAppointments
  // can detect and resolve them. Keep whatever the backend returned.
  const docName  = a.doctorName  || 'Unknown Doctor'
  const hospName = a.hospitalName || ''
  const patName  = a.patientName  || 'Unknown Patient'

  const rawSt = a.status ? String(a.status).trim() : ''
  const normalizedStatus =
    APPOINTMENT_STATUS_MAP[rawSt] ||
    APPOINTMENT_STATUS_MAP[rawSt.toUpperCase()] ||
    APPOINTMENT_STATUS_MAP[rawSt.toLowerCase()] ||
    (rawSt.toLowerCase() === 'confirmed' || rawSt.toLowerCase() === 'scheduled' || rawSt.toLowerCase() === 'accepted' ? 'confirmed' : 'pending')

  // NOTE: spread ...a FIRST so explicit fields below always win
  return {
    ...a,
    _id:             String(id),
    id:              id,
    appointmentNumber: a.appointmentNumber || String(id),
    patientName:     patName,
    doctorName:      docName,
    // specialty not in response — show from doctorName context
    specialty:       a.specialty    || a.specialization || '',
    hospitalName:    hospName,
    date:            isoDate,
    appointmentDate: dateStr,
    appointmentTime: timeStr,
    slot:            timeStr ? formatTime12h(timeStr) : '',
    // status must be normalised AFTER spread so raw backend value is overridden
    status:          normalizedStatus,
    rawStatus:       a.status,
    notes:           a.reason || a.notes || '',
    reason:          a.reason || '',
    remarks:         a.remarks || '',
    prescriptionId:  a.prescriptionId || null,
  }
}

// Convert 'HH:mm' or 'HH:mm:ss' → '10:00 AM'
function formatTime12h(timeStr) {
  if (!timeStr) return ''
  const [hStr, mStr] = timeStr.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${m} ${ampm}`
}

export function normalizeAppointments(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map((a, i) => normalizeAppointment(a, i))
}

// ── Doctor ────────────────────────────────────────────────────────────────────
// Backend DoctorResponse:
//   { id, doctorName, specialization, consultationFee, status, hospitalId }
// Note: no experience, qualification, email, mobile, ratings, city in response
export function normalizeDoctor(d) {
  if (!d) return null
  return {
    _id:             String(d.id),
    id:              d.id,
    fullName:        d.doctorName   || d.fullName || 'Unknown Doctor',
    name:            d.doctorName   || d.fullName || 'Unknown Doctor',
    doctorName:      d.doctorName   || d.fullName || 'Unknown Doctor',
    specialization:  d.specialization || d.specialty || '',
    specialty:       d.specialization || d.specialty || '',
    consultationFee: d.consultationFee ?? 0,
    status:          d.status || 'ACTIVE',
    hospitalId:      d.hospitalId || null,
    // Not in backend response — set defaults so UI doesn't crash
    experience:      d.experience   ?? null,
    qualification:   d.qualification ?? '',
    email:           d.email         ?? '',
    mobile:          d.mobile        ?? '',
    ratings:         d.ratings       ?? null,
    rating:          d.rating        ?? null,
    reviewCount:     d.reviewCount   ?? 0,
    city:            d.city          ?? '',
    isAvailableToday: d.status === 'ACTIVE',
    bio:             d.bio           ?? '',
    ...d,
  }
}

export function normalizeDoctors(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizeDoctor)
}

// ── Patient ───────────────────────────────────────────────────────────────────
// Backend PatientResponse:
//   { id, patientCode, firstName, lastName, gender, dateOfBirth, bloodGroup, mobile, email, address, emergencyContact, status }
export function normalizePatient(p) {
  if (!p) return null
  const nameParts = (p.fullName || '').trim().split(/\s+/)
  return {
    _id:          String(p.id),
    id:           p.id,
    patientCode:  p.patientCode || '',
    fullName:     p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || '',
    firstName:    p.firstName  || nameParts[0] || '',
    lastName:     p.lastName   || nameParts.slice(1).join(' ') || '',
    gender:       p.gender     || '',
    dateOfBirth:  p.dateOfBirth || '',
    bloodGroup:   p.bloodGroup || '',
    mobile:       p.mobile     || p.phone || '',
    phone:        p.mobile     || p.phone || '',
    email:        p.email      || '',
    status:       p.status     || 'ACTIVE',
    address:      p.address    || '',
    emergencyContact: p.emergencyContact || '',
    ...p,
  }
}

export function normalizePatients(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizePatient)
}

// ── Hospital ──────────────────────────────────────────────────────────────────
// Backend HospitalResponse:
//   { id, hospitalName, email, phone, address, city, state, pincode, registrationNumber, status }
export function normalizeHospital(h) {
  if (!h) return null
  return {
    _id:                String(h.id),
    id:                 h.id,
    name:               h.hospitalName || h.name || 'Unknown Hospital',
    hospitalName:       h.hospitalName || h.name || 'Unknown Hospital',
    email:              h.email   || '',
    phone:              h.phone   || '',
    address:            h.address || '',
    city:               h.city    || '',
    state:              h.state   || '',
    pincode:            h.pincode || '',
    registrationNumber: h.registrationNumber || '',
    status:             h.status  || 'PENDING',
    ...h,
  }
}

export function normalizeHospitals(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizeHospital)
}

// ── Bill ──────────────────────────────────────────────────────────────────────
// Backend Bill:
//   { id, billNumber, appointmentId, patientId, doctorId, consultationFee, medicineFee, laboratoryFee, discount, tax, totalAmount, paymentStatus, billDate }
export function normalizeBill(b) {
  if (!b) return null
  return {
    _id:             String(b.id || b.billNumber || ''),
    id:              b.id,
    billNumber:      b.billNumber || `BILL-${b.id || ''}`,
    appointmentId:   b.appointmentId,
    patientId:       b.patientId,
    doctorId:        b.doctorId,
    consultationFee: parseFloat(b.consultationFee) || 0,
    medicineFee:     parseFloat(b.medicineFee) || 0,
    laboratoryFee:   parseFloat(b.laboratoryFee) || 0,
    discount:        parseFloat(b.discount) || 0,
    tax:             parseFloat(b.tax) || 0,
    totalAmount:     parseFloat(b.totalAmount) || 0,
    paymentStatus:   b.paymentStatus || 'PENDING',
    billDate:        b.billDate || new Date().toISOString().split('T')[0],
    ...b,
  }
}

export function normalizeBills(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizeBill)
}

// ── Payment ───────────────────────────────────────────────────────────────────
// Backend Payment:
//   { id, bill, transactionId, paymentMethod, amount, paymentDate, status }
export function normalizePayment(p) {
  if (!p) return null
  return {
    _id:             String(p.id || p.transactionId || ''),
    id:              p.id,
    billId:          p.bill?.id || p.billId || null,
    bill:            p.bill ? normalizeBill(p.bill) : null,
    transactionId:   p.transactionId || p.transactionHash || `TXN-${p.id || ''}`,
    paymentMethod:   p.paymentMethod || 'UPI',
    amount:          parseFloat(p.amount) || 0,
    paymentDate:     p.paymentDate || p.createdAt || new Date().toISOString(),
    status:          p.status || p.paymentStatus || 'COMPLETED',
    ...p,
  }
}

export function normalizePayments(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizePayment)
}

// ── Invoice ───────────────────────────────────────────────────────────────────
// Backend Invoice:
//   { id, billId, invoiceNumber, patientId, doctorId, amount, paymentStatus, invoiceDate }
export function normalizeInvoice(i) {
  if (!i) return null
  return {
    _id:           String(i.id || i.invoiceNumber || ''),
    id:            i.id,
    billId:        i.billId,
    invoiceNumber: i.invoiceNumber || `INV-${i.id || ''}`,
    patientId:     i.patientId,
    doctorId:      i.doctorId,
    amount:        parseFloat(i.amount) || 0,
    paymentStatus: i.paymentStatus || 'PAID',
    invoiceDate:   i.invoiceDate || new Date().toISOString().split('T')[0],
    ...i,
  }
}

export function normalizeInvoices(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizeInvoice)
}

// ── Medical Record ─────────────────────────────────────────────────────────────
// Backend MedicalRecord:
//   { id, appointmentId, patientId, doctorId, diagnosis, symptoms, treatment, doctorNotes, visitDate }
export function normalizeMedicalRecord(m) {
  if (!m) return null
  return {
    _id:           String(m.id || ''),
    id:            m.id,
    appointmentId: m.appointmentId,
    patientId:     m.patientId,
    doctorId:      m.doctorId,
    diagnosis:     m.diagnosis || '',
    symptoms:      m.symptoms || '',
    treatment:     m.treatment || '',
    doctorNotes:   m.doctorNotes || m.notes || '',
    visitDate:     m.visitDate || m.createdAt || new Date().toISOString().split('T')[0],
    ...m,
  }
}

export function normalizeMedicalRecords(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizeMedicalRecord)
}

// ── Prescription ──────────────────────────────────────────────────────────────
// Backend Prescription:
//   { id, medicalRecordId, medicineName, dosage, duration, instructions }
export function normalizePrescription(p) {
  if (!p) return null
  return {
    _id:             String(p.id || ''),
    id:              p.id,
    medicalRecordId: p.medicalRecordId,
    medicineName:    p.medicineName || p.name || '',
    dosage:          p.dosage || '',
    duration:        p.duration || '',
    instructions:    p.instructions || p.notes || '',
    ...p,
  }
}

export function normalizePrescriptions(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizePrescription)
}

// ── Report ────────────────────────────────────────────────────────────────────
// Backend Report:
//   { id, reportDate, totalPatients, totalDoctors, totalAppointments, totalBills, totalPayments, totalRevenue, pendingRevenue }
export function normalizeReport(r) {
  if (!r) return null
  return {
    _id:               String(r.id || ''),
    id:                r.id,
    reportDate:        r.reportDate || new Date().toISOString().split('T')[0],
    totalPatients:     parseInt(r.totalPatients, 10) || 0,
    totalDoctors:      parseInt(r.totalDoctors, 10) || 0,
    totalAppointments: parseInt(r.totalAppointments, 10) || 0,
    totalBills:        parseInt(r.totalBills, 10) || 0,
    totalPayments:     parseInt(r.totalPayments, 10) || 0,
    totalRevenue:      parseFloat(r.totalRevenue) || 0,
    pendingRevenue:    parseFloat(r.pendingRevenue) || 0,
    ...r,
  }
}

export function normalizeReports(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizeReport)
}

