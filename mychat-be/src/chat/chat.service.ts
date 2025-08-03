import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './schemas/message.schema';
import { Model } from 'mongoose';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async saveMessage(payload: {
    senderId: string;
    receiverId: string;
    content: string;
  }) {
    const message = new this.messageModel(payload);
    return message.save();
  }

  async getMessagesBetween(userA: string, userB: string) {
    return this.messageModel
      .find({
        $or: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();
  }
}
