import { Server as WebsocketServer } from "ws";
import { Server as HttpServer } from "http";

export type SignalingServerConfig = {
  server: HttpServer;
};

export class SignalingServer {
  private readonly websocketServer: WebsocketServer;

  constructor(config: SignalingServerConfig) {
    this.websocketServer = new WebsocketServer({ noServer: true });
  }
}
