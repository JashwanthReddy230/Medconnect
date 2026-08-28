package com.Hospital_Service.Repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Hospital_Service.entity.Appointment;
import com.Hospital_Service.enums.AppointmentStatus;
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long>{
List<Appointment>findByDoctorId(long DoctorId);
List<Appointment>findByPatientId(long PatientId);
List<Appointment>findByHospitalId(long HospitalId);
List<Appointment>findByAppointmentDate(LocalDate AppointmentDate);
List<Appointment>findByStatus(AppointmentStatus status);
}
