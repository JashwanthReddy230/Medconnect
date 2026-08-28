package com.Hospital_Service.Service;

import java.util.List;

import com.Hospital_Service.Dto.PaymentRequest;
import com.Hospital_Service.Dto.PaymentResponse;

public interface PaymentService {

    PaymentResponse makePayment(PaymentRequest request);

    PaymentResponse getPayment(Long id);

    List<PaymentResponse> getAllPayments();

    List<PaymentResponse> getPaymentsByPatient(Long patientId);

    void deletePayment(Long id);

}