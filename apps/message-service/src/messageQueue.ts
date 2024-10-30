import amqp from "amqplib/callback_api";
import { MessageType, Subscription } from "./types";
import dotenv from "dotenv";

dotenv.config();

const messageQueue = "message_queue";
const notificationQueue = "notification_queue";

const rabbitmq_url = process.env.RABBITMQ_URL || "amqp://user:password@localhost";

class MessageQueue {
  private connection: any;
  private channel: any;
  private notificationchannel: any;

  constructor() {
    amqp.connect(rabbitmq_url, (error0, connection) => {
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
      connection.createChannel((error1, ch)=>{
        if(error1){
          throw error1;
        }
        ch.assertQueue(notificationQueue, {
          durable: true,
        });
        console.log(
          `Waitting for notification in ${notificationQueue}.`
        )
        this.notificationchannel = ch;
      })
    });
  }

    public pushMessage(message: MessageType) {
        this.channel.sendToQueue(messageQueue, Buffer.from(JSON.stringify(message)));
    }

    public pushNotification(message: any) {
        this.notificationchannel.sendToQueue(notificationQueue, Buffer.from(JSON.stringify(message)));
    }
}

export default MessageQueue;