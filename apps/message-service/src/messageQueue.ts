import amqp from "amqplib/callback_api";
import { MessageType } from "../types";

const messageQueue = "message_queue";

class MessageQueue {
  private connection: any;
  private channel: any;

  constructor() {
    amqp.connect("amqp://user:password@localhost", (error0, connection) => {
      if (error0) {
        throw error0;
      }
      this.connection = connection;
      connection.createChannel((error1, channel) => {
        if (error1) {
          throw error1;
        }
        channel.assertQueue(messageQueue, {
          durable: false,
        });
        console.log(
          `Waiting for messages in ${messageQueue}. To exit press CTRL+C`
        );
        this.connection = connection;
        this.channel = channel;
      });
    });
  }

    public pushMessage(message: MessageType) {
        this.channel.sendToQueue(messageQueue, Buffer.from(JSON.stringify(message)));
    }
}

export default MessageQueue;