import makeWASocket, {
    DisconnectReason,
    downloadMediaMessage,
    useMultiFileAuthState
} from '@whiskeysockets/baileys'

import { Boom } from '@hapi/boom'
import qrcode from 'qrcode-terminal'
import { StickerCreator } from './utils/StickerCreator'

let reconnecting = false

async function connectToWhatsApp() {

    const { state, saveCreds } =
        await useMultiFileAuthState('auth_info_baileys')

    const sock = makeWASocket({
        auth: state
    })

    sock.ev.on('connection.update', (update) => {

        const { connection, lastDisconnect, qr } = update

        if (qr) {
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'open') {
            reconnecting = false
            console.log('opened connection')
        }

        if (connection === 'close') {

            const statusCode =
                (lastDisconnect?.error as Boom)?.output?.statusCode

            const shouldReconnect =
                statusCode !== DisconnectReason.loggedOut

            console.log(
                'connection closed due to',
                lastDisconnect?.error,
                ', reconnecting:',
                shouldReconnect
            )

            if (shouldReconnect && !reconnecting) {

                reconnecting = true

                setTimeout(() => {
                    connectToWhatsApp()
                }, 1000)
            }
        }
    })

    sock.ev.on('messages.upsert', async (event) => {

        for (const element of event.messages) {

            const image = element.message?.imageMessage

            if (!image) continue

            if (image.caption !== 'stickerlizi') continue

            try {

                const imageBuffer = await downloadMediaMessage(
                    element,
                    'buffer',
                    {}
                )

                const sticker = await StickerCreator(imageBuffer)

                if (!element.key.remoteJid) continue

                await sock.sendMessage(
                    element.key.remoteJid,
                    {
                        sticker
                    }
                )

            } catch (error) {

                console.error(
                    'Erro ao processar sticker:',
                    error
                )
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()