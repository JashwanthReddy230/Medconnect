package com.Hospital_Service.Service;


import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.PrescriptionRequest;
import com.Hospital_Service.Dto.PrescriptionResponse;
import com.Hospital_Service.Repository.PrescriptionRepository;
import com.Hospital_Service.entity.Prescription;

@Service
public class PrescriptionServiceImp implements PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Override
    public PrescriptionResponse createPrescription(PrescriptionRequest request) {

        Prescription prescription = new Prescription();

        prescription.setMedicalRecordId(request.getMedicalRecordId());
        prescription.setMedicineName(request.getMedicineName());
        prescription.setDosage(request.getDosage());
        prescription.setDuration(request.getDuration());
        prescription.setInstructions(request.getInstructions());

        prescription = prescriptionRepository.save(prescription);

        return mapToResponse(prescription);
    }

    @Override
    public List<PrescriptionResponse> getPrescriptionByMedicalRecord(Long medicalRecordId) {

        return prescriptionRepository.findByMedicalRecordId(medicalRecordId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Entity -> Response DTO
    private PrescriptionResponse mapToResponse(Prescription prescription) {

        PrescriptionResponse response = new PrescriptionResponse();

        response.setId(prescription.getId());
        response.setMedicalRecordId(prescription.getMedicalRecordId());
        response.setMedicineName(prescription.getMedicineName());
        response.setDosage(prescription.getDosage());
        response.setDuration(prescription.getDuration());
        response.setInstructions(prescription.getInstructions());

        return response;
    }
}
