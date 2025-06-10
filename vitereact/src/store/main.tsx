import create from "zustand";
import { persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import axios from "axios";

// Define interfaces for the global state types

export interface IAuthState {
  user_id: string;
  token: string;
  role: string; // Expected values: "seeker", "agent", "admin"
}

export interface INotification {
  type: string;    // e.g., "success", "error", "info"
  message: string;
}

export interface INotificationState {
  notifications: INotification[];
}

export interface IGlobalLayoutState {
  current_view: string;
  device_type: string; // "mobile" or "desktop"
}

export interface ISearchFilterState {
  current_filters: Record<string, any>;
}

export interface IAppStore {
  // Global States
  auth_state: IAuthState;
  notification_state: INotificationState;
  global_layout_state: IGlobalLayoutState;
  search_filter_state: ISearchFilterState;
  socket: Socket | null;
  // Actions
  set_auth_state: (payload: IAuthState) => void;
  clear_auth_state: () => void;
  add_notification: (notification: INotification) => void;
  remove_notification: (index: number) => void;
  clear_notifications: () => void;
  set_global_layout_state: (payload: IGlobalLayoutState) => void;
  set_search_filter_state: (payload: ISearchFilterState) => void;
  connect_socket: () => Promise<void>;
  disconnect_socket: () => Promise<void>;
}

export const useAppStore = create<IAppStore>()(
  persist(
    (set, get) => ({
      // Initialize global state variables
      auth_state: {
        user_id: "",
        token: "",
        role: ""
      },
      notification_state: {
        notifications: []
      },
      global_layout_state: {
        current_view: "",
        device_type: "desktop"
      },
      search_filter_state: {
        current_filters: {}
      },
      socket: null,

      // Action to update auth state
      set_auth_state: (payload: IAuthState) =>
        set(() => ({ auth_state: payload })),
      
      // Action to clear auth state (logout)
      clear_auth_state: () =>
        set(() => ({ auth_state: { user_id: "", token: "", role: "" } })),

      // Notification actions
      add_notification: (notification: INotification) =>
        set((state) => ({
          notification_state: {
            notifications: [...state.notification_state.notifications, notification]
          }
        })),
      
      remove_notification: (index: number) =>
        set((state) => {
          const new_notifications = [...state.notification_state.notifications];
          new_notifications.splice(index, 1);
          return { notification_state: { notifications: new_notifications } };
        }),
      
      clear_notifications: () =>
        set(() => ({ notification_state: { notifications: [] } })),

      // Global layout state update
      set_global_layout_state: (payload: IGlobalLayoutState) =>
        set(() => ({ global_layout_state: payload })),
      
      // Search filter state update
      set_search_filter_state: (payload: ISearchFilterState) =>
        set(() => ({ search_filter_state: payload })),

      // Real-time socket connection actions
      
      // Connect to socket using token from auth_state (if available)
      connect_socket: async () => {
        if (get().socket) return; // Socket already connected
        const base_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
        const token = get().auth_state.token;
        const new_socket: Socket = io(base_url, { auth: { token } });
        set(() => ({ socket: new_socket }));
        new_socket.on("connect", () => {
          console.log("Socket connected:", new_socket.id);
        });
        new_socket.on("disconnect", () => {
          console.log("Socket disconnected");
        });
      },

      // Disconnect the socket connection if exists
      disconnect_socket: async () => {
        const current_socket = get().socket;
        if (current_socket) {
          current_socket.disconnect();
          set(() => ({ socket: null }));
        }
      }
    }),
    {
      name: "estatefinder-store", // name of item in storage
      // Partialize the state that should be persisted while excluding non-serializable items like socket and functions.
      partialize: (state) => ({
        auth_state: state.auth_state,
        notification_state: state.notification_state,
        global_layout_state: state.global_layout_state,
        search_filter_state: state.search_filter_state
      })
    }
  )
);