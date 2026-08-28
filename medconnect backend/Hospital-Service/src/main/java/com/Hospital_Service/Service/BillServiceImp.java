package com.Hospital_Service.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.Hospital_Service.Dto.BillRequest;
import com.Hospital_Service.Dto.BillResponse;
import com.Hospital_Service.Repository.BillRepository;
import com.Hospital_Service.entity.Bill;

@Service
public class BillServiceImp implements BillService {

    @Autowired
    private BillRepository repository;

    @Autowired
    private NotificationService notificationService;

    @Override
    @Transactional
    public BillResponse generateBill(BillRequest request) {

        Optional<Bill> existing = repository.findByAppointmentId(request.getAppointmentId());
        boolean isNewBill = existing.isEmpty();
        Bill bill = existing.orElseGet(Bill::new);

        bill.setAppointmentId(request.getAppointmentId());
        bill.setPatientId(request.getPatientId());
        bill.setDoctorId(request.getDoctorId());
        bill.setConsultationFee(request.getConsultationFee());
        bill.setMedicineFee(request.getMedicineFee());
        bill.setLaboratoryFee(request.getLaboratoryFee());
        bill.setDiscount(request.getDiscount());

        double subtotal =
                (request.getConsultationFee() != null ? request.getConsultationFee() : 0.0)
                + (request.getMedicineFee() != null ? request.getMedicineFee() : 0.0)
                + (request.getLaboratoryFee() != null ? request.getLaboratoryFee() : 0.0)
                - (request.getDiscount() != null ? request.getDiscount() : 0.0);

        double gst = subtotal * 0.18;
        double total = subtotal + gst;

        bill.setTax(gst);
        bill.setTotalAmount(total);
        if (bill.getPaymentStatus() == null) {
            bill.setPaymentStatus("PENDING");
        }
        if (bill.getBillDate() == null) {
            bill.setBillDate(LocalDate.now());
        }

        Bill saved = repository.save(bill);

        if (saved.getBillNumber() == null || saved.getBillNumber().isEmpty()) {
            saved.setBillNumber("BILL" + String.format("%06d", saved.getId()));
            saved = repository.save(saved);
        }

        // Notify the patient (once) that the appointment is complete and the bill is ready.
        if (isNewBill) {
            notificationService.createBillReadyNotification(
                    saved.getPatientId(), saved.getAppointmentId(), saved.getId(), null);
        }

        return map(saved);
    }

    @Override
    public BillResponse getBill(Long id) {

        Bill bill = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill Not Found"));

        return map(bill);
    }

    @Override
    public BillResponse getBillByAppointment(Long appointmentId) {

        Bill bill = repository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new RuntimeException("Bill Not Found For Appointment"));

        return map(bill);
    }

    @Override
    public List<BillResponse> getAllBills() {

        return repository.findAll()
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public List<BillResponse> getBillsByPatient(Long patientId) {

        return repository.findByPatientId(patientId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteBill(Long id) {

        Bill bill = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill Not Found"));

        repository.delete(bill);
    }

    private BillResponse map(Bill bill) {

        BillResponse response = new BillResponse();

        response.setId(bill.getId());
        response.setBillNumber(bill.getBillNumber());
        response.setAppointmentId(bill.getAppointmentId());
        response.setPatientId(bill.getPatientId());
        response.setDoctorId(bill.getDoctorId());
        response.setConsultationFee(bill.getConsultationFee());
        response.setMedicineFee(bill.getMedicineFee());
        response.setLaboratoryFee(bill.getLaboratoryFee());
        response.setDiscount(bill.getDiscount());
        response.setTax(bill.getTax());
        response.setTotalAmount(bill.getTotalAmount());
        response.setPaymentStatus(bill.getPaymentStatus());
        response.setBillDate(bill.getBillDate());

        return response;
    }
}