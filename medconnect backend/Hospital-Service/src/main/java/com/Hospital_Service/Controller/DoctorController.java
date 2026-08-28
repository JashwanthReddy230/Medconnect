package com.Hospital_Service.Controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
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

import com.Hospital_Service.Dto.DoctorRequest;
import com.Hospital_Service.Dto.DoctorResponse;
import com.Hospital_Service.Service.DoctorService;

	@RestController
	@RequestMapping("/doctor")
	public class DoctorController {

	    @Autowired
	    private DoctorService doctorService;

	    
	    @PostMapping
	    public ResponseEntity<DoctorResponse> createDoctor(
	            @RequestBody DoctorRequest request) {

	        DoctorResponse response = doctorService.createDoctor(request);

	        return new ResponseEntity<>(response, HttpStatus.CREATED);
	    }

	    
	    @GetMapping
	    public ResponseEntity<List<DoctorResponse>> getAllDoctors() {

	        return ResponseEntity.ok(
	                doctorService.getAllDoctors());
	    }

	  
	    @GetMapping("/{id}")
	    public ResponseEntity<DoctorResponse> getDoctorById(
	            @PathVariable Long id) {

	        return ResponseEntity.ok(
	                doctorService.getDoctorById(id));
	    }

	   
	    @PutMapping("/{id}")
	    public ResponseEntity<DoctorResponse> updateDoctor(
	            @PathVariable Long id,
	            @RequestBody DoctorRequest request) {

	        return ResponseEntity.ok(
	                doctorService.updateDoctor(id, request));
	    }

	   
	    @DeleteMapping("/{id}")
	    public ResponseEntity<String> deleteDoctor(
	            @PathVariable Long id) {

	        doctorService.deleteDoctor(id);

	        return ResponseEntity.ok(
	                "Doctor deleted successfully");
	    }

	   
	    @PutMapping("/{id}/activate")
	    public ResponseEntity<DoctorResponse> activateDoctor(
	            @PathVariable Long id) {

	        return ResponseEntity.ok(
	                doctorService.activateDoctor(id));
	    }

	 
	    @PutMapping("/{id}/deactivate")
	    public ResponseEntity<DoctorResponse> deactivateDoctor(
	            @PathVariable Long id) {

	        return ResponseEntity.ok(
	                doctorService.deactivateDoctor(id));
	    }

	    
	    @GetMapping("/search")
	    public ResponseEntity<Page<DoctorResponse>> searchDoctor(
	            @RequestParam String doctorName,
	            @RequestParam(defaultValue = "0") int page,
	            @RequestParam(defaultValue = "5") int size) {

	        return ResponseEntity.ok(
	                doctorService.searchDoctor(
	                        doctorName,
	                        page,
	                        size));
	    }

	    
	    @GetMapping("/hospital/{hospitalId}")
	    public ResponseEntity<List<DoctorResponse>> getDoctorsByHospital(
	            @PathVariable Long hospitalId) {

	        return ResponseEntity.ok(
	                doctorService.getDoctorsByHospital(hospitalId));
	    }
	
}
