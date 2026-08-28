package com.Hospital_Service.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Hospital_Service.entity.Invoice;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long>{
	Optional<Invoice>findByInvoiceNumber(String invoiceNumber);
	List<Invoice>findBypatientId(Long patientId);
	Optional<Invoice>findByBillId(Long billId);

}