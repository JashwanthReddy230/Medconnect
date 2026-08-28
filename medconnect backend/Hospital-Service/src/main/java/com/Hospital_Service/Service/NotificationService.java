package com.Hospital_Service.Service;

import java.util.List;

import com.Hospital_Service.Dto.NotificationResponse;

public interface NotificationService {

	/**
	 * Creates a notification for a patient telling them that an appointment's
	 * bill is ready. Reused by BillService right after a Bill is persisted.
	 */
	NotificationResponse createBillReadyNotification(Long patientId, Long appointmentId, Long billId, String doctorLabel);

	List<NotificationResponse> getNotificationsForPatient(Long patientId, Integer limit);

	long getUnreadCount(Long patientId);

	NotificationResponse markRead(Long id);

	void markAllRead(Long patientId);

	void deleteNotification(Long id);
}