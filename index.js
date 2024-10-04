const express = require('express');
const app = express();
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const fs = require('fs');
let noticias = require('./noticias.json');
let usuarios = require('./usuarios.json');

// Adicione o http e socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

var handle = exphbs.create({
    defaultLayout: 'main'
});

app.use(session({
    secret: 'chave_secreta',
    resave: false,
    saveUninitialized: true
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.engine('handlebars', handle.engine);
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, "public")));

app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Rota de login
app.post('/login', (req, res) => {
    const { user, senha } = req.body;

    if (!user || !senha) {
        req.flash('error_msg', 'Preencha todos os campos!');
        return res.redirect('/login');
    }

    let usuarioEncontrado = false;
    usuarios.forEach(element => {
        if (user === element.user && senha === element.senha) {
            req.session.user = {
                logado: true,
                nome: element.nome,
                user: element.user,
                avatar: element.avatar
            };
            req.flash('success_msg', 'Login realizado com sucesso!');
            usuarioEncontrado = true;
            return res.redirect('/dashboard');
        }
    });

    if (!usuarioEncontrado) {
        req.flash('error_msg', 'Usuário ou senha não encontrados!');
        res.redirect('/login');
    }
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.redirect('/');
    });
});

// Rota de login (GET)
app.get('/login', (req, res) => {
    res.render('auth/login', { logado: req.session?.user?.logado });
});

// Rota de dashboard (GET)
app.get('/dashboard', (req, res) => {
    if (!req.session.user?.logado) {
        req.flash('error_msg', 'Você precisa estar logado para acessar essa página.');
        return res.redirect("/login");
    }
    res.render('admin/dashboard', { 
        logado: req.session.user.logado, 
        nome: req.session.user.nome, 
        avatar: req.session.user.avatar 
    });
});

// Rota de index
app.get('/', function (req, res) {
    res.render('index', {
        noticias: noticias, 
        logado: req.session?.user?.logado || false, 
        nome: req.session?.user?.nome || '', 
        avatar: req.session?.user?.avatar || ''
    });
});

function adicionarNoticia(titulo, descricao, imagem) {

    const novaNoticia = {
        titulo: titulo,
        descricao: descricao,
        imagem: imagem,
        data: new Date().toISOString()
    };

    noticias.push(novaNoticia);
    
    fs.writeFile('./noticias.json', JSON.stringify(noticias, null, 2), (err) => {
        if (err) {
            console.error('Erro ao salvar o arquivo JSON', err);
            return;
        }
    });

    // Emitir a nova notícia para todos os clientes conectados
    io.emit('nova-noticia', novaNoticia);
}

// Rota para adicionar notícia
app.post('/noticia', (req, res) => {
    const { titulo, desc, img } = req.body;

    if (!titulo || !desc || !img) {
        req.flash('error_msg', 'Preencha todos os campos!');
        return res.redirect('/dashboard');
    }

    if(!req.session?.user?.logado){
        return res.redirect('/');
    }

    req.flash('success_msg', 'Notícia adicionada com sucesso!');
    adicionarNoticia(titulo, desc, img);
    return res.redirect('/dashboard')
});

// Inicializando o servidor com Socket.io
server.listen(3000, function () {
    console.log('[+] Servidor rodando na porta 3000');
});