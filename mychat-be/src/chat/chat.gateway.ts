import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatService } from './chat.service';

interface ChatPayload {
  senderId: string;
  receiverId: string;
  content: string;
}

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private chatService: ChatService) {}

  private clients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.clients.set(userId, client);
      console.log(`User ${userId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.clients.entries()) {
      if (socket === client) {
        this.clients.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() payload: ChatPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const savedMessage = await this.chatService.saveMessage(payload);

    // Gửi tin nhắn cho chính sender (optional)
    client.emit('new_message', savedMessage);

    // Gửi cho receiver nếu online
    const receiverSocket = this.clients.get(payload.receiverId);
    if (receiverSocket) {
      receiverSocket.emit('new_message', savedMessage);
    }
  }
}
