require('dotenv').config(); // Carrega as variáveis de ambiente
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Adicionado CORS

const app = express();
const port = 4000;

// Middleware para parsear o corpo das requisições
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Usar CORS

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/meu-banco-de-dados')
    .then(() => {
        console.log('Conectado ao MongoDB');
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });

// Definir o Schema do formulário
const formularioSchema = new mongoose.Schema({
    nome: String,
    email: String,
    mensagem: String
});

const Formulario = mongoose.model('Formulario', formularioSchema);

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Usa a variável de ambiente
        pass: process.env.EMAIL_PASS  // Usa a variável de ambiente
    }
});

// Rota para receber o formulário
app.post('/enviar-formulario', async (req, res) => {
    try {
        const { nome, email, mensagem } = req.body;

        // Validação básica
        if (!nome || !email || !mensagem) {
            return res.status(400).send('Todos os campos são obrigatórios.');
        }

        // Salvar no banco de dados
        const novoFormulario = new Formulario({ nome, email, mensagem });
        await novoFormulario.save();

        // Enviar email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'destinatario@example.com',
            subject: 'Novo formulário de contato',
            text: `Nome: ${nome}\nEmail: ${email}\nMensagem: ${mensagem}`
        };

        await transporter.sendMail(mailOptions);

        // Responder ao cliente
        res.send('Formulário recebido, salvo e email enviado com sucesso!');
    } catch (error) {
        console.error('Erro ao processar o formulário:', error);
        res.status(500).send('Erro ao processar o formulário.');
    }
});

// Rota para buscar mensagens
app.get('/buscar-mensagens', async (req, res) => {
    try {
        const mensagens = await Formulario.find();
        res.json(mensagens);
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});