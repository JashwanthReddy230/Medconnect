package com.Hospital_Service.Controller;



import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.Hospital_Service.Dto.AppointmentRequest;
import com.Hospital_Service.Dto.AppointmentResponse;
import com.Hospital_Service.Service.AppointmentService;



@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponse> bookAppointment(
            @RequestBody AppointmentRequest request) {

        return new ResponseEntity<>(
                appointmentService.bookAppointment(request),
                HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments() {

        return ResponseEntity.ok(
                appointmentService.getAllAppointments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable Long id,
            @RequestBody AppointmentRequest request) {

        return ResponseEntity.ok(
                appointmentService.updateAppointment(id, request));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                appointmentService.cancelAppointment(id));
    }

  
    @PutMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                appointmentService.completeAppointment(id));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<AppointmentResponse> confirmAppointment(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                appointmentService.confirmAppointment(id));
    }


   
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByDoctor(
            @PathVariable Long doctorId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByDoctor(doctorId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByPatient(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByPatient(patientId));
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByHospital(
            @PathVariable Long hospitalId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByHospital(hospitalId));
    }

    @GetMapping("/today")
    public ResponseEntity<List<AppointmentResponse>> getTodayAppointments() {

        return ResponseEntity.ok(
                appointmentService.getTodayAppointments());
    }

}