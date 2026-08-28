package com.Hospital_Service.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.Hospital_Service.Dto.PatientRequest;
import com.Hospital_Service.Dto.PatientResponse;
import com.Hospital_Service.Service.PatientService;

@RestController
@RequestMapping("/patients")
public class PatientController {

    @Autowired
    private PatientService patientService;


    @PostMapping
    public ResponseEntity<PatientResponse> createPatient(
            @RequestBody PatientRequest request) {

        PatientResponse response = patientService.createPatient(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }


    @GetMapping
    public ResponseEntity<List<PatientResponse>> getAllPatients() {

        return ResponseEntity.ok(
                patientService.getAllPatients());
    }


    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getPatientById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                patientService.getPatientById(id));
    }


    @PutMapping("/{id}")
    public ResponseEntity<PatientResponse> updatePatient(
            @PathVariable Long id,
            @RequestBody PatientRequest request) {

        return ResponseEntity.ok(
                patientService.updatePatient(id, request));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePatient(
            @PathVariable Long id) {

        patientService.deletePatient(id);

        return ResponseEntity.ok(
                "Patient deleted successfully");
    }


    @PutMapping("/{id}/activate")
    public ResponseEntity<PatientResponse> activatePatient(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                patientService.activatePatient(id));
    }


    @PutMapping("/{id}/deactivate")
    public ResponseEntity<PatientResponse> deactivatePatient(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                patientService.deactivatePatient(id));
    }


    @GetMapping("/search")
    public ResponseEntity<Page<PatientResponse>> searchPatients(
            @RequestParam String firstName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        return ResponseEntity.ok(
                patientService.searchPatients(
                        firstName,
                        page,
                        size));
    }
}