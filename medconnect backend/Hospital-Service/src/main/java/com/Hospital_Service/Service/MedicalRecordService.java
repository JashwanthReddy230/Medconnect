package com.Hospital_Service.Service;


import java.util.List;

import com.Hospital_Service.Dto.MedicalRecordRequest;
import com.Hospital_Service.Dto.MedicalRecordResponse;

public interface MedicalRecordService {

    MedicalRecordResponse createMedicalRecord(
            MedicalRecordRequest request);

    MedicalRecordResponse updateMedicalRecord(
            Long id,
            MedicalRecordRequest request);

    MedicalRecordResponse getMedicalRecordById(Long id);

    List<MedicalRecordResponse> getMedicalRecordsByPatient(
            Long patientId);
}
