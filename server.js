require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { MercadoPagoConfig, Payment } = require("mercadopago");

const app = express();
const port = process.env.PORT || 3000;

// Configurar as credenciais do Mercado Pago
// Substitua pelo seu Access Token no arquivo .env
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000' });

app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(path.join(__dirname, 'public')));

app.post("/api/pay/pix", async (req, res) => {
    try {
        const { passengers, description, payer } = req.body;

        // Ensure price calculation happens securely on the server
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
