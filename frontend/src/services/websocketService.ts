import type { AppDispatch } from '../app/store';
import {
  addNotification,
  setWsConnected,
  type NotificationItem,
} from '../features/notification/notificationSlice';

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8080';

const websocketBaseUrl = apiBaseUrl.replace(/^http/, 'ws');

class WebSocketService {
  private socket: WebSocket | null = null;
  private dispatch: AppDispatch | null = null;
  private token: string | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private intentionallyClosed = false;

  connect(token: string, dispatch: AppDispatch) {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.token === token) {
      return;
    }

    this.disconnect();
    this.token = token;
    this.dispatch = dispatch;
    this.intentionallyClosed = false;
    this.openSocket();
  }

  disconnect() {
    this.intentionallyClosed = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.dispatch?.(setWsConnected(false));
    this.socket?.close();
    this.socket = null;
  }

  private openSocket() {
    if (!this.token) {
      return;
    }

    const socket = new WebSocket(`${websocketBaseUrl}/ws?token=${encodeURIComponent(this.token)}`);
    this.socket = socket;

    socket.onopen = () => {
      this.sendFrame('CONNECT', {
        'accept-version': '1.2',
        'heart-beat': '10000,10000',
        host: window.location.host,
      });
    };

    socket.onmessage = (event) => {
      this.handleFrame(String(event.data));
    };

    socket.onclose = () => {
      this.dispatch?.(setWsConnected(false));
      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  private handleFrame(rawData: string) {
    rawData
      .split('\0')
      .map((frame) => frame.trim())
      .filter(Boolean)
      .forEach((frame) => {
        const separatorIndex = frame.indexOf('\n\n');
        const command = frame.split('\n', 1)[0];
        const body = separatorIndex >= 0 ? frame.slice(separatorIndex + 2) : '';

        if (command === 'CONNECTED') {
          this.reconnectAttempts = 0;
          this.dispatch?.(setWsConnected(true));
          this.sendFrame('SUBSCRIBE', {
            id: 'notifications',
            destination: '/user/queue/notifications',
          });
        }

        if (command === 'MESSAGE' && body) {
          const notification = JSON.parse(body) as NotificationItem;
          this.dispatch?.(addNotification(notification));
        }
      });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) {
      return;
    }

    const delay = Math.min(30000, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private sendFrame(command: string, headers: Record<string, string>) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
    this.socket.send(`${command}\n${headerLines.join('\n')}\n\n\0`);
  }
}

export const websocketService = new WebSocketService();
