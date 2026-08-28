package com.Hospital_Service.Service;



import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.AppointmentRequest;
import com.Hospital_Service.Dto.AppointmentResponse;
import com.Hospital_Service.Repository.AppointmentRepository;
import com.Hospital_Service.entity.Appointment;
import com.Hospital_Service.enums.AppointmentStatus;

@Service
public class AppointmentServiceImp implements AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Override
    public AppointmentResponse bookAppointment(AppointmentRequest request) {

        Appointment appointment = new Appointment();

        appointment.setAppointmentNumber(generateAppointmentNumber());
        appointment.setHospitalId(request.getHospitalId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setPatientId(request.getPatientId());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setReason(request.getReason());
        appointment.setStatus(AppointmentStatus.BOOKED);

        appointment = appointmentRepository.save(appointment);

        return mapToResponse(appointment);
    }

    @Override
    public AppointmentResponse updateAppointment(Long id, AppointmentRequest request) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setHospitalId(request.getHospitalId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setPatientId(request.getPatientId());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setReason(request.getReason());

        appointment = appointmentRepository.save(appointment);

        return mapToResponse(appointment);
    }

    @Override
    public AppointmentResponse cancelAppointment(Long id) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.CANCELLED);

        appointment = appointmentRepository.save(appointment);

        return mapToResponse(appointment);
    }

    @Override
    public AppointmentResponse completeAppointment(Long id) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.COMPLETED);

        appointment = appointmentRepository.save(appointment);

        return mapToResponse(appointment);
    }

    @Override
    public AppointmentResponse confirmAppointment(Long id) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.CONFIRMED);

        appointment = appointmentRepository.save(appointment);

        return mapToResponse(appointment);
    }


    @Override
    public AppointmentResponse getAppointmentById(Long id) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        return mapToResponse(appointment);
    }

    @Override
    public List<AppointmentResponse> getAllAppointments() {

        return appointmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId) {

        return appointmentRepository.findByDoctorId(doctorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getAppointmentsByPatient(Long patientId) {

        return appointmentRepository.findByPatientId(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getAppointmentsByHospital(Long hospitalId) {

        return appointmentRepository.findByHospitalId(hospitalId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getTodayAppointments() {

        return appointmentRepository.findByAppointmentDate(LocalDate.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

   
    private String generateAppointmentNumber() {
        return "APT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    
    private AppointmentResponse mapToResponse(Appointment appointment) {

        AppointmentResponse response = new AppointmentResponse();

        response.setId(appointment.getId());
        response.setAppointmentNumber(appointment.getAppointmentNumber());

       
        response.setPatientName("Patient-" + appointment.getPatientId());
        response.setDoctorName("Doctor-" + appointment.getDoctorId());
        response.setHospitalName("Hospital-" + appointment.getHospitalId());

        response.setPatientId(appointment.getPatientId());
        response.setDoctorId(appointment.getDoctorId());
        response.setHospitalId(appointment.getHospitalId());

        response.setAppointmentDate(appointment.getAppointmentDate());
        response.setAppointmentTime(appointment.getAppointmentTime());
        response.setStatus(appointment.getStatus());

        return response;
    }
}
