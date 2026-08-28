package com.Hospital_Service.Service;


import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.HospitalRequest;
import com.Hospital_Service.Dto.HospitalResponse;
import com.Hospital_Service.Repository.HospitalRepository;
import com.Hospital_Service.Service.HospitalService;
import com.Hospital_Service.entity.Hospital;

@Service
public class HospitalServiceImpl implements HospitalService {

    @Autowired
    private HospitalRepository hospitalRepository;

    @Override
    public HospitalResponse createHospital(HospitalRequest request) {

        if (hospitalRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Hospital hospital = new Hospital();

        hospital.setHospitalName(request.getHospitalName());
        hospital.setEmail(request.getEmail());
        hospital.setPhone(request.getPhone());
        hospital.setAddress(request.getAddress());
        hospital.setCity(request.getCity());
        hospital.setState(request.getState());
        hospital.setPincode(request.getPincode());
        hospital.setRegistrationNumber(request.getRegistrationNumber());
        hospital.setStatus("PENDING");

        Hospital savedHospital = hospitalRepository.save(hospital);

        return mapToResponse(savedHospital);
    }

    @Override
    public HospitalResponse updateHospital(Long id, HospitalRequest request) {

        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        hospital.setHospitalName(request.getHospitalName());
        hospital.setEmail(request.getEmail());
        hospital.setPhone(request.getPhone());
        hospital.setAddress(request.getAddress());
        hospital.setCity(request.getCity());
        hospital.setState(request.getState());
        hospital.setPincode(request.getPincode());
        hospital.setRegistrationNumber(request.getRegistrationNumber());

        Hospital updatedHospital = hospitalRepository.save(hospital);

        return mapToResponse(updatedHospital);
    }

    @Override
    public List<HospitalResponse> getAllHospitals() {

        return hospitalRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public HospitalResponse getHospitalById(Long id) {

        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        return mapToResponse(hospital);
    }

    @Override
    public void deleteHospital(Long id) {

        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        hospitalRepository.delete(hospital);
    }

    @Override
    public void approveHospital(Long id) {

        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        hospital.setStatus("APPROVED");

        hospitalRepository.save(hospital);
    }

    private HospitalResponse mapToResponse(Hospital hospital) {

        HospitalResponse response = new HospitalResponse();

        response.setId(hospital.getId());
        response.setHospitalName(hospital.getHospitalName());
        response.setEmail(hospital.getEmail());
        response.setPhone(hospital.getPhone());
        response.setAddress(hospital.getAddress());
        response.setCity(hospital.getCity());
        response.setState(hospital.getState());
        response.setPincode(hospital.getPincode());
        response.setRegistrationNumber(hospital.getRegistrationNumber());
        response.setStatus(hospital.getStatus());

        return response;
    }
}