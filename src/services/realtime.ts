// PROFESSIONAL REALTIME SERVICE - Built for 100K+ users
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export class ProfessionalRealtimeService {
  private static instance: ProfessionalRealtimeService;
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {}

  public static getInstance(): ProfessionalRealtimeService {
    if (!ProfessionalRealtimeService.instance) {
      ProfessionalRealtimeService.instance = new ProfessionalRealtimeService();
    }
    return ProfessionalRealtimeService.instance;
  }

  // Subscribe to game with professional error handling
  public async subscribeToGame(
    gameId: string,
    onGameUpdate: (payload: any) => void,
    onPlayerUpdate: (payload: any) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      console.log(`🔗 [Realtime] Subscribing to game: ${gameId}`);

      const gameChannel = supabase
        .channel(`game-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameId}`,
          },
          (payload: any) => {
            console.log(`🎮 [Realtime] Game update:`, payload);
            onGameUpdate(payload);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `game_id=eq.${gameId}`,
          },
          (payload: any) => {
            console.log(`👥 [Realtime] Player update:`, payload);
            onPlayerUpdate(payload);
          }
        )
        .subscribe((status: string) => {
          console.log(`📡 [Realtime] Subscription status: ${status}`);

          if (status === "SUBSCRIBED") {
            this.reconnectAttempts.set(gameId, 0);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            this.handleReconnection(
              gameId,
              onGameUpdate,
              onPlayerUpdate,
              onError
            );
          }
        });

      this.channels.set(gameId, gameChannel);
    } catch (error) {
      console.error(`❌ [Realtime] Subscription error:`, error);
      onError?.(error);
    }
  }

  // Professional reconnection with exponential backoff
  private async handleReconnection(
    gameId: string,
    onGameUpdate: (payload: any) => void,
    onPlayerUpdate: (payload: any) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    const attempts = this.reconnectAttempts.get(gameId) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.error(
        `❌ [Realtime] Max reconnection attempts reached for game: ${gameId}`
      );
      onError?.(new Error("Max reconnection attempts reached"));
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts);
    console.log(
      `🔄 [Realtime] Reconnecting in ${delay}ms (attempt ${attempts + 1})`
    );

    this.reconnectAttempts.set(gameId, attempts + 1);

    setTimeout(async () => {
      try {
        await this.subscribeToGame(
          gameId,
          onGameUpdate,
          onPlayerUpdate,
          onError
        );
      } catch (error) {
        console.error(`❌ [Realtime] Reconnection failed:`, error);
        onError?.(error);
      }
    }, delay);
  }

  // Broadcast game event with professional error handling
  public async broadcastGameEvent(gameId: string, event: any): Promise<void> {
    try {
      console.log(`📡 [Realtime] Broadcasting event to game: ${gameId}`, event);

      const channel = this.channels.get(gameId);
      if (channel) {
        await channel.send({
          type: "broadcast",
          event: "game_event",
          payload: event,
        });
        console.log(`✅ [Realtime] Event broadcasted successfully`);
      } else {
        console.warn(`⚠️ [Realtime] No channel found for game: ${gameId}`);
      }
    } catch (error) {
      console.error(`❌ [Realtime] Broadcast error:`, error);
      // Retry broadcast after short delay
      setTimeout(() => {
        this.broadcastGameEvent(gameId, event);
      }, 1000);
    }
  }

  // Unsubscribe from game
  public unsubscribeFromGame(gameId: string): void {
    try {
      const channel = this.channels.get(gameId);
      if (channel) {
        console.log(`🔌 [Realtime] Unsubscribing from game: ${gameId}`);
        supabase.removeChannel(channel);
        this.channels.delete(gameId);
        this.reconnectAttempts.delete(gameId);
      }
    } catch (error) {
      console.error(`❌ [Realtime] Unsubscribe error:`, error);
    }
  }

  // Get connection status
  public getConnectionStatus(gameId: string): string {
    const channel = this.channels.get(gameId);
    return channel?.state || "DISCONNECTED";
  }

  // Cleanup all connections
  public cleanup(): void {
    console.log(`🧹 [Realtime] Cleaning up all connections`);
    this.channels.forEach((channel, gameId) => {
      this.unsubscribeFromGame(gameId);
    });
    this.channels.clear();
    this.reconnectAttempts.clear();
  }
}

// Export singleton instance
export const realtimeService = ProfessionalRealtimeService.getInstance();
