package com.Hospital_Service.Service;



import java.util.List;

import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.AppointmentRequest;
import com.Hospital_Service.Dto.AppointmentResponse;


@Service
public interface AppointmentService {

    AppointmentResponse bookAppointment(AppointmentRequest request);

    AppointmentResponse updateAppointment(Long id, AppointmentRequest request);

    AppointmentResponse cancelAppointment(Long id);

    AppointmentResponse completeAppointment(Long id);

    AppointmentResponse confirmAppointment(Long id);

    AppointmentResponse getAppointmentById(Long id);

   
    List<AppointmentResponse> getAllAppointments();

  
    List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId);

    
    List<AppointmentResponse> getAppointmentsByPatient(Long patientId);

  
    List<AppointmentResponse> getAppointmentsByHospital(Long hospitalId);

   
    List<AppointmentResponse> getTodayAppointments();

}
