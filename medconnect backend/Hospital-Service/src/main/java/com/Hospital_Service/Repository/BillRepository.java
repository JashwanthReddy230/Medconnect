package com.Hospital_Service.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Hospital_Service.entity.Bill;

public interface BillRepository extends JpaRepository<Bill, Long> {
	Optional<Bill> findByBillNumber(String billNumber); 
	Optional<Bill> findByAppointmentId(Long appointmentId);
	List<Bill> findByPatientId(Long patientId); 
	List<Bill> findByDoctorId(Long doctorId); 
	List<Bill> findByPaymentStatus(String paymentStatus); 
	List<Bill> findByDoctorIdIn(List<Long> doctorIds);
	
}