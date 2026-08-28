package com.Hospital_Service.Service;

import java.util.List;

import com.Hospital_Service.Dto.BillRequest;
import com.Hospital_Service.Dto.BillResponse;

public interface BillService {

    BillResponse generateBill(BillRequest request);

    BillResponse getBill(Long id);

    BillResponse getBillByAppointment(Long appointmentId);

    List<BillResponse> getAllBills();

    List<BillResponse> getBillsByPatient(Long patientId);

    void deleteBill(Long id);

}