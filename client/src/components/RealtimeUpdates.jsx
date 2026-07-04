import { useEffect } from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { API_BASE_URL } from "../api/api.js";
import { useAuth } from "../context/useAuth.js";

const getHubUrl = () =>
  API_BASE_URL.replace(/\/api\/?$/i, "") + "/hubs/cloudstay";

function RealtimeUpdates() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return undefined;

    let disposed = false;
    let retryTimer = null;
    const connection = new HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("DataChanged", (change) => {
      window.dispatchEvent(
        new CustomEvent("cloudstay:data-changed", { detail: change }),
      );
    });

    const startConnection = async () => {
      try {
        await connection.start();
        if (disposed && connection.state !== HubConnectionState.Disconnected) {
          await connection.stop();
        }
      } catch (error) {
        if (!disposed) {
          console.warn("CloudStay live updates are temporarily unavailable.", error);
          retryTimer = window.setTimeout(startConnection, 5000);
        }
      }
    };

    startConnection();

    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      connection.off("DataChanged");
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop().catch(() => {});
      }
    };
  }, [token, user]);

  return null;
}

export default RealtimeUpdates;
