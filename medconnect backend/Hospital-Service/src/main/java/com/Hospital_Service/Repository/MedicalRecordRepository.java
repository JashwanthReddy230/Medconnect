package com.Hospital_Service.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Hospital_Service.entity.MedicalRecord;

public interface MedicalRecordRepository
        extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientId(Long patientId);

    List<MedicalRecord> findByDoctorId(Long doctorId);

    List<MedicalRecord> findByAppointmentId(Long appointmentId);

}
