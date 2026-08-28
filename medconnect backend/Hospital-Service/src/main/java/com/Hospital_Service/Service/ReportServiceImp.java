package com.Hospital_Service.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.ReportResponse;
import com.Hospital_Service.Repository.AppointmentRepository;
import com.Hospital_Service.Repository.BillRepository;
import com.Hospital_Service.Repository.DoctorRepository;
import com.Hospital_Service.Repository.PatientRepository;
import com.Hospital_Service.Repository.PaymentRepository;
import com.Hospital_Service.Repository.ReportRepository;
import com.Hospital_Service.entity.Appointment;
import com.Hospital_Service.entity.Bill;
import com.Hospital_Service.entity.Doctor;
import com.Hospital_Service.entity.Payment;
import com.Hospital_Service.entity.Report;

@Service
public class ReportServiceImp implements ReportService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ReportRepository reportRepository;

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN — platform-wide report across ALL hospitals, doctors and patients.
    // ════════════════════════════════════════════════════════════════════════

    @Override
    public ReportResponse getHospitalReport() {

        long totalPatients = patientRepository.count();
        long totalDoctors = doctorRepository.count();
        long totalAppointments = appointmentRepository.count();
        long totalBills = billRepository.count();
        long totalPayments = paymentRepository.count();

        List<Bill> allBills = billRepository.findAll();

        // Bill.totalAmount is a nullable Double — guard every read so a single
        // incomplete/legacy Bill row can't NPE-crash the whole report.
        Double totalRevenue = allBills.stream()
                .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
                .sum();

        Double pendingRevenue = allBills.stream()
                .filter(b -> "PENDING".equalsIgnoreCase(b.getPaymentStatus()))
                .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
                .sum();

        LocalDate today = LocalDate.now();

        // Same-day calls update the existing global snapshot in place instead of
        // inserting duplicate rows — hospitalId stays NULL to mark it as the
        // platform-wide Admin report, distinct from any per-hospital snapshot.
        Report report = reportRepository.findFirstByHospitalIdIsNullAndReportDateOrderByIdDesc(today)
                .orElseGet(Report::new);

        report.setHospitalId(null);
        report.setReportDate(today);
        report.setTotalPatients(totalPatients);
        report.setTotalDoctors(totalDoctors);
        report.setTotalAppointments(totalAppointments);
        report.setTotalBills(totalBills);
        report.setTotalPayments(totalPayments);
        report.setTotalRevenue(totalRevenue);
        report.setPendingRevenue(pendingRevenue);

        Report saved = reportRepository.save(report);

        return map(saved);
    }

    @Override
    public ReportResponse getLatestReport() {

        return reportRepository.findFirstByHospitalIdIsNullOrderByReportDateDescIdDesc()
                .map(this::map)
                .orElseGet(this::getHospitalReport);
    }

    @Override
    public List<ReportResponse> getAllReports() {

        return reportRepository.findAllByHospitalIdIsNullOrderByReportDateDescIdDesc()
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════════════════════
    // HOSPITAL — scoped strictly to one hospital's own doctors, patients,
    // appointments, bills and payments. Never mixes in other hospitals' data.
    // ════════════════════════════════════════════════════════════════════════

    @Override
    public ReportResponse getHospitalScopedReport(Long hospitalId) {

        List<Doctor> hospitalDoctors = doctorRepository.findByHospital_Id(hospitalId);
        List<Long> doctorIds = hospitalDoctors.stream()
                .map(Doctor::getId)
                .collect(Collectors.toList());

        long totalDoctors = hospitalDoctors.size();

        List<Appointment> hospitalAppointments = appointmentRepository.findByHospitalId(hospitalId);
        long totalAppointments = hospitalAppointments.size();

        // Distinct patients actually seen at THIS hospital (via its appointments).
        long totalPatients = hospitalAppointments.stream()
                .map(Appointment::getPatientId)
                .distinct()
                .count();

        List<Bill> hospitalBills = doctorIds.isEmpty()
                ? List.of()
                : billRepository.findByDoctorIdIn(doctorIds);
        long totalBills = hospitalBills.size();

        Double totalRevenue = hospitalBills.stream()
                .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
                .sum();

        Double pendingRevenue = hospitalBills.stream()
                .filter(b -> "PENDING".equalsIgnoreCase(b.getPaymentStatus()))
                .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
                .sum();

        List<Payment> hospitalPayments = doctorIds.isEmpty()
                ? List.of()
                : paymentRepository.findByBill_DoctorIdIn(doctorIds);
        long totalPayments = hospitalPayments.size();

        LocalDate today = LocalDate.now();

        Report report = reportRepository.findFirstByHospitalIdAndReportDateOrderByIdDesc(hospitalId, today)
                .orElseGet(Report::new);

        report.setHospitalId(hospitalId);
        report.setReportDate(today);
        report.setTotalPatients(totalPatients);
        report.setTotalDoctors(totalDoctors);
        report.setTotalAppointments(totalAppointments);
        report.setTotalBills(totalBills);
        report.setTotalPayments(totalPayments);
        report.setTotalRevenue(totalRevenue);
        report.setPendingRevenue(pendingRevenue);

        Report saved = reportRepository.save(report);

        return map(saved);
    }

    @Override
    public ReportResponse getLatestHospitalReport(Long hospitalId) {

        return reportRepository.findFirstByHospitalIdOrderByReportDateDescIdDesc(hospitalId)
                .map(this::map)
                .orElseGet(() -> getHospitalScopedReport(hospitalId));
    }

    @Override
    public List<ReportResponse> getAllHospitalReports(Long hospitalId) {

        return reportRepository.findAllByHospitalIdOrderByReportDateDescIdDesc(hospitalId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    private ReportResponse map(Report report) {

        ReportResponse response = new ReportResponse();

        response.setId(report.getId());
        response.setReportDate(report.getReportDate());
        response.setHospitalId(report.getHospitalId());
        response.setTotalPatients(report.getTotalPatients());
        response.setTotalDoctors(report.getTotalDoctors());
        response.setTotalAppointments(report.getTotalAppointments());
        response.setTotalBills(report.getTotalBills());
        response.setTotalPayments(report.getTotalPayments());
        response.setTotalRevenue(report.getTotalRevenue());
        response.setPendingRevenue(report.getPendingRevenue());

        return response;
    }
}