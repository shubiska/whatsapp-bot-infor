// #region Imports

import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

// #endregion


// #region Logging

enum Messages {
    BotSetup = "Iniciando Bot...",
    BotAuth = "Escaneie o Código QR abaixo para conecta-lo ao WhatsApp:",
    BotReady = "Bot Online!",
}

function LogMessage(message: Messages) {
    console.log(message);
}

// #endregion


// #region Client Setup & Events 

const client: Client = new Client({
    authStrategy: new LocalAuth()
});

client.on("qr", (qr) => {
    LogMessage(Messages.BotAuth);
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    LogMessage(Messages.BotReady);
});

type MenuOption = {
    label: string;
    reply: string;
    finished: string;
};

const Menu: MenuOption[] = [
    {
        label: "Falta de internet",
        reply: "Que militar/seção está enfrentando a falta de internet?",
        finished: "Um militar ja irá lhe atender."
    },
    {
        label: "Instalação de impressora",
        reply: "Qual seção precisa deste serviço?",
        finished: "Um militar ja irá lhe atender."
    },
    {
        label: "Manutenção de computador/rede",
        reply: "Descreva o problema com o computador/rede?",
        finished: "Um militar ja irá lhe atender."
    },
    {
        label: "SPED",
        reply: "Menu em desenvolvimento...",
        finished: "Dados recebidos, solicitação encaminhada."
    },
    {
        label: "Instalação de Aplicativo",
        reply: "Menu em desenvolvimento...",
        finished: "Solicitação recebida. Um militar auxiliará na instalação."
    },
    {
        label: "Apoio videoconferência",
        reply: "Qual o local(plataforma), data e horário da videoconferência?",
        finished: "Apoio confirmado. Um militar será escalado para o evento."
    },
    {
        label: "Falar com militar",
        reply: "Você deseja falar com um militar?",
        finished: "Um militar ja irá lhe atender."
    }
];

const UserStates = new Map();

enum STATES {
    NEW,
    MENU0,
    MENU1,
    DONE,
}

function GetState(user: string) {
    return UserStates.get(user) || STATES.NEW;
}

function SetState(user: string, state: STATES) {
    UserStates.set(user, state);
}

function ToDigit(str: string) {
    if (/^[0-9]$/.test(str)) {
        return Number(str);
    }
    return -1;
}

function MessageReply(msg: Message) {
    const state = GetState(msg.from);

    // Menu Inicial
    if (state == STATES.NEW) {
        var reply: string = "Olá, seção de informática EB. Com o que precisa de ajuda?";
        for (let i = 0; i < Menu.length; i++) {
            reply += `\n${i + 1}. ${Menu[i].label}`;
        }

        msg.reply(reply);
        SetState(msg.from, STATES.MENU0);
    }
}

var ChosenMenu: number = 0;

client.on("message", (msg) => {
    //Ignorar mensagens de si mesmo e de grupos
    if (msg.fromMe || msg.from.includes("@g.us")) return;

    const state = GetState(msg.from);

    if ((state == STATES.NEW || state == STATES.DONE) && msg.body == "!ajuda") {
        MessageReply(msg);

        return;
    }

    if (state == STATES.MENU0) {
        const digit: number = ToDigit(msg.body);
        if (digit > 0 && digit <= Menu.length) {
            msg.reply(`${Menu[digit - 1].reply}`);
            ChosenMenu = digit - 1;
            SetState(msg.from, STATES.MENU1);
        } else {
            msg.reply("Opção inválida. Por favor, escolha uma opção com um digito entre 1 e ${Menu.length}.");
        }

        return
    }

    if (state == STATES.MENU1) {
        msg.reply(Menu[ChosenMenu].finished);
        SetState(msg.from, STATES.NEW);
        return;
    }
});

// #endregion


// #region Setup

LogMessage(Messages.BotSetup);
client.initialize();

// #endregion
