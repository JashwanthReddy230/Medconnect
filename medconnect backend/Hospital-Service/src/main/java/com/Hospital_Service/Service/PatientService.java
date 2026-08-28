package com.Hospital_Service.Service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.PatientRequest;
import com.Hospital_Service.Dto.PatientResponse;

@Service
public interface PatientService {

    PatientResponse createPatient(PatientRequest request);

    PatientResponse updatePatient(Long id, PatientRequest request);

    PatientResponse getPatientById(Long id);

    List<PatientResponse> getAllPatients();

    void deletePatient(Long id);

    PatientResponse activatePatient(Long id);

    PatientResponse deactivatePatient(Long id);

    Page<PatientResponse> searchPatients(
            String firstName,
            int page,
            int size);
}