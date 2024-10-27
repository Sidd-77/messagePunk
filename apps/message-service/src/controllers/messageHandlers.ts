import { MessageType } from "../../types";
import logger from "../utils/logger";

export const handleMessages = async (msg: MessageType, socket: any, publisher: any) => {
    logger.info('Message received: ', msg);
    const msgString = JSON.stringify(msg);
    logger.info('Message stringified: ', msgString);
    await publisher.publish('message', msgString);
    logger.info('Message published: ', msg);
};