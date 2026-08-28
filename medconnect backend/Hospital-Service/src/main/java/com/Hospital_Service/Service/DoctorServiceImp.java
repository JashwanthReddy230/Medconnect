package com.Hospital_Service.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.DoctorRequest;
import com.Hospital_Service.Dto.DoctorResponse;
import com.Hospital_Service.Repository.DoctorRepository;
import com.Hospital_Service.Repository.HospitalRepository;
import com.Hospital_Service.entity.Doctor;
import com.Hospital_Service.entity.Hospital;

@Service
public class DoctorServiceImp implements DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Override
    public DoctorResponse createDoctor(DoctorRequest request) {

        if (doctorRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Doctor email already exists");
        }

        if (doctorRepository.existsByMobile(request.getMobile())) {
            throw new RuntimeException("Doctor mobile already exists");
        }

        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        Doctor doctor = new Doctor();

        doctor.setDoctorName(request.getDoctorName());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualification(request.getQualification());
        doctor.setExperience(request.getExperience());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setEmail(request.getEmail());
        doctor.setMobile(request.getMobile());
        doctor.setHospital(hospital);
        doctor.setStatus("ACTIVE");

        Doctor savedDoctor = doctorRepository.save(doctor);

        return mapToResponse(savedDoctor);
    }

    @Override
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {

        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        doctor.setDoctorName(request.getDoctorName());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualification(request.getQualification());
        doctor.setExperience(request.getExperience());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setEmail(request.getEmail());
        doctor.setMobile(request.getMobile());
        doctor.setHospital(hospital);

        Doctor updatedDoctor = doctorRepository.save(doctor);

        return mapToResponse(updatedDoctor);
    }

    @Override
    public DoctorResponse getDoctorById(Long id) {

        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        return mapToResponse(doctor);
    }

    @Override
    public List<DoctorResponse> getAllDoctors() {

        return doctorRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteDoctor(Long id) {

        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        doctorRepository.delete(doctor);
    }

    @Override
    public DoctorResponse activateDoctor(Long id) {

        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        doctor.setStatus("ACTIVE");

        return mapToResponse(doctorRepository.save(doctor));
    }

    @Override
    public DoctorResponse deactivateDoctor(Long id) {

        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        doctor.setStatus("INACTIVE");

        return mapToResponse(doctorRepository.save(doctor));
    }

    @Override
    public Page<DoctorResponse> searchDoctor(
            String doctorName,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);

        return doctorRepository
                .findByDoctorNameContainingIgnoreCase(
                        doctorName,
                        pageable)
                .map(this::mapToResponse);
    }

    @Override
    public List<DoctorResponse> getDoctorsByHospital(Long hospitalId) {

        return doctorRepository.findByHospital_Id(hospitalId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private DoctorResponse mapToResponse(Doctor doctor) {

        DoctorResponse response = new DoctorResponse();

        response.setId(doctor.getId());
        response.setDoctorName(doctor.getDoctorName());
        response.setSpecialization(doctor.getSpecialization());
        response.setConsultationFee(doctor.getConsultationFee());
        response.setQualification(doctor.getQualification());
        response.setExperience(doctor.getExperience());
        response.setEmail(doctor.getEmail());
        response.setMobile(doctor.getMobile());
        response.setStatus(doctor.getStatus());

        if (doctor.getHospital() != null) {
            response.setHospitalId(doctor.getHospital().getId());
        }

        return response;
    }
}