import { Server as WebsocketServer } from "ws";
import { IncomingMessage, Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import stream from "stream";

export type SignalingServerConfig<
  TRequest extends IncomingMessage = IncomingMessage
> = {
  server: HttpServer | HttpsServer;
  isAuthorized?: (request: TRequest) => Promise<boolean> | boolean;
};

export class SignalingServer<
  TRequest extends IncomingMessage = IncomingMessage
> {
  private readonly websocketServer: WebsocketServer;

  constructor(private readonly config: SignalingServerConfig<TRequest>) {
    this.websocketServer = new WebsocketServer({ noServer: true });

    this.config.server.on("upgrade", this.onProtocolUpgrade.bind(this));
    this.websocketServer.on("connection", this.onSocketConnection.bind(this));
  }

  private async onProtocolUpgrade(
    request: TRequest,
    socket: stream.Duplex,
    upgradeHead: Buffer
  ) {
    const isRequestAuthorized = this.config.isAuthorized
      ? await this.config.isAuthorized(request)
      : true;

    if (!isRequestAuthorized) {
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
