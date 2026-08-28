package com.Hospital_Service.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Hospital_Service.Dto.MedicalRecordRequest;
import com.Hospital_Service.Dto.MedicalRecordResponse;
import com.Hospital_Service.Service.MedicalRecordService;

@RestController
@RequestMapping("/medical-record")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService medicalRecordService;

    // Create Medical Record
    @PostMapping
    public ResponseEntity<MedicalRecordResponse> createMedicalRecord(
            @RequestBody MedicalRecordRequest request) {

        return new ResponseEntity<>(
                medicalRecordService.createMedicalRecord(request),
                HttpStatus.CREATED);
    }

    // Get Medical Record By Id
    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecordResponse> getMedicalRecordById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                medicalRecordService.getMedicalRecordById(id));
    }

    // Get Medical Records By Patient
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecordResponse>> getMedicalRecordsByPatient(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                medicalRecordService.getMedicalRecordsByPatient(patientId));
    }

    // Update Medical Record
    @PutMapping("/{id}")
    public ResponseEntity<MedicalRecordResponse> updateMedicalRecord(
            @PathVariable Long id,
            @RequestBody MedicalRecordRequest request) {

        return ResponseEntity.ok(
                medicalRecordService.updateMedicalRecord(id, request));
    }
}
