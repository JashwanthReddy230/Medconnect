package com.Hospital_Service.Service;

import java.util.List;

import com.Hospital_Service.Dto.InvoiceResponse;

public interface InvoiceService {
	InvoiceResponse generateInvoice(Long billId);

    InvoiceResponse getInvoice(Long id);

    InvoiceResponse getInvoiceByBill(Long billId);

    List<InvoiceResponse> getAllInvoices();

    List<InvoiceResponse> getInvoicesByPatient(Long patientId);

    void deleteInvoice(Long id);
}