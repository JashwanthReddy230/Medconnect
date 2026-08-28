package com.Hospital_Service.Service;

import java.util.List;

import com.Hospital_Service.Dto.HospitalRequest;
import com.Hospital_Service.Dto.HospitalResponse;

public interface HospitalService {

    HospitalResponse createHospital(HospitalRequest request);

    HospitalResponse updateHospital(Long id, HospitalRequest request);

    List<HospitalResponse> getAllHospitals();

    HospitalResponse getHospitalById(Long id);

    void deleteHospital(Long id);

    void approveHospital(Long id);
}