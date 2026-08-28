package com.Hospital_Service.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.PatientRequest;
import com.Hospital_Service.Dto.PatientResponse;
import com.Hospital_Service.Repository.PatientRepository;
import com.Hospital_Service.entity.Patient;

@Service
public class PatientServiceImp implements PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Override
    public PatientResponse createPatient(PatientRequest request) {

        Patient patient = new Patient();

        patient.setPatientCode("PAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setGender(request.getGender());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setMobile(request.getMobile());
        patient.setEmail(request.getEmail());
        patient.setAddress(request.getAddress());
        patient.setEmergencyContact(request.getEmergencyContact());
        patient.setAllergies(request.getAllergies());
        patient.setChronicConditions(request.getChronicConditions());
        patient.setPastSurgeries(request.getPastSurgeries());
        patient.setCurrentMedications(request.getCurrentMedications());
        patient.setStatus("ACTIVE");

        Patient savedPatient = patientRepository.save(patient);

        return mapToResponse(savedPatient);
    }

    @Override
    public PatientResponse updatePatient(Long id, PatientRequest request) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setGender(request.getGender());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setMobile(request.getMobile());
        patient.setEmail(request.getEmail());
        patient.setAddress(request.getAddress());
        patient.setEmergencyContact(request.getEmergencyContact());
        patient.setAllergies(request.getAllergies());
        patient.setChronicConditions(request.getChronicConditions());
        patient.setPastSurgeries(request.getPastSurgeries());
        patient.setCurrentMedications(request.getCurrentMedications());

        Patient updatedPatient = patientRepository.save(patient);

        return mapToResponse(updatedPatient);
    }

    @Override
    public PatientResponse getPatientById(Long id) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        return mapToResponse(patient);
    }

    @Override
    public List<PatientResponse> getAllPatients() {

        return patientRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deletePatient(Long id) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        patientRepository.delete(patient);
    }

    @Override
    public PatientResponse activatePatient(Long id) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        patient.setStatus("ACTIVE");

        return mapToResponse(patientRepository.save(patient));
    }

    @Override
    public PatientResponse deactivatePatient(Long id) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        patient.setStatus("INACTIVE");

        return mapToResponse(patientRepository.save(patient));
    }

    @Override
    public Page<PatientResponse> searchPatients(
            String firstName,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);

        return patientRepository
                .findByFirstNameContainingIgnoreCase(
                        firstName,
                        pageable)
                .map(this::mapToResponse);
    }

    private PatientResponse mapToResponse(Patient patient) {

        PatientResponse response = new PatientResponse();

        response.setId(patient.getId());
        response.setPatientCode(patient.getPatientCode());
        response.setFullName(patient.getFirstName() + " " + patient.getLastName());
        response.setGender(patient.getGender());
        response.setDateOfBirth(patient.getDateOfBirth());
        response.setBloodGroup(patient.getBloodGroup());
        response.setMobile(patient.getMobile());
        response.setEmail(patient.getEmail());
        response.setAddress(patient.getAddress());
        response.setEmergencyContact(patient.getEmergencyContact());
        response.setAllergies(patient.getAllergies());
        response.setChronicConditions(patient.getChronicConditions());
        response.setPastSurgeries(patient.getPastSurgeries());
        response.setCurrentMedications(patient.getCurrentMedications());
        response.setStatus(patient.getStatus());

        return response;
    }
}
