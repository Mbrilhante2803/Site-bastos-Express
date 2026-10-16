require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { MercadoPagoConfig, Payment } = require("mercadopago");

const app = express();
const port = process.env.PORT || 3000;

// Configurar as credenciais do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000' });

app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for WhatsApp bot sessions
const whatsappSessions = new Map();

// Helper to generate occupied seats consistently
function getOccupiedSeatsForDate(dateStr) {
    let hash = 0;
    for (let i = 0; i < (dateStr || "").length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash |= 0;
    }
    const occupied = new Set();
    const totalAssentos = 45;
    for (let i = 1; i <= totalAssentos; i++) {
        if (Math.abs((hash * i) % 10) < 3) {
            occupied.add(i);
        }
    }
    return Array.from(occupied);
}

// Function to process bot conversation state logic
async function processWhatsAppBotMessage(sessionId, userMessage, payload = {}) {
    let session = whatsappSessions.get(sessionId) || { state: 'START' };
    const text = (userMessage || "").trim().toLowerCase();

    // Reset command
    if (text === 'menu' || text === 'início' || text === 'inicio' || text === '0' || text === 'voltar') {
        session = { state: 'START' };
    }

    let response = {
        sessionId,
        text: "",
        options: [],
        state: session.state,
        data: {}
    };

    switch (session.state) {
        case 'START':
            session.state = 'AWAITING_MAIN_OPTION';
            whatsappSessions.set(sessionId, session);
            response.text = `🚌 *Olá! Seja bem-vindo à Bastos Express!* 👋\n\nComo posso te ajudar hoje? Escolha uma das opções abaixo:`;
            response.options = [
                { id: '1', label: '1️⃣ Encomenda' },
                { id: '2', label: '2️⃣ Passagem Normal' },
                { id: '3', label: '3️⃣ Dúvidas com a Central' }
            ];
            break;

        case 'AWAITING_MAIN_OPTION':
            if (text === '1' || text.includes('encomenda')) {
                session.state = 'ENCOMENDA_INFO';
                whatsappSessions.set(sessionId, session);
                response.text = `📦 *Envio de Encomendas - Bastos Express*\n\nPara despachar ou consultar encomendas, fale diretamente com o nosso setor de cargas e despachos:\n\n📞 *WhatsApp Cargas:* (11) 98888-7777\n⏰ *Horário de Atendimento:* Seg a Caxias das 08h às 18h\n📍 *Guichê Principal:* Terminal Rodoviário - Loja 12\n\nVocê precisa de mais alguma informação?`;
                response.options = [
                    { id: 'menu', label: '🔙 Voltar ao Menu Principal' }
                ];
            } else if (text === '2' || text.includes('passagem') || text.includes('normal')) {
                session.state = 'AWAITING_DATE';
                whatsappSessions.set(sessionId, session);
                response.text = `🎟️ *Compra de Passagem Normal*\n\nPor favor, selecione ou informe a **data da viagem** (Exemplo: DD/MM/AAAA):`;

                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dayAfter = new Date(today);
                dayAfter.setDate(dayAfter.getDate() + 2);

                const formatDate = (d) => d.toLocaleDateString('pt-BR');

                response.options = [
                    { id: formatDate(today), label: `📅 Hoje (${formatDate(today)})` },
                    { id: formatDate(tomorrow), label: `📅 Amanhã (${formatDate(tomorrow)})` },
                    { id: formatDate(dayAfter), label: `📅 ${formatDate(dayAfter)}` }
                ];
                response.data = { showDatePicker: true };
            } else if (text === '3' || text.includes('dúvidas') || text.includes('duvidas') || text.includes('central')) {
                session.state = 'DUVIDAS_INFO';
                whatsappSessions.set(sessionId, session);
                response.text = `🎧 *Central de Atendimento - Bastos Express*\n\nEstamos prontos para atende-lo!\n\n📞 *Atendimento 24h:* 0800 123 4567\n💬 *Atendimento WhatsApp:* (11) 99999-9999\n📧 *E-mail:* contato@bastosexpress.com.br\n\nComo podemos te ajudar mais?`;
                response.options = [
                    { id: 'menu', label: '🔙 Voltar ao Menu Principal' }
                ];
            } else {
                response.text = `⚠️ Ops, não entendi essa opção.\n\nPor favor, escolha uma das opções abaixo:`;
                response.options = [
                    { id: '1', label: '1️⃣ Encomenda' },
                    { id: '2', label: '2️⃣ Passagem Normal' },
                    { id: '3', label: '3️⃣ Dúvidas com a Central' }
                ];
            }
            break;

        case 'AWAITING_DATE':
            const selectedDate = payload.date || userMessage;
            if (selectedDate && selectedDate.trim().length >= 5) {
                session.date = selectedDate.trim();
                session.state = 'AWAITING_SEAT';
                whatsappSessions.set(sessionId, session);

                const occupied = getOccupiedSeatsForDate(session.date);

                response.text = `📅 Data selecionada: *${session.date}*\n\n💺 Por favor, selecione o seu **assento disponível** no mapa abaixo:`;
                response.data = {
                    date: session.date,
                    totalSeats: 45,
                    occupiedSeats: occupied,
                    showSeatPicker: true
                };
                response.options = [
                    { id: 'menu', label: '🔙 Cancelar e Voltar ao Menu' }
                ];
            } else {
                response.text = `⚠️ Por favor, informe uma data válida no formato DD/MM/AAAA.`;
                response.options = [
                    { id: 'menu', label: '🔙 Voltar ao Menu' }
                ];
            }
            break;

        case 'AWAITING_SEAT':
            const selectedSeat = parseInt(payload.seat || userMessage, 10);
            if (!isNaN(selectedSeat) && selectedSeat >= 1 && selectedSeat <= 45) {
                const occupied = getOccupiedSeatsForDate(session.date);
                if (occupied.includes(selectedSeat)) {
                    response.text = `⚠️ O assento **poltrona ${selectedSeat}** já está ocupado para o dia ${session.date}. Por favor escolha outro assento.`;
                    response.data = {
                        date: session.date,
                        totalSeats: 45,
                        occupiedSeats: occupied,
                        showSeatPicker: true
                    };
                } else {
                    session.seat = selectedSeat;
                    session.state = 'CONFIRMED';
                    whatsappSessions.set(sessionId, session);

                    // Generate PIX Payment
                    try {
                        const price = 50;
                        const payment = new Payment(client);
                        const requestOptions = {
                            idempotencyKey: Math.random().toString(36).substring(7)
                        };

                        const body = {
                            transaction_amount: price,
                            description: `Passagem Bastos Express - Data: ${session.date} - Poltrona ${session.seat}`,
                            payment_method_id: "pix",
                            payer: {
                                email: payload.email || "cliente.whatsapp@bastosexpress.com",
                                first_name: "Cliente",
                                last_name: "WhatsApp",
                                identification: {
                                    type: "CPF",
                                    number: "19119119100"
                                }
                            }
                        };

                        const mpResult = await payment.create({ body, requestOptions });

                        response.text = `✅ *Resumo da sua Reserva*\n\n🚌 *Empresa:* Bastos Express\n📅 *Data:* ${session.date}\n💺 *Poltrona:* ${session.seat}\n💰 *Valor:* R$ 50,00\n\n🎉 Seu assento foi reservado com sucesso!\nPara finalizar, realize o pagamento via PIX apontando a câmera para o QR Code abaixo ou copiando a chave Pix:`;
                        response.data = {
                            qr_code: mpResult.point_of_interaction?.transaction_data?.qr_code,
                            qr_code_base64: mpResult.point_of_interaction?.transaction_data?.qr_code_base64,
                            seat: session.seat,
                            date: session.date,
                            price: 50
                        };
                        response.options = [
                            { id: '2', label: '🎫 Comprar outra passagem' },
                            { id: 'menu', label: '🔙 Menu Principal' }
                        ];
                    } catch (err) {
                        console.error("Erro no Mercado Pago via WhatsApp bot:", err);
                        response.text = `✅ *Resumo da Reserva*\n\n🚌 *Empresa:* Bastos Express\n📅 *Data:* ${session.date}\n💺 *Poltrona:* ${session.seat}\n💰 *Valor:* R$ 50,00\n\n(O código PIX em modo de teste pode ser pago no guichê ou chave Pix: 11999999999).`;
                        response.options = [
                            { id: '2', label: '🎫 Comprar outra passagem' },
                            { id: 'menu', label: '🔙 Menu Principal' }
                        ];
                    }
                }
            } else {
                response.text = `⚠️ Por favor, escolha um número de assento válido de 1 a 45.`;
                response.data = {
                    date: session.date,
                    totalSeats: 45,
                    occupiedSeats: getOccupiedSeatsForDate(session.date),
                    showSeatPicker: true
                };
            }
            break;

        default:
            session.state = 'START';
            return processWhatsAppBotMessage(sessionId, userMessage, payload);
    }

    response.state = session.state;
    return response;
}

