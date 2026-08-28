package com.Hospital_Service.Repository;



import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Hospital_Service.entity.Payment;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long>{

    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByBill_Id(Long billId);

    List<Payment> findByBill_PatientId(Long patientId);

    List<Payment> findByBill_DoctorId(Long doctorId);

    List<Payment> findByBill_DoctorIdIn(List<Long> doctorIds);

}