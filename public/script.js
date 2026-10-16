document.addEventListener('DOMContentLoaded', () => {
    const reservaForm = document.getElementById('reservaForm');
    const mensagemReserva = document.getElementById('mensagemReserva');
    const onibusLayout = document.getElementById('onibusLayout');
    const passageirosInput = document.getElementById('passageiros');
    const inputAssentosSelecionados = document.getElementById('assentosSelecionados');

    let assentosSelecionados = [];

    // Gerar assentos no formulário web principal
    if (onibusLayout) {
        const totalAssentos = 45; // 45 lugares
        for (let i = 1; i <= totalAssentos; i++) {
            const divAssento = document.createElement('div');
            divAssento.classList.add('assento');
            divAssento.textContent = i;

            // Simular alguns assentos ocupados aleatoriamente
            if (Math.random() < 0.3) {
                divAssento.classList.add('ocupado');
            } else {
                divAssento.addEventListener('click', () => toggleAssento(divAssento, i));
            }
            onibusLayout.appendChild(divAssento);

            if (i < 41 && i % 2 === 0 && i % 4 !== 0) {
                const divCorredor = document.createElement('div');
                divCorredor.classList.add('corredor');
                onibusLayout.appendChild(divCorredor);
            }
        }
    }

    function toggleAssento(elemento, numero) {
        const maxPassageiros = parseInt(passageirosInput.value, 10);

        if (elemento.classList.contains('selecionado')) {
            elemento.classList.remove('selecionado');
            assentosSelecionados = assentosSelecionados.filter(n => n !== numero);
        } else {
            if (assentosSelecionados.length < maxPassageiros) {
                elemento.classList.add('selecionado');
                assentosSelecionados.push(numero);
            } else {
                alert(`Você só pode selecionar ${maxPassageiros} assento(s), conforme informado no campo "Número de Passageiros".`);
            }
        }
        inputAssentosSelecionados.value = assentosSelecionados.join(', ');
    }

    if (passageirosInput) {
        passageirosInput.addEventListener('change', (e) => {
             const max = parseInt(e.target.value, 10);
             if (assentosSelecionados.length > max) {
                 alert('Você reduziu o número de passageiros. Por favor, selecione seus assentos novamente.');
                 assentosSelecionados = [];
                 inputAssentosSelecionados.value = '';
                 document.querySelectorAll('.assento.selecionado').forEach(el => el.classList.remove('selecionado'));
             }
        });
    }

    if (reservaForm) {
        reservaForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const origem = document.getElementById('origem').value;
            const destino = document.getElementById('destino').value;
            const dataIda = document.getElementById('dataIda').value;
            const passageiros = document.getElementById('passageiros').value;
            const pixContainer = document.getElementById('pixContainer');

            if(assentosSelecionados.length !== parseInt(passageiros, 10)) {
                alert(`Por favor, selecione exatamente ${passageiros} assento(s).`);
                return;
            }

            if (origem && destino && dataIda && passageiros) {
                const assentosMsg = assentosSelecionados.length > 0 ? `Assento(s): ${assentosSelecionados.join(', ')}.` : '';

                mensagemReserva.textContent = "Gerando pagamento PIX, aguarde...";
                mensagemReserva.className = 'mensagem-sucesso';
                pixContainer.style.display = 'none';

                try {
                    const response = await fetch('/api/pay/pix', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            passengers: passageiros,
                            description: `Reserva Bastos Express: ${origem} para ${destino} - ${passageiros} passageiro(s)`,
                            payer: {
                                email: "cliente@email.com",
                                first_name: "Cliente",
                                last_name: "Teste",
                                identification: {
                                    type: "CPF",
                                    number: "19119119100"
                                }
                            }
                        })
                    });

                    const data = await response.json();

                    if (response.ok && data.qr_code_base64) {
                        mensagemReserva.textContent = `Busca realizada com sucesso! Passagens reservadas de ${origem} para ${destino} na data ${dataIda} para ${passageiros} passageiro(s). ${assentosMsg}`;
                        mensagemReserva.className = 'mensagem-sucesso';

                        document.getElementById('pixQrCode').src = `data:image/jpeg;base64,${data.qr_code_base64}`;
                        document.getElementById('pixCopiaCola').value = data.qr_code;
                        pixContainer.style.display = 'block';

                        reservaForm.reset();
                        assentosSelecionados = [];
                        inputAssentosSelecionados.value = '';
                        document.querySelectorAll('.assento.selecionado').forEach(el => el.classList.remove('selecionado'));
                    } else {
                        throw new Error(data.error || "Erro desconhecido ao gerar PIX");
                    }
                } catch (error) {
                    console.error("Erro na integração PIX:", error);
                    mensagemReserva.textContent = `Erro ao gerar pagamento PIX: ${error.message}. Por favor, tente novamente.`;
                    mensagemReserva.className = 'mensagem-erro';
                }
            }
        });
    }

    const btnCopiarPix = document.getElementById('btnCopiarPix');
    if (btnCopiarPix) {
        btnCopiarPix.addEventListener('click', () => {
            const copiaCola = document.getElementById('pixCopiaCola');
            copiaCola.select();
            copiaCola.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copiaCola.value)
                .then(() => alert("Código PIX copiado com sucesso!"))
                .catch(() => alert("Falha ao copiar o código."));
        });
    }

    // ==========================================
    // WHATSAPP CHATBOT WIDGET LOGIC
    // ==========================================
    const whatsappToggleBtn = document.getElementById('whatsappToggleBtn');
    const whatsappChatContainer = document.getElementById('whatsappChatContainer');
    const waChatCloseBtn = document.getElementById('waChatCloseBtn');
    const waChatBody = document.getElementById('waChatBody');
    const waChatInput = document.getElementById('waChatInput');
    const waChatSendBtn = document.getElementById('waChatSendBtn');

    const sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
    let chatInitialized = false;

    if (whatsappToggleBtn && whatsappChatContainer) {
        whatsappToggleBtn.addEventListener('click', () => {
            whatsappChatContainer.classList.toggle('active');
            if (whatsappChatContainer.classList.contains('active') && !chatInitialized) {
                chatInitialized = true;
                sendBotRequest('');
            }
        });
    }

    if (waChatCloseBtn) {
        waChatCloseBtn.addEventListener('click', () => {
            whatsappChatContainer.classList.remove('active');
        });
    }

    if (waChatSendBtn && waChatInput) {
        waChatSendBtn.addEventListener('click', () => {
            const text = waChatInput.value.trim();
            if (text) {
                appendUserMessage(text);
                waChatInput.value = '';
                sendBotRequest(text);
            }
        });

        waChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                waChatSendBtn.click();
            }
        });
    }

    async function sendBotRequest(message, payload = {}) {
        try {
            const response = await fetch('/api/whatsapp/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message, payload })
            });

            const data = await response.json();
            if (response.ok) {
                renderBotResponse(data);
            } else {
                appendBotMessage("Ops! Ocorreu um erro na comunicação. Digite 'menu' para recomeçar.");
            }
        } catch (err) {
            console.error("Erro no chat do WhatsApp:", err);
            appendBotMessage("Desculpe, falha na conexão. Digite 'menu' para tentar novamente.");
        }
    }

    function appendUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'wa-msg wa-msg-user';
        msgDiv.textContent = text;
        waChatBody.appendChild(msgDiv);
        waChatBody.scrollTop = waChatBody.scrollHeight;
    }

    function appendBotMessage(formattedText, options = [], customData = {}) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'wa-msg wa-msg-bot';

        // Format bold text from *text* to <strong>text</strong> and line breaks
        let htmlText = formattedText
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        msgDiv.innerHTML = htmlText;

        // Render date picker if needed
        if (customData.showDatePicker) {
            const dateInputDiv = document.createElement('div');
            dateInputDiv.style.marginTop = '10px';
            dateInputDiv.innerHTML = `
                <div style="font-size:0.8rem; font-weight:bold; margin-bottom:4px;">Ou escolha outra data:</div>
                <input type="date" id="waCustomDate" style="width:100%; padding:6px; font-size:0.85rem; border:1px solid #ccc; border-radius:4px;">
                <button id="waSubmitDateBtn" style="margin-top:6px; width:100%; padding:6px; background:#075e54; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Confirmar Data</button>
            `;
            msgDiv.appendChild(dateInputDiv);

            setTimeout(() => {
                const btn = dateInputDiv.querySelector('#waSubmitDateBtn');
                const dateIn = dateInputDiv.querySelector('#waCustomDate');
                if (btn && dateIn) {
                    btn.addEventListener('click', () => {
                        if (dateIn.value) {
                            const parts = dateIn.value.split('-');
                            const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
                            appendUserMessage(`Data: ${formatted}`);
                            sendBotRequest('', { date: formatted });
                        }
                    });
                }
            }, 0);
        }

        // Render seat grid if requested
        if (customData.showSeatPicker && customData.totalSeats) {
            const seatContainer = document.createElement('div');
            seatContainer.className = 'wa-seat-grid';

            for (let i = 1; i <= customData.totalSeats; i++) {
                const seatBtn = document.createElement('button');
                seatBtn.className = 'wa-seat-btn';
                seatBtn.textContent = i;

                if (customData.occupiedSeats && customData.occupiedSeats.includes(i)) {
                    seatBtn.classList.add('occupied');
                    seatBtn.title = "Ocupado";
                } else {
                    seatBtn.addEventListener('click', () => {
                        appendUserMessage(`Poltrona ${i}`);
                        sendBotRequest('', { seat: i });
                    });
                }
                seatContainer.appendChild(seatBtn);
            }
            msgDiv.appendChild(seatContainer);
        }

        // Render QR code / PIX info if returned in data
        if (customData.qr_code_base64) {
            const pixDiv = document.createElement('div');
            pixDiv.style.marginTop = '10px';
            pixDiv.style.textAlign = 'center';
            pixDiv.innerHTML = `
                <img src="data:image/jpeg;base64,${customData.qr_code_base64}" style="max-width:180px; border-radius:8px; margin: 8px 0;"/>
                <textarea readonly id="waPixCopyText" style="width:100%; font-size:0.75rem; rows:3; padding:4px; resize:none;">${customData.qr_code}</textarea>
                <button id="waCopyPixBtn" style="width:100%; margin-top:4px; padding:6px; background:#25d366; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Copiar Código Pix</button>
            `;
            msgDiv.appendChild(pixDiv);

            setTimeout(() => {
                const copyBtn = pixDiv.querySelector('#waCopyPixBtn');
                const copyText = pixDiv.querySelector('#waPixCopyText');
                if (copyBtn && copyText) {
                    copyBtn.addEventListener('click', () => {
                        copyText.select();
                        navigator.clipboard.writeText(copyText.value);
                        alert('Código PIX copiado com sucesso!');
                    });
                }
            }, 0);
        }

        // Render options buttons
        if (options && options.length > 0) {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'wa-options-container';

            options.forEach(opt => {
                const optBtn = document.createElement('button');
                optBtn.className = 'wa-option-btn';
                optBtn.textContent = opt.label;
                optBtn.addEventListener('click', () => {
                    appendUserMessage(opt.label);
                    sendBotRequest(opt.id);
                });
                optionsDiv.appendChild(optBtn);
            });
            msgDiv.appendChild(optionsDiv);
        }

        waChatBody.appendChild(msgDiv);
        waChatBody.scrollTop = waChatBody.scrollHeight;
    }

    function renderBotResponse(data) {
        appendBotMessage(data.text, data.options, data.data || {});
    }
});
