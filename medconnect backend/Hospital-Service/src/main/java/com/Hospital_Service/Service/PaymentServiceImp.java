package com.Hospital_Service.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.Hospital_Service.Dto.PaymentRequest;
import com.Hospital_Service.Dto.PaymentResponse;
import com.Hospital_Service.Repository.BillRepository;
import com.Hospital_Service.Repository.PaymentRepository;
import com.Hospital_Service.entity.Bill;
import com.Hospital_Service.entity.Payment;

@Service
public class PaymentServiceImp implements PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private InvoiceService invoiceService;

    @Override
    @Transactional
    public PaymentResponse makePayment(PaymentRequest request) {

        Bill bill = billRepository.findById(request.getBillId())
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        // Prevent duplicate payments for the same Bill.
        if ("PAID".equalsIgnoreCase(bill.getPaymentStatus())) {
            Payment existingPayment = paymentRepository.findByBill_Id(bill.getId())
                    .orElse(null);
            if (existingPayment != null) {
                return map(existingPayment);
            }
        }

        Payment payment = new Payment();

        payment.setBill(bill);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setPaymentDate(LocalDateTime.now());
        payment.setStatus("SUCCESS");

        Payment saved = paymentRepository.save(payment);

        saved.setTransactionId(
                "TXN" + String.format("%06d", saved.getId()));

        saved = paymentRepository.save(saved);

        // Update Bill Status
        bill.setPaymentStatus("PAID");
        billRepository.save(bill);

        // Auto-generate the Invoice for this Bill (idempotent — reuses existing invoice if present).
        invoiceService.generateInvoice(bill.getId());

        return map(saved);
    }

    @Override
    public PaymentResponse getPayment(Long id) {

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        return map(payment);
    }

    @Override
    public List<PaymentResponse> getAllPayments() {

        return paymentRepository.findAll()
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public List<PaymentResponse> getPaymentsByPatient(Long patientId) {

        return paymentRepository.findByBill_PatientId(patientId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public void deletePayment(Long id) {

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        paymentRepository.delete(payment);
    }

    private PaymentResponse map(Payment payment) {

        PaymentResponse response = new PaymentResponse();

        response.setId(payment.getId());
        response.setTransactionId(payment.getTransactionId());
        response.setAmount(payment.getAmount());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setStatus(payment.getStatus());
        response.setPaymentDate(payment.getPaymentDate());

        if (payment.getBill() != null) {
            response.setBillId(payment.getBill().getId());
            response.setPatientId(payment.getBill().getPatientId());
            response.setDoctorId(payment.getBill().getDoctorId());
            response.setAppointmentId(payment.getBill().getAppointmentId());
        }

        return response;
    }

}