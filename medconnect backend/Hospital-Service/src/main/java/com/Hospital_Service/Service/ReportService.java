package com.Hospital_Service.Service;

import java.util.List;

import com.Hospital_Service.Dto.ReportResponse;

public interface ReportService {

    // ── Admin: platform-wide, across ALL hospitals/doctors/patients ───────────
    ReportResponse getHospitalReport();

    ReportResponse getLatestReport();

    List<ReportResponse> getAllReports();

    // ── Hospital: scoped to one hospital's own doctors/patients/appointments ──
    ReportResponse getHospitalScopedReport(Long hospitalId);

    ReportResponse getLatestHospitalReport(Long hospitalId);

    List<ReportResponse> getAllHospitalReports(Long hospitalId);

}