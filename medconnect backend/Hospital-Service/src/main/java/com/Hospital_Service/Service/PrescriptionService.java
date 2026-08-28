package com.Hospital_Service.Service;

import java.util.List;

import com.Hospital_Service.Dto.PrescriptionRequest;
import com.Hospital_Service.Dto.PrescriptionResponse;

public interface PrescriptionService {

    PrescriptionResponse createPrescription(PrescriptionRequest request);

    List<PrescriptionResponse> getPrescriptionByMedicalRecord(Long medicalRecordId);

}