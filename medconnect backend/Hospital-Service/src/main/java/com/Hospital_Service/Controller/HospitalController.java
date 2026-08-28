package com.Hospital_Service.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.Hospital_Service.Dto.HospitalRequest;
import com.Hospital_Service.Dto.HospitalResponse;
import com.Hospital_Service.Service.HospitalService;

@RestController
@RequestMapping("/hospital")
public class HospitalController {

    @Autowired
    private HospitalService hospitalService;

    
    @PostMapping
    public ResponseEntity<HospitalResponse> createHospital(
            @RequestBody HospitalRequest request) {

        HospitalResponse response = hospitalService.createHospital(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    
    @GetMapping
    public ResponseEntity<List<HospitalResponse>> getAllHospitals() {

        List<HospitalResponse> hospitals = hospitalService.getAllHospitals();

        return ResponseEntity.ok(hospitals);
    }

    
    @GetMapping("/{id}")
    public ResponseEntity<HospitalResponse> getHospitalById(
            @PathVariable Long id) {

        HospitalResponse response = hospitalService.getHospitalById(id);

        return ResponseEntity.ok(response);
    }

    
    @PutMapping("/{id}")
    public ResponseEntity<HospitalResponse> updateHospital(
            @PathVariable Long id,
            @RequestBody HospitalRequest request) {

        HospitalResponse response =
                hospitalService.updateHospital(id, request);

        return ResponseEntity.ok(response);
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteHospital(
            @PathVariable Long id) {

        hospitalService.deleteHospital(id);

        return ResponseEntity.ok("Hospital deleted successfully");
    }

    
    @PutMapping("/{id}/approve")
    public ResponseEntity<String> approveHospital(
            @PathVariable Long id) {

        hospitalService.approveHospital(id);

        return ResponseEntity.ok("Hospital approved successfully");
    }
}