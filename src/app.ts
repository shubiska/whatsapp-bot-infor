// #region Imports

import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

// #endregion


// #region Startup Messages

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
    authStrategy: new LocalAuth(),
    puppeteer: {
    executablePath:
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true
    }
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
    replies: string[];
    finisher: string;
};

const MenuStarter: string = "Olá, seção de informática 9º BIMTZ. \nCom o que precisa de ajuda?\n";
const MenuFinisher: string = "\n(Mensagens subsequentes dentro de 5 minutos serão adicionadas ao chamado)";
const Menu: MenuOption[] = [
    {
        label: "Falta de internet",
        replies: ["Que militar/seção está enfrentando a falta de internet?"],
        finisher: "Um militar ja irá lhe atender."
    },
    {
        label: "Instalação de impressora",
        replies: ["Qual seção precisa deste serviço?"],
        finisher: "Um militar ja irá lhe atender."
    },
    {
        label: "Manutenção de computador/rede",
        replies: ["Descreva o problema com o computador/rede?"],
        finisher: "Um militar ja irá lhe atender."
    },
    {
        label: "SPED",
        replies: ["Menu em desenvolvimento..."],
        finisher: "Dados recebidos, solicitação encaminhada."
    },
    {
        label: "Instalação de Aplicativo",
        replies: ["Qual seção precisa deste serviço?", "Que aplicativo precisa ser instalado?"],
        finisher: "Solicitação recebida. Um militar auxiliará na instalação."
    },
    {
        label: "Apoio videoconferência",
        replies: ["Qual a data da videoconferência?", "Qual o horario da videoconferência?", "Qual a plataforma da videoconferência?"],
        finisher: "Apoio confirmado. Um militar será escalado para o evento."
    },
    {
        label: "Falar com militar",
        replies: ["Você deseja falar com um militar?"],
        finisher: "Um militar ja irá lhe atender."
    }
];

const UserStates = new Map();
const UserStateDefault: UserState = { subMenu: 0, subReply: 0};
type UserState = {
    subMenu: number;
    subReply: number;
    endTime?: number;
};

function GetState(user: string): UserState {
    return UserStates.get(user) ?? UserStateDefault;
}

function SetState(user: string, state: UserState) {
    UserStates.set(user, state);
}

function ToDigit(str: string) {
    if (/^[0-9]$/.test(str)) {
        return Number(str);
    }
    return -1;
}

function MessageReply(msg: Message) {
    var state = GetState(msg.from);

    // Menu Inicial
    if (state.subMenu == -1 || msg.body == "!ajuda") {
        var reply: string = MenuStarter;
        for (let i = 0; i < Menu.length; i++) {
            reply += `\n${i + 1}. ${Menu[i].label}`;
        }

        state.subMenu = 0;
        state.subReply = 0;

        SetState(msg.from, state);
        msg.reply(reply);

        return;
    }

    // Primeiro Submenu
    if (state.subMenu == 0) {
        const digit: number = ToDigit(msg.body);

        if (digit <= 0 || digit > Menu.length) {
            msg.reply(`Opção inválida. Por favor, escolha uma opção com um digito entre 1 e ${Menu.length}.`);

            return;
        }

        state.subMenu = digit - 1;

        SetState(msg.from, state);
        msg.reply(`${Menu[state.subMenu].replies[0]}`);

        return
    }

    // Subsequentes perguntas
    if (state.subMenu > 1) {
        state.subReply ++;

        if (state.subReply > Menu[state.subMenu].replies.length - 1) {
            msg.reply(`${Menu[state.subMenu].finisher} ${MenuFinisher}`);

            state.subMenu = -2;
            state.subReply = 0;
            state.endTime = msg.timestamp;

            return;
        }

        SetState(msg.from, state);
        msg.reply(`${Menu[state.subMenu].replies[state.subReply]}`);

        return
    }

    // Conversa Finalizada
    if (state.subMenu == -2) {
        if (msg.timestamp > state.endTime! + 300) {

            state = UserStateDefault;
            state.subMenu = -1;

            SetState(msg.from, UserStateDefault);
            MessageReply(msg);

            return;
        }

        msg.reply("adicionado ao chamado.");

        return
    }
}

client.on("message", (msg) => {

    console.log(msg.body)
    //Ignorar mensagens de si mesmo e de grupos
    if (msg.from.includes("@g.us")) return;
        MessageReply(msg);
});

// #endregion


// #region Setup

LogMessage(Messages.BotSetup);
client.initialize();

// #endregion
