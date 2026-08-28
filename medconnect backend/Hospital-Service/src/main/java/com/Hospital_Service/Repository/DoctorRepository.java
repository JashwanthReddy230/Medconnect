package com.Hospital_Service.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Hospital_Service.entity.Doctor;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Doctor> findByMobile(String mobile);

    boolean existsByMobile(String mobile);

    Page<Doctor> findByDoctorNameContainingIgnoreCase(
            String doctorName,
            Pageable pageable);

    List<Doctor> findByHospital_Id(Long hospitalId);
}