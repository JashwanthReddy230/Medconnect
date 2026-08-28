package com.Hospital_Service.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.NotificationResponse;
import com.Hospital_Service.Repository.NotificationRepository;
import com.Hospital_Service.entity.Notification;

@Service
public class NotificationServiceImp implements NotificationService {

    @Autowired
    private NotificationRepository repository;

    @Override
    public NotificationResponse createBillReadyNotification(Long patientId, Long appointmentId, Long billId, String doctorLabel) {

        Notification notification = new Notification();
        notification.setPatientId(patientId);
        notification.setAppointmentId(appointmentId);
        notification.setBillId(billId);
        notification.setType("BILL_READY");
        notification.setTitle("Appointment Completed");
        notification.setMessage(
                "Your appointment" + (doctorLabel != null ? " with " + doctorLabel : "")
                        + " has been completed and your bill is ready. Tap View Bill to review and pay.");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = repository.save(notification);
        return map(saved);
    }

    @Override
    public List<NotificationResponse> getNotificationsForPatient(Long patientId, Integer limit) {

        List<Notification> notifications = repository.findByPatientIdOrderByCreatedAtDesc(patientId);

        return notifications.stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit != null && limit > 0 ? limit : Long.MAX_VALUE)
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(Long patientId) {
        return repository.countByPatientIdAndIsReadFalse(patientId);
    }

    @Override
    public NotificationResponse markRead(Long id) {

        Notification notification = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification Not Found"));

        notification.setRead(true);
        Notification saved = repository.save(notification);

        return map(saved);
    }

    @Override
    public void markAllRead(Long patientId) {

        List<Notification> unread = repository.findByPatientIdAndIsReadFalse(patientId);
        unread.forEach(n -> n.setRead(true));
        repository.saveAll(unread);
    }

    @Override
    public void deleteNotification(Long id) {
        repository.deleteById(id);
    }

    private NotificationResponse map(Notification n) {

        NotificationResponse response = new NotificationResponse();

        response.setId(n.getId());
        response.setPatientId(n.getPatientId());
        response.setAppointmentId(n.getAppointmentId());
        response.setBillId(n.getBillId());
        response.setType(n.getType());
        response.setTitle(n.getTitle());
        response.setMessage(n.getMessage());
        response.setIsRead(n.isRead());
        response.setCreatedAt(n.getCreatedAt());

        return response;
    }
}