package com.hms.www.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hms.www.entity.Otp;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {

	Optional<Otp> findTopByMobileOrderByCreatedAtDesc(String mobile);

}
