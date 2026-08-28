package com.Hospital_Service.Service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.DoctorRequest;
import com.Hospital_Service.Dto.DoctorResponse;
@Service
public interface DoctorService {
	

	DoctorResponse createDoctor(DoctorRequest request);

    DoctorResponse updateDoctor(Long id, DoctorRequest request);

    DoctorResponse getDoctorById(Long id);

    List<DoctorResponse> getAllDoctors();

    void deleteDoctor(Long id);

    DoctorResponse activateDoctor(Long id);

    DoctorResponse deactivateDoctor(Long id);

    Page<DoctorResponse> searchDoctor(
            String doctorName,
            int page,
            int size);

    List<DoctorResponse> getDoctorsByHospital(Long hospitalId);
	}
