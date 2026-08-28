package com.Hospital_Service.Service;


import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.MedicalRecordRequest;
import com.Hospital_Service.Dto.MedicalRecordResponse;
import com.Hospital_Service.Repository.MedicalRecordRepository;
import com.Hospital_Service.entity.MedicalRecord;

@Service
public class MedicalRecordServiceImpl implements MedicalRecordService {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Override
    public MedicalRecordResponse createMedicalRecord(MedicalRecordRequest request) {

        MedicalRecord medicalRecord = new MedicalRecord();

        medicalRecord.setAppointmentId(request.getAppointmentId());
        medicalRecord.setPatientId(request.getPatientId());
        medicalRecord.setDoctorId(request.getDoctorId());
        medicalRecord.setDiagnosis(request.getDiagnosis());
        medicalRecord.setSymptoms(request.getSymptoms());
        medicalRecord.setTreatment(request.getTreatment());
        medicalRecord.setDoctorNotes(request.getDoctorNotes());
        medicalRecord.setVisitDate(request.getVisitDate());

        medicalRecord = medicalRecordRepository.save(medicalRecord);

        return mapToResponse(medicalRecord);
    }

    @Override
    public MedicalRecordResponse updateMedicalRecord(Long id, MedicalRecordRequest request) {

        MedicalRecord medicalRecord = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical Record not found"));

        medicalRecord.setAppointmentId(request.getAppointmentId());
        medicalRecord.setPatientId(request.getPatientId());
        medicalRecord.setDoctorId(request.getDoctorId());
        medicalRecord.setDiagnosis(request.getDiagnosis());
        medicalRecord.setSymptoms(request.getSymptoms());
        medicalRecord.setTreatment(request.getTreatment());
        medicalRecord.setDoctorNotes(request.getDoctorNotes());
        medicalRecord.setVisitDate(request.getVisitDate());

        medicalRecord = medicalRecordRepository.save(medicalRecord);

        return mapToResponse(medicalRecord);
    }

    @Override
    public MedicalRecordResponse getMedicalRecordById(Long id) {

        MedicalRecord medicalRecord = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical Record not found"));

        return mapToResponse(medicalRecord);
    }

    @Override
    public List<MedicalRecordResponse> getMedicalRecordsByPatient(Long patientId) {

        return medicalRecordRepository.findByPatientId(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private MedicalRecordResponse mapToResponse(MedicalRecord medicalRecord) {

        MedicalRecordResponse response = new MedicalRecordResponse();

        response.setId(medicalRecord.getId());
        response.setAppointmentId(medicalRecord.getAppointmentId());
        response.setDoctorId(medicalRecord.getDoctorId());
        response.setPatientId(medicalRecord.getPatientId());

        // Replace these with Feign Client calls later
        response.setPatientName("Patient-" + medicalRecord.getPatientId());
        response.setDoctorName("Doctor-" + medicalRecord.getDoctorId());

        response.setDiagnosis(medicalRecord.getDiagnosis());
        response.setSymptoms(medicalRecord.getSymptoms());
        response.setTreatment(medicalRecord.getTreatment());
        response.setDoctorNotes(medicalRecord.getDoctorNotes());
        response.setVisitDate(medicalRecord.getVisitDate());

        return response;
    }
}
