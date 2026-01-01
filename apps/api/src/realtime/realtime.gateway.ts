import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  path: '/socket.io',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() body: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const driverId = String(body?.driverId ?? '').trim();
    if (!driverId) {
      client.emit('error', { message: 'driverId is required' });
      return;
    }

    const room = `driver:${driverId}`;
    client.join(room);
    client.emit('joined', { room });
  }

  emitLocation(driverId: string, payload: any) {
    const room = `driver:${driverId}`;
    this.server.to(room).emit('location', payload);
  }
}
