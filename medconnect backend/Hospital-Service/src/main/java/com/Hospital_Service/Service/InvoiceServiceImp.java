package com.Hospital_Service.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.InvoiceResponse;
import com.Hospital_Service.Repository.BillRepository;
import com.Hospital_Service.Repository.InvoiceRepository;
import com.Hospital_Service.entity.Bill;
import com.Hospital_Service.entity.Invoice;

@Service
public class InvoiceServiceImp implements InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BillRepository billRepository;

    @Override
    public InvoiceResponse generateInvoice(Long billId) {

        // Prevent duplicate invoices for the same Bill — return the existing one if present.
        Optional<Invoice> existing = invoiceRepository.findByBillId(billId);
        if (existing.isPresent()) {
            Invoice current = existing.get();
            // Keep payment status in sync in case it changed since the invoice was first created.
            billRepository.findById(billId).ifPresent(b -> current.setPaymentStatus(b.getPaymentStatus()));
            return map(invoiceRepository.save(current));
        }

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill Not Found"));

        Invoice invoice = new Invoice();

        invoice.setBillId(bill.getId());
        invoice.setPatientId(bill.getPatientId());
        invoice.setDoctorId(bill.getDoctorId());
        invoice.setAmount(bill.getTotalAmount());
        invoice.setPaymentStatus(bill.getPaymentStatus());
        invoice.setInvoiceDate(LocalDate.now());

        Invoice saved = invoiceRepository.save(invoice);

        saved.setInvoiceNumber("INV" + String.format("%06d", saved.getId()));

        saved = invoiceRepository.save(saved);

        return map(saved);
    }

    @Override
    public InvoiceResponse getInvoiceByBill(Long billId) {

        Invoice invoice = invoiceRepository.findByBillId(billId)
                .orElseThrow(() -> new RuntimeException("Invoice Not Found For Bill"));

        return map(invoice);
    }

    @Override
    public InvoiceResponse getInvoice(Long id) {

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice Not Found"));

        return map(invoice);
    }

    @Override
    public List<InvoiceResponse> getAllInvoices() {

        return invoiceRepository.findAll()
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public List<InvoiceResponse> getInvoicesByPatient(Long patientId) {

        return invoiceRepository.findBypatientId(patientId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteInvoice(Long id) {

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice Not Found"));

        invoiceRepository.delete(invoice);
    }

    private InvoiceResponse map(Invoice invoice) {

        InvoiceResponse response = new InvoiceResponse();

        response.setId(invoice.getId());
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        response.setBillId(invoice.getBillId());
        response.setPatientId(invoice.getPatientId());
        response.setDoctorId(invoice.getDoctorId());
        response.setAmount(invoice.getAmount());
        response.setPaymentStatus(invoice.getPaymentStatus());
        response.setInvoiceDate(invoice.getInvoiceDate());

        return response;
    }
}