package com.Hospital_Service.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Hospital_Service.Dto.InvoiceResponse;
import com.Hospital_Service.Service.InvoiceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/invoice")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService service;

    @PostMapping("/generate/{billId}")
    public ResponseEntity<InvoiceResponse> generateInvoice(
            @PathVariable Long billId) {

        return ResponseEntity.ok(
                service.generateInvoice(billId)
        );
    }

    @GetMapping("/bill/{billId}")
    public ResponseEntity<InvoiceResponse> getInvoiceByBill(
            @PathVariable Long billId) {

        return ResponseEntity.ok(
                service.getInvoiceByBill(billId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoice(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                service.getInvoice(id)
        );
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {

        return ResponseEntity.ok(
                service.getAllInvoices()
        );
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByPatient(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                service.getInvoicesByPatient(patientId)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteInvoice(
            @PathVariable Long id) {

        service.deleteInvoice(id);

        return ResponseEntity.ok(
                "Invoice Deleted Successfully"
        );
    }
}