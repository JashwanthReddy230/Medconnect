package com.Hospital_Service.Repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Hospital_Service.entity.Prescription;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    List<Prescription> findByMedicalRecordId(Long medicalRecordId);

}
