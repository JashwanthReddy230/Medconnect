package com.Hospital_Service.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Hospital_Service.entity.Hospital;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    Optional<Hospital> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Hospital> findByPhone(String phone);

    boolean existsByPhone(String phone);
}