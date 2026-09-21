import { Sticker } from "wa-sticker-formatter";
import fs from "fs";
import { proto } from "@whiskeysockets/baileys/WAProto";

export const StickerCreator = async (Image: Buffer): Promise<Buffer> => {
   const sticker = new Sticker(
        Image,
        {
            pack: "Meu Bot",
            author: "Anderson",
            type: "full",
            quality: 80
        }
    );

    return await sticker.toBuffer();
}