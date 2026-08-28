package com.Hospital_Service.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.Hospital_Service.Dto.BillRequest;
import com.Hospital_Service.Dto.BillResponse;
import com.Hospital_Service.Service.BillService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/billing")
@RequiredArgsConstructor
public class BillController {

    private final BillService service;

    @PostMapping("/generate")
    public ResponseEntity<BillResponse> generateBill(
            @RequestBody BillRequest request) {

        return ResponseEntity.ok(service.generateBill(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BillResponse> getBill(@PathVariable Long id) {

        return ResponseEntity.ok(service.getBill(id));
    }

    @GetMapping
    public ResponseEntity<List<BillResponse>> getBills() {

        return ResponseEntity.ok(service.getAllBills());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<BillResponse>> getBillsByPatient(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(service.getBillsByPatient(patientId));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<BillResponse> getBillByAppointment(
            @PathVariable Long appointmentId) {

        return ResponseEntity.ok(service.getBillByAppointment(appointmentId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBill(@PathVariable Long id) {

        service.deleteBill(id);

        return ResponseEntity.ok("Bill Deleted Successfully");
    }
}