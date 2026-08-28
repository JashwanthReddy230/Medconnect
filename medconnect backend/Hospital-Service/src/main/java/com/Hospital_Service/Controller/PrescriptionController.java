package com.Hospital_Service.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Hospital_Service.Dto.PrescriptionRequest;
import com.Hospital_Service.Dto.PrescriptionResponse;
import com.Hospital_Service.Service.PrescriptionService;

@RestController
@RequestMapping("/prescription")
public class PrescriptionController {

    @Autowired
    private PrescriptionService prescriptionService;

    // Create Prescription
    @PostMapping
    public ResponseEntity<PrescriptionResponse> createPrescription(
            @RequestBody PrescriptionRequest request) {

        PrescriptionResponse response =
                prescriptionService.createPrescription(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Get Prescriptions by Medical Record Id
    @GetMapping("/{medicalRecordId}")
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptionByMedicalRecord(
            @PathVariable Long medicalRecordId) {

        List<PrescriptionResponse> response =
                prescriptionService.getPrescriptionByMedicalRecord(medicalRecordId);

        return ResponseEntity.ok(response);
    }


}
