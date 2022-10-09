import { Server as WebsocketServer } from "ws";
import { IncomingMessage, Server as HttpServer } from "http";
import stream from "stream";

export type SignalingServerConfig = {
  httpServer: HttpServer;
  isAuthorized: (request: IncomingMessage) => Promise<boolean> | boolean;
};

export class SignalingServer {
  private readonly websocketServer: WebsocketServer;

  constructor(private readonly config: SignalingServerConfig) {
    this.websocketServer = new WebsocketServer({ noServer: true });

    this.config.httpServer.on("upgrade", this.onProtocolUpgrade.bind(this));
    this.websocketServer.on("connection", this.onSocketConnection.bind(this));
  }

  private async onProtocolUpgrade(
    request: IncomingMessage,
    socket: stream.Duplex,
    upgradeHead: Buffer
  ) {
    if (!(await this.config.isAuthorized(request))) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    this.websocketServer.handleUpgrade(
      request,
      socket,
      upgradeHead,
      (websocket) => {
        this.websocketServer.emit("connection", websocket, request);
      }
    );
  }

  private onSocketConnection() {}
}
