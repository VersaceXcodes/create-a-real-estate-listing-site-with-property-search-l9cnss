import React, { useEffect } from "react";
import { useAppStore } from "@/store/main";

interface INotification {
  type: string;    // e.g., "success", "error", "info"
  message: string;
}

// Inline child component to render each notification with auto-dismiss logic
const NotificationItem: React.FC<{
  notification: INotification;
  index: number;
  onDismiss: (index: number) => void;
}> = ({ notification, index, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(index);
    }, 5000); // auto-dismiss after 5 seconds
    return () => {
      clearTimeout(timer);
    };
  }, [index, onDismiss]);
  
  // Determine CSS classes based on notification type
  const bgClass =
    notification.type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : notification.type === "error"
      ? "bg-red-100 border-red-400 text-red-700"
      : "bg-blue-100 border-blue-400 text-blue-700";
      
  return (
    <div className={`p-4 mb-2 rounded border ${bgClass} shadow-md`}>
      <div className="flex justify-between items-center">
        <p className="text-sm">{notification.message}</p>
        <button
          onClick={() => onDismiss(index)}
          className="ml-4 text-xl leading-none focus:outline-none"
          aria-label="Dismiss notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

const GV_Notification: React.FC = () => {
  // Access the global notification state and removal action from Zustand store
  const notifications = useAppStore(
    (state) => state.notification_state.notifications
  );
  const remove_notification = useAppStore(
    (state) => state.remove_notification
  );

  return (
    <>
      {notifications.length > 0 && (
        <div className="w-full px-4 mt-2">
          {notifications.map((notif, index) => (
            <NotificationItem
              key={index}
              notification={notif}
              index={index}
              onDismiss={remove_notification}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default GV_Notification;