// API endpoint for Web WhatsApp Chat widget
app.post("/api/whatsapp/message", async (req, res) => {
    try {
        const { sessionId = 'default_user', message = '', payload = {} } = req.body;
        const result = await processWhatsAppBotMessage(sessionId, message, payload);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error processing WhatsApp bot message:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Standard WhatsApp Cloud API Webhook Verification (GET)
app.get("/api/whatsapp/webhook", (req, res) => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "bastos_express_token";
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === verifyToken) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Standard WhatsApp Cloud API Webhook Handling (POST)
app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
        const body = req.body;
        if (body.object === "whatsapp_business_account") {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];

            if (message) {
                const from = message.from;
                const msgText = message.text?.body || message.interactive?.button_reply?.id || "";

                const botResult = await processWhatsAppBotMessage(from, msgText);
                console.log(`WhatsApp message from ${from}: ${msgText} -> Bot Response: ${botResult.text}`);
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error("Error handling WhatsApp webhook:", error);
        res.sendStatus(500);
    }
});

app.post("/api/pay/pix", async (req, res) => {
    try {
        const { passengers, description, payer } = req.body;

        const pricePerPassenger = 50;
        const totalPassengers = parseInt(passengers, 10);

        if (isNaN(totalPassengers) || totalPassengers <= 0) {
             return res.status(400).json({ error: "Invalid passenger count" });
        }

        const transaction_amount = totalPassengers * pricePerPassenger;

        const payment = new Payment(client);
        const requestOptions = {
            idempotencyKey: Math.random().toString(36).substring(7)
        };

        const body = {
            transaction_amount: transaction_amount,
            description: description || "Reserva de Passagem Bastos Express",
            payment_method_id: "pix",
            payer: {
                email: payer?.email || "dummy_email@test.com",
                first_name: payer?.first_name || "Cliente",
                last_name: payer?.last_name || "Bastos",
                identification: {
                    type: payer?.identification?.type || "CPF",
                    number: payer?.identification?.number || "19119119100"
                }
            }
        };

        const result = await payment.create({ body, requestOptions });

        res.status(200).json({
            id: result.id,
            status: result.status,
            qr_code: result.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64
        });
    } catch (error) {
        console.error("Error creating PIX payment:", error);
        res.status(500).json({ error: "Failed to create PIX payment" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
