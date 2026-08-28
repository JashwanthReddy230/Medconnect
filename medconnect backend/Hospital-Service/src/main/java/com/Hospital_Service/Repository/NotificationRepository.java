package com.Hospital_Service.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Hospital_Service.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

	List<Notification> findByPatientIdOrderByCreatedAtDesc(Long patientId);

	long countByPatientIdAndIsReadFalse(Long patientId);

	List<Notification> findByPatientIdAndIsReadFalse(Long patientId);
}